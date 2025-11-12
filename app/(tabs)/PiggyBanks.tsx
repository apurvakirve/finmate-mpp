import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import { RiskLevel } from './RiskProfile';

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
  const [fromEnv, setFromEnv] = useState<EnvelopeKey>('other');
  const [toEnv, setToEnv] = useState<EnvelopeKey>('investments');
  const [transferAmount, setTransferAmount] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'investment' | 'emi'>('investment');
  const [editingEnvelope, setEditingEnvelope] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [sourceEnvelope, setSourceEnvelope] = useState<string | null>(null);
  
  // Animation references for envelope interactions
  const envelopeAnimations = useRef<Record<EnvelopeKey, Animated.Value>>(
    ENVELOPES.reduce((acc, { key }) => ({
      ...acc,
      [key]: new Animated.Value(1)
    }), {} as Record<EnvelopeKey, Animated.Value>)
  ).current;

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
    setState(next); // Update immediately for instant UI feedback
    await AsyncStorage.setItem(key, JSON.stringify(next));
    setTransferAmount('');
    Alert.alert('Success', `₹${amt.toFixed(0)} moved from ${ENVELOPES.find(e => e.key === fromEnv)?.label} to ${ENVELOPES.find(e => e.key === toEnv)?.label}`);
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

  const handleEnvelopeEdit = (envelopeKey: EnvelopeKey) => {
    setEditingEnvelope(envelopeKey);
    setEditAmount(state.allocationsPct[envelopeKey].toString());
    setSourceEnvelope(null);
  };

  const handleEnvelopeAmountChange = (value: string) => {
    setEditAmount(value);
  };

  const confirmEnvelopeEdit = () => {
    if (!editingEnvelope || !editAmount) return;
    const newPct = parseFloat(editAmount);
    if (isNaN(newPct) || newPct < 0 || newPct > 100) return;
    
    setState(prev => {
      const newAllocations = { ...prev.allocationsPct, [editingEnvelope]: newPct };
      
      // If we have a source envelope, update its balance too
      if (sourceEnvelope && sourceEnvelope !== editingEnvelope) {
        const oldAmount = Math.floor((effectiveIncome * (prev.allocationsPct[editingEnvelope] || 0)) / 100);
        const newAmount = Math.floor((effectiveIncome * newPct) / 100);
        const difference = newAmount - oldAmount;
        
        if (difference !== 0) {
          const sourceOldPct = prev.allocationsPct[sourceEnvelope] || 0;
          const sourceOldAmount = Math.floor((effectiveIncome * sourceOldPct) / 100);
          const sourceNewAmount = sourceOldAmount - difference;
          const sourceNewPct = effectiveIncome > 0 ? Math.max(0, Math.min(100, (sourceNewAmount * 100) / effectiveIncome)) : 0;
          
          newAllocations[sourceEnvelope] = Math.round(sourceNewPct);
        }
      }
      
      return { ...prev, allocationsPct: newAllocations };
    });
    
    cancelEnvelopeEdit();
  };

  const cancelEnvelopeEdit = () => {
    setEditingEnvelope(null);
    setEditAmount('');
    setSourceEnvelope(null);
  };

  // Animation functions for envelope interactions
  const animateEnvelopePress = (envelopeKey: EnvelopeKey) => {
    Animated.sequence([
      Animated.timing(envelopeAnimations[envelopeKey], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(envelopeAnimations[envelopeKey], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleEnvelopePress = (envelopeKey: EnvelopeKey) => {
    animateEnvelopePress(envelopeKey);
    handleEnvelopeEdit(envelopeKey);
  };

  const dailyDifference = useMemo(() => {
    if (todayIncome <= 0) return 0;
    return todayIncome - effectiveIncome;
  }, [effectiveIncome, todayIncome]);

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      <View style={styles.summaryCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.summaryLabel}>Net earned today</Text>
          <Text style={styles.summaryValue}>₹{effectiveIncome.toFixed(0)}</Text>
          <View style={styles.summaryMetaRow}>
            <View style={styles.metaItem}>
              <Icon name="arrow-down" size={14} color="#34C759" />
              <Text style={[styles.summaryMeta, { color: '#34C759', marginLeft: 4 }]}>₹{todayIncome.toFixed(0)} received</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="arrow-up" size={14} color="#FF3B30" />
              <Text style={[styles.summaryMeta, { color: '#FF3B30', marginLeft: 4 }]}>₹{Math.max(0, dailyDifference).toFixed(0)} spent</Text>
            </View>
          </View>
        </View>
        <View style={styles.riskBadge}>
          <Text style={styles.riskLabel}>Risk Profile</Text>
          <View style={[styles.riskTag, styles[`risk-${riskLevel}`]]}>
            <Text style={styles.riskTagText}>{riskLevel.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.scheduleRow}>
        <TouchableOpacity style={[styles.scheduleButton, { marginRight: 10 }]} onPress={() => openCalendar('investment')}>
          <Icon name="calendar" size={16} color="#007AFF" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.scheduleTitle}>Investment Day</Text>
            <Text style={styles.scheduleSubtitle}>
              {state.scheduledInvestmentDay ? `Every month on ${state.scheduledInvestmentDay}` : 'Select a date'}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scheduleButton, { marginRight: 0 }]} onPress={() => openCalendar('emi')}>
          <Icon name="alert-circle" size={16} color="#FF3B30" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.scheduleTitle}>EMI / Loan Day</Text>
            <Text style={styles.scheduleSubtitle}>
              {state.emiPayDay ? `Remind me on ${state.emiPayDay}` : 'Set payday'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.incomeCard}>
        <Text style={styles.sectionTitle}>Allocation Plan</Text>
        <View style={styles.incomeRow}>
          <Icon name="dollar-sign" size={18} color="#007AFF" />
          <Text style={styles.incomeText}>Daily base used: ₹{effectiveIncome.toFixed(0)}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, paddingVertical: 8 }}>
          {ENVELOPES.map(({ key, label, color }) => {
            const allocationAmount = Math.floor((effectiveIncome * (state.allocationsPct[key] || 0)) / 100);
            return (
              <Animated.View
                key={key}
                style={{
                  transform: [{ scale: envelopeAnimations[key] }]
                }}
              >
                <TouchableOpacity
                  style={[styles.allocChip, { borderColor: color }]}
                  onPress={() => handleEnvelopePress(key)}
                  activeOpacity={0.9}
                > 
                  <View style={styles.allocContent}>
                    <Text style={[styles.allocLabel, { color }]}>{label}</Text>
                    <Text style={[styles.allocValue, { color }]}>
                      ₹{allocationAmount.toLocaleString()}
                    </Text>
                    <Text style={[styles.allocPercent, { color: color + '80' }]}>
                      {state.allocationsPct[key] ?? 0}%
                    </Text>
                  </View>
                  <View style={styles.allocProgressContainer}>
                    <View 
                      style={[
                        styles.allocProgress, 
                        { 
                          backgroundColor: color, 
                          width: `${Math.min(100, state.allocationsPct[key] || 0)}%` 
                        }
                      ]} 
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={styles.primaryButton} onPress={proposeTodayAllocation}>
          <Text style={styles.primaryButtonText}>Propose Today Allocation</Text>
        </TouchableOpacity>
        {pendingAllocations && (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Suggested split</Text>
            {ENVELOPES.map(({ key, label }) => (
              <View key={key} style={styles.pendingRow}>
                <Text style={styles.pendingLabel}>{label}</Text>
                <Text style={styles.pendingValue}>₹{(pendingAllocations[key] || 0).toFixed(0)}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#34C759' }]} onPress={confirmAllocation}>
              <Text style={styles.primaryButtonText}>Confirm & Fill Jars</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => setPendingAllocations(null)}>
              <Text style={styles.linkButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.balancesCard}>
        <Text style={styles.sectionTitle}>Jar balances</Text>
        <View style={styles.grid}>
          {ENVELOPES.map(({ key, label, color, icon }) => (
            <TouchableOpacity key={key} style={[styles.balanceCell, { borderColor: color }]} onPress={() => setFromEnv(key)}>
              <View style={styles.balanceHeader}>
                <Icon name={icon as any} size={16} color={color} />
                <Text style={styles.balanceLabel}>{label}</Text>
              </View>
              <Text style={[styles.balanceValue, { color }]}>₹{(state.balances[key] || 0).toFixed(0)}</Text>
              <Text style={styles.balanceHint}>Tap to move from here</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.transferCard}>
        <Text style={styles.sectionTitle}>Move between jars</Text>
        
        <View style={styles.transferContainer}>
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

      {/* Envelope Edit Modal */}
      <Modal visible={editingEnvelope !== null} animationType="slide" transparent onRequestClose={cancelEnvelopeEdit}>
        <View style={styles.envelopeEditOverlay}>
          <View style={styles.envelopeEditModal}>
            <View style={styles.envelopeEditHeader}>
              <Text style={styles.envelopeEditTitle}>
                Edit {editingEnvelope ? ENVELOPES.find(e => e.key === editingEnvelope)?.label : ''} Allocation
              </Text>
              <TouchableOpacity onPress={cancelEnvelopeEdit}>
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.envelopeEditContent}>
              <Text style={styles.envelopeEditLabel}>Allocation Percentage</Text>
              <View style={styles.envelopeEditInputContainer}>
                <TextInput
                  value={editAmount}
                  onChangeText={handleEnvelopeAmountChange}
                  keyboardType="numeric"
                  style={styles.envelopeEditInput}
                  placeholder="Enter percentage"
                  placeholderTextColor="#8e8e93"
                  autoFocus
                />
                <Text style={styles.envelopeEditPercent}>%</Text>
              </View>
              
              <Text style={styles.envelopeEditHint}>
                Amount: ₹{Math.floor((effectiveIncome * (parseFloat(editAmount) || 0)) / 100).toLocaleString()}
              </Text>
              
              <Text style={styles.envelopeEditLabel}>Take money from:</Text>
              <View style={styles.sourceEnvelopeContainer}>
                <TouchableOpacity
                  style={[styles.sourceEnvelopeOption, !sourceEnvelope && styles.sourceEnvelopeOptionActive]}
                  onPress={() => setSourceEnvelope(null)}
                >
                  <Text style={[styles.sourceEnvelopeText, !sourceEnvelope && styles.sourceEnvelopeTextActive]}>
                    Auto-distribute
                  </Text>
                </TouchableOpacity>
                {ENVELOPES.filter(({ key }) => key !== editingEnvelope).map(({ key, label, color }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.sourceEnvelopeOption, 
                      sourceEnvelope === key && styles.sourceEnvelopeOptionActive,
                      { borderColor: color }
                    ]}
                    onPress={() => setSourceEnvelope(key)}
                  >
                    <Text style={[
                      styles.sourceEnvelopeText, 
                      sourceEnvelope === key && styles.sourceEnvelopeTextActive
                    ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.envelopeEditHint}>
                Current total: {ENVELOPES.reduce((sum, { key }) => {
                  if (key === editingEnvelope) {
                    return sum + (parseFloat(editAmount) || 0);
                  }
                  return sum + state.allocationsPct[key];
                }, 0).toFixed(1)}%
              </Text>
              
              <View style={styles.envelopeEditButtons}>
                <TouchableOpacity style={styles.envelopeEditCancel} onPress={cancelEnvelopeEdit}>
                  <Text style={styles.envelopeEditCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.envelopeEditConfirm} onPress={confirmEnvelopeEdit}>
                  <Text style={styles.envelopeEditConfirmText}>Save</Text>
                </TouchableOpacity>
              </View>
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
    padding: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  incomeText: {
    marginLeft: 8,
    color: '#6c6c70',
    fontSize: 16,
    fontWeight: '600',
  },
  allocChip: {
    width: 160,
    height: 120,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginRight: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  allocLabel: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  allocInput: {
    borderBottomWidth: 1,
    borderColor: '#ddd',
    minWidth: 32,
    textAlign: 'center',
    paddingVertical: 0,
    marginRight: 4,
  },
  allocPercent: {
    color: '#6c6c70',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryButtonText: {
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  balanceCell: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceLabel: {
    marginLeft: 6,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  balanceValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
  },
  balanceHint: {
    marginTop: 6,
    color: '#8e8e93',
    fontSize: 12,
  },
  transferCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  transferContainer: {
    marginTop: 16,
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
  
  // Envelope Edit Modal Styles
  envelopeEditOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  envelopeEditModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  envelopeEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  envelopeEditTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  envelopeEditContent: {
    marginTop: 10,
  },
  envelopeEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c6c70',
    marginBottom: 10,
  },
  envelopeEditInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    marginBottom: 10,
  },
  envelopeEditInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 16,
    color: '#1c1c1e',
  },
  envelopeEditPercent: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
    marginLeft: 8,
  },
  envelopeEditHint: {
    fontSize: 12,
    color: '#6c6c70',
    textAlign: 'center',
    marginBottom: 20,
  },
  envelopeEditButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sourceEnvelopeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  sourceEnvelopeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  sourceEnvelopeOptionActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sourceEnvelopeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sourceEnvelopeTextActive: {
    color: 'white',
  },
  envelopeEditCancel: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  envelopeEditCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c6c70',
  },
  envelopeEditConfirm: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  envelopeEditConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  allocValue: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  allocPercent: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    opacity: 0.8,
  },
  allocContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  allocProgressContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  allocProgress: {
    height: '100%',
    borderRadius: 4,
  },
});


