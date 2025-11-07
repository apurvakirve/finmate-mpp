import React, { useEffect, useMemo, useState } from 'react';
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

type RiskLevel = 'conservative' | 'balanced' | 'aggressive';

interface FundRecommendation {
  code: string;
  name: string;
  category: string;
  expectedReturn: number; // annualised assumption
  description: string;
}

const RECOMMENDED_MAP: Record<RiskLevel, FundRecommendation[]> = {
  conservative: [
    {
      code: '119551',
      name: 'SBI Liquid Fund - Regular Plan',
      category: 'Debt - Liquid',
      expectedReturn: 0.055,
      description: 'Low risk liquid fund for building emergency corpus.',
    },
    {
      code: '118834',
      name: 'HDFC Short Term Debt Fund',
      category: 'Debt - Short Duration',
      expectedReturn: 0.065,
      description: 'Short duration debt with limited volatility.',
    },
  ],
  balanced: [
    {
      code: '118825',
      name: 'HDFC Hybrid Equity Fund',
      category: 'Hybrid - Aggressive',
      expectedReturn: 0.105,
      description: 'Mix of equity & debt to balance growth and stability.',
    },
    {
      code: '125354',
      name: 'ICICI Prudential Balanced Advantage Fund',
      category: 'Hybrid - Dynamic Asset',
      expectedReturn: 0.1,
      description: 'Dynamic asset allocation that manages downside risk.',
    },
  ],
  aggressive: [
    {
      code: '118778',
      name: 'Axis Bluechip Fund',
      category: 'Equity - Large Cap',
      expectedReturn: 0.12,
      description: 'Large-cap focused for long term growth.',
    },
    {
      code: '118540',
      name: 'Mirae Asset Emerging Bluechip Fund',
      category: 'Equity - Large & Mid Cap',
      expectedReturn: 0.14,
      description: 'Blend of large & mid cap for higher growth potential.',
    },
  ],
};

interface FundDetailResponse {
  meta: {
    fund_house: string;
    scheme_category: string;
    scheme_type: string;
    scheme_name: string;
  };
  data: { date: string; nav: string }[];
}

interface InvestmentsScreenProps {
  userId: number | string;
}

export default function InvestmentsScreen({ userId }: InvestmentsScreenProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('balanced');
  const [loading, setLoading] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundRecommendation | null>(null);
  const [fundDetail, setFundDetail] = useState<FundDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FundRecommendation[]>([]);
  const [searching, setSearching] = useState(false);

  const riskStorageKey = `mt_risk_${userId}`;

  useEffect(() => {
    const loadRisk = async () => {
      try {
        const raw = await AsyncStorage.getItem(riskStorageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.level) setRiskLevel(parsed.level);
        }
      } catch (e) {
        console.log('risk load', e);
      }
    };
    loadRisk();
  }, [riskStorageKey]);

  const recommendedFunds = useMemo(() => {
    return RECOMMENDED_MAP[riskLevel] || RECOMMENDED_MAP.balanced;
  }, [riskLevel]);

  const fetchFundDetail = async (fund: FundRecommendation) => {
    try {
      setDetailLoading(true);
      setSelectedFund(fund);
      const res = await fetch(`https://api.mfapi.in/mf/${fund.code}`);
      if (!res.ok) throw new Error('Unable to load fund data');
      const json = (await res.json()) as FundDetailResponse;
      setFundDetail(json);
    } catch (error) {
      console.log('fund detail error', error);
      Alert.alert('Investments', 'Unable to load fund detail.');
      setFundDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      const res = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const json = await res.json();
      const mapped: FundRecommendation[] = (json || []).slice(0, 10).map((item: any) => ({
        code: item.schemeCode || item.scheme_code,
        name: item.schemeName || item.scheme_name,
        category: item.scheme_category || 'Mutual Fund',
        expectedReturn: 0.1,
        description: 'Search result fund',
      }));
      setSearchResults(mapped.filter((m) => m.code));
    } catch (error) {
      console.log('search error', error);
      Alert.alert('Investments', 'No funds found for this search.');
    } finally {
      setSearching(false);
    }
  };

  const chartData = useMemo(() => {
    if (!fundDetail?.data?.length) return null;
    const lastPoints = fundDetail.data.slice(-90);
    const labels = lastPoints.map((p) => p.date.slice(0, 6));
    const values = lastPoints.map((p) => parseFloat(p.nav));
    return {
      labels,
      datasets: [{ data: values }],
    };
  }, [fundDetail]);

  const sipProjection = useMemo(() => {
    if (!selectedFund) return null;
    const rate = selectedFund.expectedReturn || 0.1;
    const monthlyRate = rate / 12;
    const months = 60; // 5 years
    const sipAmount = 2000;
    const futureValue = sipAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    return {
      amount: sipAmount,
      years: 5,
      futureValue,
      rate,
    };
  }, [selectedFund]);

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

  const riskCopy = useMemo(() => {
    switch (riskLevel) {
      case 'aggressive':
        return 'Aggressive risk appetite. Focus on equity funds & growth SIPs.';
      case 'balanced':
        return 'Balanced risk profile. Prefer hybrid & large-cap equity funds.';
      case 'conservative':
      default:
        return 'Conservative risk profile. Stay with debt and hybrid funds for stability.';
    }
  }, [riskLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <View style={styles.riskCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="shield" size={18} color="#007AFF" />
            <Text style={styles.riskTitle}>Risk meter</Text>
          </View>
          <Text style={styles.riskLevel}>{riskLevel.toUpperCase()}</Text>
          <Text style={styles.riskDescription}>{riskCopy}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended SIPs</Text>
          <Text style={styles.sectionSubtitle}>Based on your risk profile</Text>
        </View>

        {recommendedFunds.map((fund) => (
          <TouchableOpacity key={fund.code} style={styles.fundCard} onPress={() => fetchFundDetail(fund)}>
            <View style={styles.fundHeader}>
              <Text style={styles.fundName}>{fund.name}</Text>
              <Icon name="chevron-right" size={18} color="#999" />
            </View>
            <Text style={styles.fundCategory}>{fund.category}</Text>
            <Text style={styles.fundDescription}>{fund.description}</Text>
            <View style={styles.fundMetaRow}>
              <View style={styles.metaChip}>
                <Icon name="trending-up" size={14} color="#34C759" />
                <Text style={styles.metaText}>{Math.round(fund.expectedReturn * 100)}% expected</Text>
              </View>
              <View style={styles.metaChip}>
                <Icon name="calendar" size={14} color="#007AFF" />
                <Text style={styles.metaText}>SIP ₹2,000 / month</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore more funds</Text>
          <Text style={styles.sectionSubtitle}>Search any AMC / scheme name</Text>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            placeholder="Search mutual funds"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
            {searching ? <ActivityIndicator size="small" color="white" /> : <Icon name="search" size={18} color="white" />}
          </TouchableOpacity>
        </View>

        {searchResults.map((fund) => (
          <TouchableOpacity key={`${fund.code}-search`} style={styles.searchCard} onPress={() => fetchFundDetail(fund)}>
            <Text style={styles.fundName}>{fund.name}</Text>
            <Text style={styles.fundCategory}>{fund.category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selectedFund} animationType="slide" onRequestClose={() => setSelectedFund(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedFund(null)}>
              <Icon name="x" size={24} color="#111" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedFund?.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          {detailLoading && (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ marginTop: 10, color: '#666' }}>Loading NAV trend...</Text>
            </View>
          )}

          {!detailLoading && selectedFund && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.detailCategory}>{selectedFund.category}</Text>
              <Text style={styles.detailDescription}>{selectedFund.description}</Text>

              {chartData && (
                <View style={styles.chartWrapper}>
                  <Text style={styles.chartTitle}>Last 90 NAV points</Text>
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
                  <Text style={styles.sipSummary}>SIP ₹{sipProjection.amount}/month · {sipProjection.years} years</Text>
                  <Text style={styles.sipValue}>≈ ₹{sipProjection.futureValue.toFixed(0)}</Text>
                  <Text style={styles.sipFooter}>
                    Assumes {(sipProjection.rate * 100).toFixed(1)}% annualised returns. Actual returns can vary.
                  </Text>
                </View>
              )}

              {fundDetail && (
                <View style={styles.detailMeta}>
                  <DetailRow label="Fund house" value={fundDetail.meta?.fund_house || 'NA'} />
                  <DetailRow label="Category" value={fundDetail.meta?.scheme_category || selectedFund.category} />
                  <DetailRow label="Type" value={fundDetail.meta?.scheme_type || 'NA'} />
                </View>
              )}
            </ScrollView>
          )}
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
  riskCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  riskTitle: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#111',
    fontSize: 15,
  },
  riskLevel: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    color: '#007AFF',
  },
  riskDescription: {
    marginTop: 8,
    color: '#444',
    lineHeight: 20,
    fontSize: 13,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  sectionSubtitle: {
    color: '#666',
    marginTop: 2,
  },
  fundCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#111',
  },
  fundCategory: {
    color: '#666',
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
  },
  fundDescription: {
    color: '#555',
    marginTop: 6,
    lineHeight: 18,
  },
  fundMetaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F8FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  metaText: {
    marginLeft: 6,
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
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
    fontSize: 16,
    color: '#111',
  },
  modalLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCategory: {
    color: '#666',
    fontWeight: '600',
  },
  detailDescription: {
    marginTop: 6,
    color: '#444',
    lineHeight: 20,
  },
  chartWrapper: {
    marginTop: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
  },
  chartTitle: {
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  sipCard: {
    backgroundColor: '#0A66FF',
    borderRadius: 14,
    padding: 18,
    marginTop: 18,
  },
  sipTitle: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  sipSummary: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  sipValue: {
    color: 'white',
    fontWeight: '700',
    fontSize: 28,
    marginTop: 6,
  },
  sipFooter: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  detailMeta: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    color: '#222',
    fontWeight: '600',
  },
});


