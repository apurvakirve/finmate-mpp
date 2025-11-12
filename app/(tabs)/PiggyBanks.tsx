import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import RiskProfile, { RiskLevel } from './RiskProfile';

export type EnvelopeKey =
  | 'meal'
  | 'travel'
  | 'emergency'
  | 'emis'
  | 'investments'
  | 'savings'
  | 'vacations'
  | 'other';

const ENVELOPES: { key: EnvelopeKey; label: string; color: string; icon: string }[] = [
  { key: 'meal', label: 'Meals', color: '#FF9F1C', icon: 'coffee' },
  { key: 'travel', label: 'Travel', color: '#2EC4B6', icon: 'navigation' },
  { key: 'emergency', label: 'Emergency', color: '#FF3B30', icon: 'alert-triangle' },
  { key: 'emis', label: 'EMIs', color: '#8E8E93', icon: 'credit-card' },
  { key: 'investments', label: 'Invest', color: '#5856D6', icon: 'trending-up' },
  { key: 'savings', label: 'Savings', color: '#34C759', icon: 'shield' },
  { key: 'vacations', label: 'Vacations', color: '#AF52DE', icon: 'umbrella' },
  { key: 'other', label: 'Other', color: '#C9CBCF', icon: 'box' },
];

interface EnvelopeState {
  balances: Record<EnvelopeKey, number>;
  allocationsPct: Record<EnvelopeKey, number>;
  dailyIncome: number;
  scheduledInvestmentDay?: number;
  emiPayDay?: number;
}

const defaultState: EnvelopeState = {
  balances: {
    meal: 0,
    travel: 0,
    emergency: 0,
    emis: 0,
    investments: 0,
    savings: 0,
    vacations: 0,
    other: 0,
  },
  allocationsPct: {
    meal: 15,
    travel: 15,
    emergency: 10,
    emis: 10,
    investments: 25,
    savings: 15,
    vacations: 5,
    other: 5,
  },
  dailyIncome: 600,
  scheduledInvestmentDay: 10,
  emiPayDay: 5,
};

interface PiggyBanksProps {
  userId: string | number;
  todayIncome?: number;
  todayNetIncome?: number;
  riskLevel?: RiskLevel;
}

const storageKey = (userId: string | number) => `mt_piggy_${userId}`;

const buildCalendarDays = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOffset = first.getDay();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  return days;
};

export default function PiggyBanks({
  userId,
  todayIncome = 0,
  todayNetIncome = 0,
  riskLevel = 'moderate',
}: PiggyBanksProps) {
  const [state, setState] = useState<EnvelopeState>(defaultState);
  const [pendingAllocations, setPendingAllocations] = useState<Record<EnvelopeKey, number> | null>(null);
  const [fromEnv, setFromEnv] = useState<EnvelopeKey | null>(null);
  const [toEnv, setToEnv] = useState<EnvelopeKey | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'investment' | 'emi'>('investment');
  const [editingAllocation, setEditingAllocation] = useState<EnvelopeKey | null>(null);
  const [allocationInput, setAllocationInput] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);

  const key = useMemo(() => storageKey(userId), [userId]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const stored = JSON.parse(raw);
          setState({ ...defaultState, ...stored });
        }
      } catch {}
    })();
  }, [key]);

  const persist = async (next: EnvelopeState) => {
    setState(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
  };

  const effectiveIncome = useMemo(() => {
    if (todayNetIncome > 0) return todayNetIncome;
    if (todayIncome > 0) return todayIncome;
    return state.dailyIncome;
  }, [state.dailyIncome, todayIncome, todayNetIncome]);

  const proposeTodayAllocation = () => {
    const allocations: Record<EnvelopeKey, number> = {
      meal: 0,
      travel: 0,
      emergency: 0,
      emis: 0,
      investments: 0,
      savings: 0,
      vacations: 0,
      other: 0,
    };

    ENVELOPES.forEach(({ key }) => {
      const pct = Math.max(0, state.allocationsPct[key] || 0);
      allocations[key] = Math.floor((effectiveIncome * pct) / 100);
    });

    const sum = Object.values(allocations).reduce((acc, v) => acc + v, 0);
    const remainder = Math.max(0, effectiveIncome - sum);
    allocations.savings += remainder;

    setPendingAllocations(allocations);
  };

  const confirmAllocation = async () => {
    if (!pendingAllocations) return;
    const next = { ...state };
    ENVELOPES.forEach(({ key }) => {
      next.balances[key] = (next.balances[key] || 0) + (pendingAllocations[key] || 0);
    });
    await persist(next);
    setPendingAllocations(null);
  };

  const handleMove = async () => {
    if (!fromEnv || !toEnv) {
      Alert.alert('Error', 'Please select source and destination jars');
      return;
    }
    const amt = parseFloat(transferAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (fromEnv === toEnv) {
      Alert.alert('Error', 'Please select different jars');
      return;
    }
    const fromBalance = state.balances[fromEnv] || 0;
    if (fromBalance < amt) {
      Alert.alert('Error', `Insufficient balance in ${ENVELOPES.find(e => e.key === fromEnv)?.label}. Available: ₹${fromBalance.toFixed(0)}`);
      return;
    }

    const next = { ...state };
    next.balances[fromEnv] = fromBalance - amt;
    next.balances[toEnv] = (next.balances[toEnv] || 0) + amt;
    setState(next);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    setTransferAmount('');
    setFromEnv(null);
    setToEnv(null);
    setShowTransferModal(false);
    Alert.alert('Success', `₹${amt.toFixed(0)} moved from ${ENVELOPES.find(e => e.key === fromEnv)?.label} to ${ENVELOPES.find(e => e.key === toEnv)?.label}`);
  };

  const handleAllocationClick = (key: EnvelopeKey) => {
    setEditingAllocation(key);
    setAllocationInput(String(state.allocationsPct[key] || 0));
  };

  const saveAllocation = () => {
    if (editingAllocation) {
      const pct = Math.max(0, Math.min(100, parseInt(allocationInput || '0', 10)));
      const next = {
        ...state,
        allocationsPct: {
          ...state.allocationsPct,
          [editingAllocation]: pct,
        },
      };
      persist(next);
      setEditingAllocation(null);
      setAllocationInput('');
    }
  };

  const getRiskScore = (): number => {
    if (riskLevel === 'conservative') return 35;
    if (riskLevel === 'moderate') return 55;
    return 75;
  };

  const openCalendar = (mode: 'investment' | 'emi') => {
    setCalendarMode(mode);
    setCalendarVisible(true);
  };

  const onSelectDay = async (day: number) => {
    const next = {
      ...state,
      scheduledInvestmentDay: calendarMode === 'investment' ? day : state.scheduledInvestmentDay,
      emiPayDay: calendarMode === 'emi' ? day : state.emiPayDay,
    };
    await persist(next);
    setCalendarVisible(false);
  };

  const dailyDifference = useMemo(() => {
    if (todayIncome <= 0) return 0;
    return todayIncome - effectiveIncome;
  }, [effectiveIncome, todayIncome]);

  const calculatedAllocations = useMemo(() => {
    const allocations: Record<EnvelopeKey, number> = {
      meal: 0,
      travel: 0,
      emergency: 0,
      emis: 0,
      investments: 0,
      savings: 0,
      vacations: 0,
      other: 0,
    };
    ENVELOPES.forEach(({ key }) => {
      const pct = Math.max(0, state.allocationsPct[key] || 0);
      allocations[key] = Math.floor((effectiveIncome * pct) / 100);
    });
    return allocations;
  }, [effectiveIncome, state.allocationsPct]);

  const riskScore = getRiskScore();

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon name="sun" size={18} color="#007AFF" />
        <Text style={styles.infoBannerText}>
          Today's recorded income: ₹{todayIncome.toFixed(0)} • Risk profile: {riskLevel.toUpperCase()}. Adjust jars or edit your profile below.
        </Text>
      </View>

      {/* Personal Risk Profile Card */}
      <View style={styles.riskProfileCard}>
        <View style={styles.riskProfileHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.riskProfileTitle}>Personal Risk Profile</Text>
            <Text style={styles.riskProfileSubtitle}>Answer Few Questions to personalize coaching.</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => {}}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.riskScoreContainer}>
          <Text style={styles.riskScoreText}>{riskScore}/100 ({riskLevel})</Text>
          <View style={styles.riskProgressBar}>
            <View style={[styles.riskProgressFill, { width: `${riskScore}%`, backgroundColor: '#FF9500' }]} />
          </View>
        </View>
      </View>

      {/* Allocation Plan Card */}
      <View style={styles.incomeCard}>
        <Text style={styles.sectionTitle}>Allocation Plan</Text>
        <View style={styles.incomeRow}>
          <Icon name="dollar-sign" size={18} color="#007AFF" />
          <Text style={styles.incomeText}>Daily base used: ₹{effectiveIncome.toFixed(0)}</Text>
        </View>
        <View style={styles.allocationGrid}>
          {ENVELOPES.map(({ key, label, color }) => {
            const amount = calculatedAllocations[key];
            const isEditing = editingAllocation === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.allocationJar, { backgroundColor: color }]}
                onPress={() => handleAllocationClick(key)}
              >
                <Text style={styles.jarCategoryLabel}>{label}</Text>
                {isEditing ? (
                  <View style={styles.jarEditContainer}>
                    <TextInput
                      value={allocationInput}
                      onChangeText={setAllocationInput}
                      keyboardType="numeric"
                      style={styles.jarEditInput}
                      autoFocus
                      onSubmitEditing={saveAllocation}
                      onBlur={saveAllocation}
                    />
                    <Text style={styles.jarEditPercent}>%</Text>
                  </View>
                ) : (
                  <Text style={styles.jarAmount}>₹ {amount.toFixed(0)}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        {pendingAllocations && (
          <TouchableOpacity style={styles.confirmButton} onPress={confirmAllocation}>
            <Text style={styles.confirmButtonText}>Confirm & Fill Jars</Text>
          </TouchableOpacity>
        )}
        {!pendingAllocations && (
          <TouchableOpacity style={styles.proposeButton} onPress={proposeTodayAllocation}>
            <Text style={styles.proposeButtonText}>Propose Today Allocation</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Jar Balances Card */}
      <View style={styles.balancesCard}>
        <View style={styles.balancesHeader}>
          <Text style={styles.sectionTitle}>Jar balances</Text>
          <TouchableOpacity 
            style={styles.moveMoneyButton}
            onPress={() => setShowTransferModal(true)}
          >
            <Text style={styles.moveMoneyButtonText}>Move Money</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.balancesGrid}>
          {ENVELOPES.map(({ key, label, color }) => {
            const balance = state.balances[key] || 0;
            const maxBalance = Math.max(...Object.values(state.balances), 1);
            const fillPercentage = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
            const isSelected = fromEnv === key || toEnv === key;
            
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.balanceJar,
                  isSelected && styles.balanceJarSelected,
                  { borderColor: color }
                ]}
                onPress={() => {
                  if (!fromEnv) {
                    setFromEnv(key);
                  } else if (!toEnv && fromEnv !== key) {
                    setToEnv(key);
                  } else if (fromEnv === key) {
                    setFromEnv(null);
                  } else if (toEnv === key) {
                    setToEnv(null);
                  }
                }}
              >
                <View style={[styles.jarFillContainer, { backgroundColor: color + '20' }]}>
                  <View style={[styles.jarFill, { 
                    height: `${Math.max(20, fillPercentage)}%`,
                    backgroundColor: color 
                  }]} />
                </View>
                <Text style={[styles.balanceJarAmount, { color }]}>₹{balance.toFixed(0)}</Text>
                <Text style={styles.balanceJarLabel}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transfer Modal */}
      <Modal visible={showTransferModal} animationType="slide" transparent onRequestClose={() => setShowTransferModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.transferModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move Money Between Jars</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transferFrom}>
              <Text style={styles.transferLabel}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelector}>
                {ENVELOPES.map(({ key, label, color, icon }) => {
                  const isSelected = fromEnv === key;
                  const balance = state.balances[key] || 0;
                  return (
                    <TouchableOpacity
                      key={`from-${key}`}
                      style={[
                        styles.jarOption,
                        isSelected && { borderColor: color, backgroundColor: `${color}15` },
                      ]}
                      onPress={() => setFromEnv(key)}
                    >
                      <Icon name={icon as any} size={20} color={isSelected ? color : '#8e8e93'} />
                      <Text style={[styles.jarOptionLabel, isSelected && { color }]}>{label}</Text>
                      <Text style={[styles.jarOptionBalance, isSelected && { color }]}>₹{balance.toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.transferArrow}>
              <Icon name="arrow-down" size={24} color="#007AFF" />
            </View>

            <View style={styles.transferTo}>
              <Text style={styles.transferLabel}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelector}>
                {ENVELOPES.map(({ key, label, color, icon }) => {
                  const isSelected = toEnv === key;
                  const balance = state.balances[key] || 0;
                  return (
                    <TouchableOpacity
                      key={`to-${key}`}
                      style={[
                        styles.jarOption,
                        isSelected && { borderColor: color, backgroundColor: `${color}15` },
                      ]}
                      onPress={() => setToEnv(key)}
                    >
                      <Icon name={icon as any} size={20} color={isSelected ? color : '#8e8e93'} />
                      <Text style={[styles.jarOptionLabel, isSelected && { color }]}>{label}</Text>
                      <Text style={[styles.jarOptionBalance, isSelected && { color }]}>₹{balance.toFixed(0)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.amountRow}>
              <View style={styles.amountInputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  style={styles.amountInput}
                  placeholderTextColor="#8e8e93"
                />
              </View>
              {fromEnv && (
                <Text style={styles.availableText}>
                  Available: ₹{(state.balances[fromEnv] || 0).toFixed(0)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.moveButton,
                (!fromEnv || !toEnv || !transferAmount || fromEnv === toEnv) && styles.moveButtonDisabled,
              ]}
              onPress={handleMove}
              disabled={!fromEnv || !toEnv || !transferAmount || fromEnv === toEnv}
            >
              <Icon name="arrow-right" size={18} color="white" />
              <Text style={styles.moveButtonText}>Transfer Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {calendarMode === 'investment' ? 'Pick investment day' : 'Pick EMI day'}
              </Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Icon name="x" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.calendarGrid}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                <Text key={d} style={styles.calendarWeekday}>{d}</Text>
              ))}
              {buildCalendarDays().map((day, idx) => {
                if (!day) return <Text key={`blank-${idx}`} style={styles.calendarBlank} />;
                const isSelected =
                  (calendarMode === 'investment' && state.scheduledInvestmentDay === day) ||
                  (calendarMode === 'emi' && state.emiPayDay === day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.calendarDay, isSelected && styles.calendarDayActive]}
                    onPress={() => onSelectDay(day)}
                  >
                    <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextActive]}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF4FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    marginLeft: 10,
    color: '#0a66c2',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  riskProfileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  riskProfileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  riskProfileTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  riskProfileSubtitle: {
    fontSize: 13,
    color: '#6c6c70',
  },
  addButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 14,
  },
  riskScoreContainer: {
    marginTop: 8,
  },
  riskScoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 8,
  },
  riskProgressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  summaryLabel: {
    color: '#6c6c70',
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  summaryMeta: {
    color: '#8e8e93',
    fontSize: 12,
  },
  summaryMetaRow: {
    marginTop: 8,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBadge: {
    alignItems: 'flex-end',
  },
  riskLabel: {
    color: '#6c6c70',
    fontSize: 12,
  },
  riskTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 6,
  },
  'risk-conservative': { backgroundColor: '#e6f8ec' },
  'risk-moderate': { backgroundColor: '#fff4d6' },
  'risk-aggressive': { backgroundColor: '#ffe3e3' },
  riskTagText: {
    fontWeight: '600',
    color: '#1c1c1e',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  scheduleTitle: {
    fontWeight: '600',
    color: '#1c1c1e',
  },
  scheduleSubtitle: {
    color: '#6c6c70',
    fontSize: 12,
  },
  incomeCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  incomeText: {
    marginLeft: 8,
    color: '#6c6c70',
  },
  allocationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  allocationJar: {
    width: '23%',
    aspectRatio: 0.8,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jarCategoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  jarAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  jarEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  jarEditInput: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'center',
  },
  jarEditPercent: {
    color: 'white',
    fontSize: 12,
    marginLeft: 2,
  },
  proposeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  proposeButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  pendingCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  pendingTitle: {
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pendingLabel: {
    color: '#6c6c70',
  },
  pendingValue: {
    fontWeight: '600',
    color: '#1c1c1e',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  balancesCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  balancesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moveMoneyButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  moveMoneyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  balancesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  balanceJar: {
    width: '23%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    marginBottom: 12,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
    position: 'relative',
  },
  balanceJarSelected: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  jarFillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  jarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  balanceJarAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 'auto',
    marginBottom: 4,
    textAlign: 'center',
  },
  balanceJarLabel: {
    fontSize: 11,
    color: '#6c6c70',
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  transferModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  transferFrom: {
    marginBottom: 16,
  },
  transferTo: {
    marginBottom: 16,
  },
  transferLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c6c70',
    marginBottom: 8,
  },
  jarSelector: {
    marginTop: 8,
  },
  jarOption: {
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  jarOptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    color: '#1c1c1e',
  },
  jarOptionBalance: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    color: '#1c1c1e',
  },
  transferArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  amountRow: {
    marginTop: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: 14,
    color: '#1c1c1e',
  },
  availableText: {
    fontSize: 12,
    color: '#6c6c70',
    marginTop: 8,
    textAlign: 'right',
  },
  moveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  moveButtonDisabled: {
    backgroundColor: '#c7c7cc',
    opacity: 0.6,
  },
  moveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarWeekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 6,
  },
  calendarBlank: {
    width: `${100 / 7}%`,
    height: 32,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarDayActive: {
    backgroundColor: '#007AFF',
  },
  calendarDayText: {
    color: '#1c1c1e',
  },
  calendarDayTextActive: {
    color: 'white',
    fontWeight: '600',
  },
});


