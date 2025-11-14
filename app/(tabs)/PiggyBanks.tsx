import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
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
  { key: 'meal', label: 'Meals', color: '#FF6B35', icon: 'coffee' },
  { key: 'travel', label: 'Travel', color: '#00CED1', icon: 'navigation' },
  { key: 'emergency', label: 'Emergency', color: '#FF4757', icon: 'alert-triangle' },
  { key: 'emis', label: 'EMIs', color: '#747D8C', icon: 'credit-card' },
  { key: 'investments', label: 'Invest', color: '#5F27CD', icon: 'trending-up' },
  { key: 'savings', label: 'Savings', color: '#00D2D3', icon: 'shield' },
  { key: 'vacations', label: 'Lifestyle', color: '#C44569', icon: 'umbrella' },
  { key: 'other', label: 'Utilities', color: '#A4B0BE', icon: 'box' },
];

const ENVELOPE_GROUPS: Record<
  'needs' | 'wants' | 'safety',
  { label: string; targetPct: number; description: string; envelopes: EnvelopeKey[] }
> = {
  needs: {
    label: 'Needs',
    targetPct: 50,
    description: 'Fixed bills & daily essentials that keep life running.',
    envelopes: ['meal', 'travel', 'emis', 'other'],
  },
  wants: {
    label: 'Wants',
    targetPct: 30,
    description: 'Lifestyle upgrades and nice-to-haves to keep in check.',
    envelopes: ['vacations'],
  },
  safety: {
    label: 'Savings & Safety',
    targetPct: 20,
    description: 'Emergency buffers, savings goals, and monthly investments.',
    envelopes: ['savings', 'emergency', 'investments'],
  },
};

interface EnvelopeState {
  balances: Record<EnvelopeKey, number>;
  allocationsPct: Record<EnvelopeKey, number>;
  dailyIncome: number;
  scheduledInvestmentDay?: number;
  emiPayDay?: number;
  },
  allocationsPct: {
    meal: 20,
    travel: 10,
    emergency: 8,
    emis: 15,
    investments: 5,
    savings: 7,
    vacations: 30,
    other: 5,
  },
  dailyIncome: 500,
  scheduledInvestmentDay: 10,
  emiPayDay: 5,
};

interface PiggyBanksProps {
  userId: string | number;
  todayNetIncome?: number;
  riskLevel?: RiskLevel;
}


const buildCalendarDays = () => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
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

  const key = useMemo(() => storageKey(userId), [userId]);

  const totalAllocPct = useMemo(() => {
    return (Object.values(state.allocationsPct || {}) as number[]).reduce((acc, v) => acc + Math.max(0, v || 0), 0);
  }, [state.allocationsPct]);
  const remainingAllocPct = useMemo(() => Math.max(0, 100 - totalAllocPct), [totalAllocPct]);
  const isAllocPerfect = totalAllocPct === 100;
  const isAllocOver = totalAllocPct > 100;

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

  const envelopeGroupSummaries = useMemo(() => {
    return (Object.entries(ENVELOPE_GROUPS) as Array<
      [keyof typeof ENVELOPE_GROUPS, (typeof ENVELOPE_GROUPS)[keyof typeof ENVELOPE_GROUPS]]
    >).map(([groupKey, config]) => {
      const actualPct = config.envelopes.reduce((sum, env) => sum + (state.allocationsPct[env] || 0), 0);
      const actualAmount = (effectiveIncome * actualPct) / 100;
      const targetAmount = (effectiveIncome * config.targetPct) / 100;
      const balancesTotal = config.envelopes.reduce((sum, env) => sum + (state.balances[env] || 0), 0);
      const deltaPct = actualPct - config.targetPct;
      return {
        key: groupKey,
        label: config.label,
        description: config.description,
        targetPct: config.targetPct,
        actualPct,
        actualAmount,
        targetAmount,
        balancesTotal,
        deltaPct,
        status: Math.abs(deltaPct) < 1 ? 'on-track' : deltaPct > 0 ? 'over' : 'under',
      };
    });
  }, [state.allocationsPct, state.balances, effectiveIncome]);

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

    // If total pct > 100, normalize to 100 to avoid over-allocation
    const totalPct = (Object.values(state.allocationsPct) as number[]).reduce((acc, v) => acc + Math.max(0, v || 0), 0);
    const normalizationFactor = totalPct > 100 ? 100 / totalPct : 1;

    ENVELOPES.forEach(({ key }) => {
      const pct = Math.max(0, state.allocationsPct[key] || 0) * normalizationFactor;
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
        <View style={styles.allocSummaryRow}>
          <View style={[
            styles.allocSummaryPill,
            isAllocPerfect ? styles.allocOk : isAllocOver ? styles.allocOver : styles.allocUnder
          ]}>
            <Text style={styles.allocSummaryText}>Total {totalAllocPct}%</Text>
          </View>
          {!isAllocPerfect && (
            <View style={[styles.allocSummaryPill, styles.allocHintPill]}>
              <Text style={[styles.allocSummaryText, { color: '#6c6c70' }]}>
                {isAllocOver ? 'Reduce' : 'Remaining'} {Math.abs(100 - totalAllocPct)}%
              </Text>
            </View>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {ENVELOPES.map(({ key, label, color }) => (
            <View key={key} style={[styles.allocChip, { borderColor: color }]}> 
              <Text style={[styles.allocLabel, { color }]}>{label}</Text>
              <TextInput
                value={String(state.allocationsPct[key] ?? 0)}
                onChangeText={(value) => {
                  const next = {
                    ...state,
                    allocationsPct: {
                      ...state.allocationsPct,
                      [key]: Math.max(0, Math.min(100, parseInt(value || '0', 10))),
                    },
                  };
                  persist(next);
                }}
                keyboardType="numeric"
                style={styles.allocInput}
              />
              <Text style={styles.allocPercent}>%</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bucketCard}>
          <View style={styles.bucketHeader}>
            <Text style={styles.bucketTitle}>50 / 30 / 20 Health Check</Text>
            <Text style={styles.bucketSubtitle}>Keep wants under 30% and grow safety buffers over time.</Text>
          </View>
          {envelopeGroupSummaries.map(group => (
            <View key={group.key} style={styles.bucketRow}>
              <View style={styles.bucketRowTop}>
                <Text style={styles.bucketRowLabel}>{group.label}</Text>
                <Text style={[
                  styles.bucketRowValue,
                  group.status === 'over' ? styles.bucketOver : group.status === 'under' ? styles.bucketUnder : styles.bucketOnTrack,
                ]}>
                  {group.actualPct.toFixed(0)}% (target {group.targetPct}%)
                </Text>
              </View>
              <View style={styles.bucketProgressBar}>
                <View
                  style={[
                    styles.bucketProgressFill,
                    {
                      width: `${Math.min(100, (group.actualPct / group.targetPct) * 100)}%`,
                      backgroundColor:
                        group.status === 'over' ? '#FF3B30' : group.status === 'under' ? '#FF9500' : '#34C759',
                    },
                  ]}
                />
              </View>
              <Text style={styles.bucketDescription}>{group.description}</Text>
              <View style={styles.bucketAmountsRow}>
                <Text style={styles.bucketAmount}>
                  Plan ₹{group.actualAmount.toFixed(0)} • Goal ₹{group.targetAmount.toFixed(0)}
                </Text>
                <Text style={styles.bucketBalance}>Jar total ₹{group.balancesTotal.toFixed(0)}</Text>
              </View>
            </View>
          ))}
        </View>

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
        <Text style={styles.sectionTitle}>Your Money Jars</Text>
        <Text style={styles.sectionSubtitle}>Tap any jar to transfer money</Text>
        <Text style={styles.sectionCallout}>
          Investments auto-pull from the Invest jar when you schedule them. Keep it funded from your daily split.
        </Text>
        <View style={styles.jarsGrid}>
          {ENVELOPES.map(({ key, label, color, icon }) => {
        <Text style={styles.sectionCallout}>
          Investments auto-pull from the Invest jar when you schedule them. Keep it funded from your daily split.
        </Text> activeOpacity={0.7}
              >
                <View style={styles.jarBody}>
        <Text style={styles.sectionCallout}>
          Investments auto-pull from the Invest jar when you schedule them. Keep it funded from your daily split.
        </Text>     <View style={[styles.jarIconContainer, { backgroundColor: `${color}20` }]}>
                      <Icon name={icon as any} size={24} color={color} />
                    </View>
                    <Text style={styles.jarLabel}>{label}</Text>
                    <Text style={[styles.jarAmount, { color }]}>
                      ₹{balance.toLocaleString('en-IN')}
                    </Text>
                    {fillPercentage > 0 && (
                      <View style={styles.jarFillBar}>
                        <View 
                          style={[
                            styles.jarFillBarInner,
                            { 
                              width: `${fillPercentage}%`,
                              backgroundColor: color,
                            }
                          ]}
                        />
                      </View>
                    )}
                  </View>
                </View>
                {/* Jar lid */}
                <View style={[styles.jarLid, { backgroundColor: color }]} />
              </TouchableOpacity>
            );
          })}
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
                );//hlloyrdyinh adkfj testing
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
              <TouchableOpacity
                onPress={() => {
                  const avail = state.balances[fromEnv] || 0;
                  setTransferAmount(String(Math.max(0, Math.floor(avail))));
                }}
                style={styles.maxButton}
              >
                <Text style={styles.maxButtonText}>Max</Text>
              </TouchableOpacity>
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
  allocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  allocLabel: {
    fontWeight: '600',
    marginRight: 6,
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
  allocSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  allocSummaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  allocOk: { backgroundColor: '#e6f8ec' },
  allocUnder: { backgroundColor: '#fff4d6' },
  allocOver: { backgroundColor: '#ffe3e3' },
  allocHintPill: {
    backgroundColor: '#f5f5f5',
  },
  allocSummaryText: {
    fontWeight: '600',
    color: '#1c1c1e',
    fontSize: 12,
  },
  bucketCard: {
    marginTop: 16,
    backgroundColor: '#f7faff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e2ff',
  },
  bucketHeader: {
    marginBottom: 8,
  },
  bucketTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0a3d91',
  },
  bucketSubtitle: {
    fontSize: 12,
    color: '#4b587c',
    marginTop: 2,
  },
  bucketRow: {
    marginTop: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e6f8',
  },
  bucketRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bucketRowLabel: {
    fontWeight: '600',
    color: '#1c1c1e',
    fontSize: 14,
  },
  bucketRowValue: {
    fontWeight: '600',
    fontSize: 13,
  },
  bucketOver: {
    color: '#FF3B30',
  },
  bucketUnder: {
    color: '#FF9500',
  },
  bucketOnTrack: {
    color: '#34C759',
  },
  bucketProgressBar: {
    marginTop: 10,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eef2ff',
    overflow: 'hidden',
  },
  bucketProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bucketDescription: {
    marginTop: 8,
    color: '#4b587c',
    fontSize: 12,
    lineHeight: 16,
  },
  bucketAmountsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bucketAmount: {
    fontSize: 12,
    color: '#1c1c1e',
    fontWeight: '600',
  },
  bucketBalance: {
    fontSize: 12,
    color: '#4b587c',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
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
  sectionSubtitle: {
    color: '#6c6c70',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  sectionCallout: {
    backgroundColor: '#eef9ff',
    borderRadius: 10,
    padding: 10,
    color: '#0a84ff',
    fontSize: 12,
    marginBottom: 12,
  },
  jarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jarContainer: {
    width: '48%',
  sectionCallout: {
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,ble',
  },
  jarBody: {
    overflow: 'hidden',
    borderColor: '#ffffff',
    borderBottomWidth: 0,
  },
  jarFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  jarContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  jarLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
    marginTop: 4,
    textAlign: 'center',
  },
  jarAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  jarFillBar: {
    width: '80%',
    height: 4,
    backgroundColor: '#e5e5ea',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  jarFillBarInner: {
    height: '100%',
    borderRadius: 2,
  },
  jarLid: {
    width: '100%',
    height: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 2,
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
    borderWidth: 2.5,
    borderColor: '#e5e5ea',
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    minWidth: 110,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  maxButton: {
    marginLeft: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  maxButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 12,
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


