import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import RiskProfile, { RiskLevel, computeRiskScore, riskProfileStorageKey } from './RiskProfile';
import {
  InvestmentFund,
  InvestmentPrediction,
  InvestmentType,
  getRecommendationsByRiskLevel,
  predictInvestmentGrowth,
  calculateSipProjection,
  compareInvestments,
} from '../../lib/investmentPrediction';

interface FundDetailResponse {
  meta: {
    fund_house: string;
    scheme_category: string;
    scheme_type: string;
    scheme_name: string;
  };
  data: { date: string; nav: string }[];
}

interface UserInvestmentPreferences {
  riskLevel: RiskLevel;
  customFunds: InvestmentFund[];
  editedRecommendations: Record<string, Partial<InvestmentFund>>;
}

interface EnhancedInvestmentsProps {
  userId: string | number;
}

const storageKey = (userId: string | number) => `mt_enhanced_investments_${userId}`;

export default function EnhancedInvestments({ userId }: EnhancedInvestmentsProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<InvestmentPrediction[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<InvestmentPrediction | null>(null);
  const [fundDetails, setFundDetails] = useState<Record<string, FundDetailResponse>>({});
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingFund, setEditingFund] = useState<InvestmentFund | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvestmentFund>>({});
  const [preferences, setPreferences] = useState<UserInvestmentPreferences | null>(null);
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundCode, setNewFundCode] = useState('');
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const prevRiskRef = React.useRef<RiskLevel | null>(null);
  const latestPreferencesRef = React.useRef<UserInvestmentPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  // Only re-load when riskLevel changes. Avoid tying this to preferences to prevent loops.
  useEffect(() => {
    if (!riskLevel) return;
    if (prevRiskRef.current === riskLevel && predictions.length > 0) return;
    prevRiskRef.current = riskLevel;
    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskLevel]);

  const loadPreferences = async () => {
    try {
      const raw = await AsyncStorage.getItem(storageKey(userId));
      if (raw) {
        const prefs = JSON.parse(raw) as UserInvestmentPreferences;
        setPreferences(prefs);
        latestPreferencesRef.current = prefs;
        // Avoid unnecessary state updates that can cause re-renders
        if (prefs.riskLevel && prefs.riskLevel !== riskLevel) {
          setRiskLevel(prefs.riskLevel);
        }
      } else {
        // Load from risk profile
        const riskRaw = await AsyncStorage.getItem(riskProfileStorageKey(userId));
        if (riskRaw) {
          const profile = JSON.parse(riskRaw);
          const computed = computeRiskScore(profile);
          if (computed.level !== riskLevel) {
            setRiskLevel(computed.level);
          }
          const defaultPrefs: UserInvestmentPreferences = {
            riskLevel: computed.level,
            customFunds: [],
            editedRecommendations: {},
          };
          setPreferences(defaultPrefs);
          latestPreferencesRef.current = defaultPrefs;
        }
      }
    } catch (e) {
      console.log('Error loading preferences', e);
    }
  };

  const savePreferences = async (prefs: UserInvestmentPreferences) => {
    setPreferences(prefs);
    latestPreferencesRef.current = prefs;
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  };

  const loadRecommendations = async () => {
    if (isLoadingRecommendations) return; // Prevent concurrent loads
    setIsLoadingRecommendations(true);
    setLoading(true);
    try {
      let recommendations = getRecommendationsByRiskLevel(riskLevel);
      
      // Apply user edits
      if (preferences?.editedRecommendations) {
        recommendations = recommendations.map(fund => ({
          ...fund,
          ...preferences.editedRecommendations[fund.id],
        }));
      }

      // Add custom funds
      if (preferences?.customFunds) {
        recommendations = [...recommendations, ...preferences.customFunds];
      }

      // Fetch historical data and generate predictions
      const predictionPromises = recommendations.map(async (fund) => {
        try {
          const res = await fetch(`https://api.mfapi.in/mf/${fund.code}`);
          if (res.ok) {
            const data = await res.json() as FundDetailResponse;
            // Batch update: avoid setState thrash by staging then merging
            setFundDetails(prev => {
              if (prev[fund.code]) return prev;
              return { ...prev, [fund.code]: data };
            });
            
            const historicalData = data.data?.map(d => ({
              date: d.date,
              nav: parseFloat(d.nav),
            })) || [];
            
            return predictInvestmentGrowth(fund, historicalData);
          }
        } catch (e) {
          console.log(`Error fetching fund ${fund.code}:`, e);
        }
        return predictInvestmentGrowth(fund);
      });

      const allPredictions = await Promise.all(predictionPromises);
      const sorted = compareInvestments(allPredictions);
      setPredictions(sorted);
    } catch (error) {
      console.log('Error loading recommendations', error);
      Alert.alert('Error', 'Failed to load investment recommendations');
    } finally {
      setLoading(false);
      setIsLoadingRecommendations(false);
    }
  };
  const handleRiskLevelChange = useCallback(async (level: RiskLevel) => {
    if (level === riskLevel) return;
    const currentPrefs = latestPreferencesRef.current || preferences || {
      riskLevel,
      customFunds: [],
      editedRecommendations: {},
    };
    const updatedPrefs: UserInvestmentPreferences = {
      ...currentPrefs,
      riskLevel: level,
    };
    setPreferences(updatedPrefs);
    latestPreferencesRef.current = updatedPrefs;
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(updatedPrefs));
    setRiskLevel(level);
  }, [preferences, riskLevel, userId]);

  const handleEditFund = (fund: InvestmentFund) => {
    setEditingFund(fund);
    setEditForm({
      expectedReturn: fund.expectedReturn,
      minInvestment: fund.minInvestment,
      description: fund.description,
    });
  };

  const saveEdit = async () => {
    if (!editingFund) return;

    const updatedPrefs: UserInvestmentPreferences = {
      riskLevel,
      customFunds: preferences?.customFunds || [],
      editedRecommendations: {
        ...preferences?.editedRecommendations,
        [editingFund.id]: editForm,
      },
    };

    await savePreferences(updatedPrefs);
    setEditingFund(null);
    setEditForm({});
    await loadRecommendations();
  };

  const handleRemoveFund = async (fundId: string) => {
    Alert.alert(
      'Remove Investment',
      'Are you sure you want to remove this investment from your recommendations?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedPrefs: UserInvestmentPreferences = {
              riskLevel,
              customFunds: (preferences?.customFunds || []).filter(f => f.id !== fundId),
              editedRecommendations: preferences?.editedRecommendations || {},
            };
            await savePreferences(updatedPrefs);
            await loadRecommendations();
          },
        },
      ]
    );
  };

  const fetchFundDetail = async (prediction: InvestmentPrediction) => {
    setDetailLoading(true);
    setSelectedPrediction(prediction);
    
    if (!fundDetails[prediction.fund.code]) {
      try {
        const res = await fetch(`https://api.mfapi.in/mf/${prediction.fund.code}`);
        if (res.ok) {
          const data = await res.json() as FundDetailResponse;
          setFundDetails(prev => ({ ...prev, [prediction.fund.code]: data }));
        }
      } catch (e) {
        console.log('Error fetching detail', e);
      }
    }
    setDetailLoading(false);
  };

  const addCustomFund = async () => {
    if (!newFundCode.trim()) {
      Alert.alert('Error', 'Please enter a fund code');
      return;
    }

    try {
      const res = await fetch(`https://api.mfapi.in/mf/${newFundCode.trim()}`);
      if (!res.ok) throw new Error('Fund not found');
      
      const data = await res.json() as FundDetailResponse;
      const newFund: InvestmentFund = {
        id: `custom-${Date.now()}`,
        code: newFundCode.trim(),
        name: data.meta?.scheme_name || 'Custom Fund',
        type: 'equity',
        category: data.meta?.scheme_category || 'Mutual Fund',
        riskLevel: 'medium',
        expectedReturn: 0.1,
        expenseRatio: 0.02,
        minInvestment: 1000,
        description: 'Custom fund added by user',
        suitability: [riskLevel],
        growthFactors: [],
        concerns: [],
      };

      const updatedPrefs: UserInvestmentPreferences = {
        riskLevel,
        customFunds: [...(preferences?.customFunds || []), newFund],
        editedRecommendations: preferences?.editedRecommendations || {},
      };

      await savePreferences(updatedPrefs);
      setNewFundCode('');
      setShowAddFund(false);
      await loadRecommendations();
    } catch (e) {
      Alert.alert('Error', 'Fund not found. Please check the fund code.');
    }
  };

  const getTypeIcon = (type: InvestmentType) => {
    switch (type) {
      case 'gold': return 'award';
      case 'equity': return 'trending-up';
      case 'debt': return 'shield';
      case 'hybrid': return 'layers';
      case 'sip': return 'calendar';
      case 'liquid': return 'droplet';
      default: return 'dollar-sign';
    }
  };

  const getTypeColor = (type: InvestmentType) => {
    switch (type) {
      case 'gold': return '#FFD700';
      case 'equity': return '#FF3B30';
      case 'debt': return '#34C759';
      case 'hybrid': return '#007AFF';
      case 'sip': return '#AF52DE';
      case 'liquid': return '#5AC8FA';
      default: return '#8E8E93';
    }
  };

  const chartData = useMemo(() => {
    if (!selectedPrediction) return null;
    const detail = fundDetails[selectedPrediction.fund.code];
    if (!detail?.data?.length) return null;
    
    const lastPoints = detail.data.slice(-90);
    const labels = lastPoints.map((p, i) => (i % 15 === 0 ? p.date.slice(0, 6) : ''));
    const values = lastPoints.map((p) => parseFloat(p.nav));
    return {
      labels,
      datasets: [{ data: values }],
    };
  }, [selectedPrediction, fundDetails]);

  const sipProjection = useMemo(() => {
    if (!selectedPrediction) return null;
    const monthlyAmount = selectedPrediction.fund.minInvestment || 2000;
    const years = 5;
    const annualReturn = selectedPrediction.predictedGrowth.oneYear;
    return {
      ...calculateSipProjection(monthlyAmount, years, annualReturn),
      monthlyAmount,
      years,
    };
  }, [selectedPrediction]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(99, 99, 102, ${opacity})`,
    propsForDots: {
      r: '3',
      strokeWidth: '1',
      stroke: '#007AFF',
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Smart Investments</Text>
          <Text style={styles.subtitle}>AI-powered recommendations based on your risk profile</Text>
          <RiskProfile
            variant="summary"
            userId={userId}
            onRiskLevelChange={handleRiskLevelChange}
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowAddFund(true)}>
            <Icon name="plus" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Add Fund</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Only reload current recommendations; avoid forcing risk change
              loadRecommendations();
            }}
          >
            <Icon name="refresh-cw" size={18} color="#007AFF" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Analyzing investments...</Text>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended Investments</Text>
              <Text style={styles.sectionSubtitle}>Ranked by AI prediction score</Text>
            </View>

            {predictions.map((prediction, index) => {
              const typeColor = getTypeColor(prediction.fund.type);
              return (
                <TouchableOpacity
                  key={prediction.fund.id}
                  style={styles.predictionCard}
                  onPress={() => fetchFundDetail(prediction)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeColor}20` }]}>
                      <Icon name={getTypeIcon(prediction.fund.type) as any} size={14} color={typeColor} />
                      <Text style={[styles.typeText, { color: typeColor }]}>
                        {prediction.fund.type.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{Math.round(prediction.recommendationScore)}</Text>
                    </View>
                  </View>

                  <Text style={styles.fundName}>{prediction.fund.name}</Text>
                  <Text style={styles.fundCategory}>{prediction.fund.category}</Text>

                  <View style={styles.predictionRow}>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>1Y Growth</Text>
                      <Text style={styles.predictionValue}>
                        {(prediction.predictedGrowth.oneYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>5Y Growth</Text>
                      <Text style={styles.predictionValue}>
                        {(prediction.predictedGrowth.fiveYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.predictionItem}>
                      <Text style={styles.predictionLabel}>Confidence</Text>
                      <Text style={styles.predictionValue}>{prediction.confidence}%</Text>
                    </View>
                  </View>

                  <View style={styles.reasonsBox}>
                    <Text style={styles.reasonsTitle}>Why this investment:</Text>
                    {prediction.reasons.positive.slice(0, 2).map((reason, i) => (
                      <View key={i} style={styles.reasonItem}>
                        <Icon name="check-circle" size={14} color="#34C759" />
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => handleEditFund(prediction.fund)}
                    >
                      <Icon name="edit-2" size={14} color="#007AFF" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    {prediction.fund.id.startsWith('custom-') && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveFund(prediction.fund.id)}
                      >
                        <Icon name="trash-2" size={14} color="#FF3B30" />
                        <Text style={styles.removeButtonText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Fund Detail Modal */}
      <Modal
        visible={!!selectedPrediction}
        animationType="slide"
        onRequestClose={() => setSelectedPrediction(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedPrediction(null)}>
              <Icon name="x" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {selectedPrediction?.fund.name}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {detailLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            selectedPrediction && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailCategory}>{selectedPrediction.fund.category}</Text>
                  <Text style={styles.detailDescription}>{selectedPrediction.fund.description}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Growth Predictions</Text>
                  <View style={styles.growthGrid}>
                    <View style={styles.growthCard}>
                      <Text style={styles.growthLabel}>1 Year</Text>
                      <Text style={styles.growthValue}>
                        {(selectedPrediction.predictedGrowth.oneYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.growthCard}>
                      <Text style={styles.growthLabel}>3 Years</Text>
                      <Text style={styles.growthValue}>
                        {(selectedPrediction.predictedGrowth.threeYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                    <View style={styles.growthCard}>
                      <Text style={styles.growthLabel}>5 Years</Text>
                      <Text style={styles.growthValue}>
                        {(selectedPrediction.predictedGrowth.fiveYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.confidenceText}>
                    Prediction Confidence: {selectedPrediction.confidence}%
                  </Text>
                </View>

                {chartData && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>NAV Trend (Last 90 Days)</Text>
                    <LineChart
                      data={chartData}
                      width={320}
                      height={200}
                      chartConfig={chartConfig}
                      withInnerLines={false}
                      style={{ borderRadius: 12 }}
                    />
                  </View>
                )}

                {sipProjection && (
                  <View style={styles.sipCard}>
                    <Text style={styles.sipTitle}>SIP Projection</Text>
                    <Text style={styles.sipSummary}>
                      ₹{sipProjection.monthlyAmount.toLocaleString()}/month · {sipProjection.years} years
                    </Text>
                    <View style={styles.sipBreakdown}>
                      <View style={styles.sipRow}>
                        <Text style={styles.sipLabel}>Total Invested</Text>
                        <Text style={styles.sipValue}>₹{sipProjection.totalInvested.toLocaleString()}</Text>
                      </View>
                      <View style={styles.sipRow}>
                        <Text style={styles.sipLabel}>Estimated Returns</Text>
                        <Text style={[styles.sipValue, { color: '#34C759' }]}>
                          ₹{sipProjection.estimatedReturns.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.sipRow}>
                        <Text style={styles.sipLabel}>Projected Value</Text>
                        <Text style={[styles.sipValue, { fontSize: 24, fontWeight: '700' }]}>
                          ₹{sipProjection.projectedValue.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Why This Investment?</Text>
                  {selectedPrediction.reasons.positive.map((reason, i) => (
                    <View key={i} style={styles.reasonItem}>
                      <Icon name="check-circle" size={16} color="#34C759" />
                      <Text style={styles.reasonText}>{reason}</Text>
                    </View>
                  ))}
                  {selectedPrediction.reasons.negative.length > 0 && (
                    <>
                      <Text style={[styles.detailSectionTitle, { marginTop: 16 }]}>Considerations</Text>
                      {selectedPrediction.reasons.negative.map((concern, i) => (
                        <View key={i} style={styles.reasonItem}>
                          <Icon name="alert-circle" size={16} color="#FF9500" />
                          <Text style={styles.reasonText}>{concern}</Text>
                        </View>
                      ))}
                    </>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Fund Details</Text>
                  <DetailRow label="Risk Level" value={selectedPrediction.fund.riskLevel.toUpperCase()} />
                  <DetailRow label="Expected Return" value={`${(selectedPrediction.fund.expectedReturn * 100).toFixed(1)}% p.a.`} />
                  <DetailRow label="Expense Ratio" value={`${(selectedPrediction.fund.expenseRatio * 100).toFixed(2)}%`} />
                  <DetailRow label="Min Investment" value={`₹${selectedPrediction.fund.minInvestment.toLocaleString()}`} />
                  {fundDetails[selectedPrediction.fund.code]?.meta && (
                    <>
                      <DetailRow
                        label="Fund House"
                        value={fundDetails[selectedPrediction.fund.code].meta.fund_house}
                      />
                      <DetailRow
                        label="Scheme Type"
                        value={fundDetails[selectedPrediction.fund.code].meta.scheme_type}
                      />
                    </>
                  )}
                </View>
              </ScrollView>
            )
          )}
        </SafeAreaView>
      </Modal>

      {/* Edit Fund Modal */}
      <Modal
        visible={!!editingFund}
        animationType="slide"
        onRequestClose={() => setEditingFund(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditingFund(null)}>
              <Icon name="x" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Investment</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Expected Return (annual %)</Text>
            <TextInput
              value={editForm.expectedReturn ? String(editForm.expectedReturn * 100) : ''}
              onChangeText={(v) =>
                setEditForm({ ...editForm, expectedReturn: parseFloat(v || '0') / 100 })
              }
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Minimum Investment (₹)</Text>
            <TextInput
              value={editForm.minInvestment ? String(editForm.minInvestment) : ''}
              onChangeText={(v) =>
                setEditForm({ ...editForm, minInvestment: parseInt(v || '0', 10) })
              }
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              value={editForm.description || ''}
              onChangeText={(v) => setEditForm({ ...editForm, description: v })}
              multiline
              numberOfLines={4}
              style={[styles.input, { height: 100 }]}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add Fund Modal */}
      <Modal
        visible={showAddFund}
        animationType="slide"
        onRequestClose={() => setShowAddFund(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddFund(false)}>
              <Icon name="x" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Custom Fund</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.inputLabel}>Fund Code (from mfapi.in)</Text>
            <TextInput
              value={newFundCode}
              onChangeText={setNewFundCode}
              placeholder="Enter fund code"
              keyboardType="numeric"
              style={styles.input}
            />
            <Text style={styles.helperText}>
              You can find fund codes from mutual fund APIs or AMC websites
            </Text>

            <TouchableOpacity style={styles.saveButton} onPress={addCustomFund}>
              <Text style={styles.saveButtonText}>Add Fund</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6c6c70',
    fontSize: 14,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: '600',
  },
  loaderBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6c6c70',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  sectionSubtitle: {
    color: '#6c6c70',
    marginTop: 4,
    fontSize: 13,
  },
  predictionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  rankBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rankText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  scoreBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    fontWeight: '700',
    color: '#1c1c1e',
  },
  fundName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  fundCategory: {
    color: '#6c6c70',
    fontSize: 13,
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  predictionItem: {
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 11,
    color: '#6c6c70',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  reasonsBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  reasonText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1c1c1e',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editButtonText: {
    marginLeft: 4,
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  removeButtonText: {
    marginLeft: 4,
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    color: '#111',
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailCategory: {
    color: '#6c6c70',
    fontWeight: '600',
    fontSize: 13,
  },
  detailDescription: {
    marginTop: 8,
    color: '#1c1c1e',
    lineHeight: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  growthGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  growthCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  growthLabel: {
    fontSize: 11,
    color: '#6c6c70',
    marginBottom: 4,
  },
  growthValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  confidenceText: {
    fontSize: 12,
    color: '#6c6c70',
    textAlign: 'center',
  },
  sipCard: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sipTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
  },
  sipSummary: {
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  sipBreakdown: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  sipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sipLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  sipValue: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    color: '#6c6c70',
    fontWeight: '600',
  },
  detailValue: {
    color: '#1c1c1e',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6c6c70',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});

