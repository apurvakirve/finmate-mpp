import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
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

export type EnvelopeKey = string;

type JarBucket = 'needs-fixed' | 'needs-variable' | 'wants' | 'savings' | 'invest';

interface JarMeta {
  key: EnvelopeKey;
  label: string;
  color: string;
  icon: string;
  bucket: JarBucket;
  description: string;
  targetPct?: number;
  defaultTarget?: number;
  examples?: string;
}

const ENVELOPES: JarMeta[] = [
  {
    key: 'emis',
    label: 'EMIs & Loans',
    color: '#5F27CD',
    icon: 'credit-card',
    bucket: 'needs-fixed',
    description: 'Loan instalments, insurance premiums, tuition fees',
    targetPct: 15,
  },
  {
    key: 'rent',
    label: 'Rent & Housing',
    color: '#1D4ED8',
    icon: 'home',
    bucket: 'needs-fixed',
    description: 'Rent, maintenance, property dues',
    targetPct: 15,
    defaultTarget: 15000,
  },
  {
    key: 'insurance',
    label: 'Insurance & Medical',
    color: '#F43F5E',
    icon: 'heart',
    bucket: 'needs-fixed',
    description: 'Life, health & term insurance payments',
    targetPct: 5,
  },
  {
    key: 'other',
    label: 'Utilities & Bills',
    color: '#00B8D9',
    icon: 'zap',
    bucket: 'needs-fixed',
    description: 'Electricity, broadband, data packs',
    targetPct: 5,
  },
  {
    key: 'meal',
    label: 'Groceries & Meals',
    color: '#FF9F1C',
    icon: 'shopping-cart',
    bucket: 'needs-variable',
    description: 'Food, essentials, household supplies',
    targetPct: 10,
  },
  {
    key: 'travel',
    label: 'Commute & Fuel',
    color: '#4F46E5',
    icon: 'navigation',
    bucket: 'needs-variable',
    description: 'Fuel, public transport, cabs',
    targetPct: 5,
  },
  {
    key: 'treats',
    label: 'Dining & Fun',
    color: '#FF6B6B',
    icon: 'coffee',
    bucket: 'wants',
    description: 'Eating out, entertainment, subscriptions',
    targetPct: 10,
  },
  {
    key: 'vacations',
    label: 'Goals & Vacations',
    color: '#F97316',
    icon: 'umbrella',
    bucket: 'wants',
    description: 'Trips, gadgets, hobbies & treats',
    targetPct: 20,
  },
  {
    key: 'savings',
    label: 'Savings Goals',
    color: '#2EC4B6',
    icon: 'shield',
    bucket: 'savings',
    description: 'Short-term savings and buffers',
    targetPct: 10,
    defaultTarget: 20000,
  },
  {
    key: 'emergency',
    label: 'Emergency Fund',
    color: '#0EA5E9',
    icon: 'life-buoy',
    bucket: 'savings',
    description: '3-6 month rainy day stash',
    targetPct: 5,
    defaultTarget: 30000,
  },
  {
    key: 'investments',
    label: 'Investments',
    color: '#7C3AED',
    icon: 'trending-up',
    bucket: 'invest',
    description: 'SIPs, mutual funds, stocks',
    targetPct: 5,
    defaultTarget: 5000,
  },
];

const BUCKET_COPY: Record<JarBucket, { title: string; subtitle: string; targetPct: number; accent: string }> = {
  'needs-fixed': {
    title: 'Fixed Needs',
    subtitle: 'EMIs, rent, insurance that stay constant',
    targetPct: 25,
    accent: '#2563EB',
  },
  'needs-variable': {
    title: 'Variable Needs',
    subtitle: 'Groceries, transport, daily utilities',
    targetPct: 25,
    accent: '#22C55E',
  },
  wants: {
    title: 'Wants & Goals',
    subtitle: 'Vacations, hobbies, eating out',
    targetPct: 30,
    accent: '#F97316',
  },
  savings: {
    title: 'Savings & Safety',
    subtitle: 'Emergency buffers, short-term goals',
    targetPct: 15,
    accent: '#0EA5E9',
  },
  invest: {
    title: 'Investments',
    subtitle: 'Long-term wealth building',
    targetPct: 5,
    accent: '#7C3AED',
  },
};

const READY_KEY = (userId: string | number) => `mt_ready_investments_${userId}`;

const DEFAULT_BALANCES = ENVELOPES.reduce(
  (acc, jar) => {
    acc[jar.key] = 0;
    return acc;
  },
  {} as Record<EnvelopeKey, number>
);

const DEFAULT_ALLOCATIONS = ENVELOPES.reduce(
  (acc, jar) => {
    acc[jar.key] = jar.targetPct ?? 0;
    return acc;
  },
  {} as Record<EnvelopeKey, number>
);

const DEFAULT_TARGETS = ENVELOPES.reduce(
  (acc, jar) => {
    if (jar.defaultTarget) {
      acc[jar.key] = jar.defaultTarget;
    }
    return acc;
  },
  {} as Record<EnvelopeKey, number>
);

interface ReadyInvestment {
  id: EnvelopeKey;
  label: string;
  targetAmount: number;
  bucket: JarBucket;
  currentAmount: number;
  achievedAt: string;
}

interface EnvelopeState {
  balances: Record<EnvelopeKey, number>;
  allocationsPct: Record<EnvelopeKey, number>;
  dailyIncome: number;
  scheduledInvestmentDay?: number;
  emiPayDay?: number;
  lastInvestmentPull?: {
    amount: number;
    at: string;
  };
  customJars?: JarMeta[];
  jarTargets?: Record<EnvelopeKey, number>;
  readyInvestments?: ReadyInvestment[];
}

const defaultState: EnvelopeState = {
  balances: { ...DEFAULT_BALANCES },
  allocationsPct: { ...DEFAULT_ALLOCATIONS },
  dailyIncome: 500,
  scheduledInvestmentDay: 10,
  emiPayDay: 5,
  lastInvestmentPull: undefined,
  customJars: [],
  jarTargets: { ...DEFAULT_TARGETS },
  readyInvestments: [],
};

const hydrateState = (incoming?: Partial<EnvelopeState>): EnvelopeState => {
  if (!incoming) {
    return { ...defaultState };
  }
  const next: EnvelopeState = {
    ...defaultState,
    ...incoming,
    balances: { ...DEFAULT_BALANCES, ...(incoming.balances || {}) },
    allocationsPct: { ...DEFAULT_ALLOCATIONS, ...(incoming.allocationsPct || {}) },
    jarTargets: { ...DEFAULT_TARGETS, ...(incoming.jarTargets || {}) },
    customJars: incoming.customJars || [],
    readyInvestments: incoming.readyInvestments || [],
  };

  (next.customJars || []).forEach(jar => {
    if (next.balances[jar.key] === undefined) {
      next.balances[jar.key] = 0;
    }
    if (next.allocationsPct[jar.key] === undefined) {
      next.allocationsPct[jar.key] = jar.targetPct ?? 0;
    }
    if (jar.defaultTarget && next.jarTargets && next.jarTargets[jar.key] === undefined) {
      next.jarTargets[jar.key] = jar.defaultTarget;
    }
  });

  return next;
};

const CUSTOM_COLORS = ['#6366F1', '#EC4899', '#0EA5E9', '#22C55E', '#F97316', '#14B8A6'];

interface PiggyBanksProps {
  userId: string | number;
  todayIncome?: number;
  todayNetIncome?: number;
  cashBalance?: number;
  transactions?: any[];
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
  cashBalance = 0,
  transactions = [],
}: PiggyBanksProps) {
  const [state, setState] = useState<EnvelopeState>(defaultState);
  const [pendingAllocations, setPendingAllocations] = useState<Record<EnvelopeKey, number> | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'investment' | 'emi'>('investment');
  const [addJarVisible, setAddJarVisible] = useState(false);
  const [addJarBucket, setAddJarBucket] = useState<JarBucket>('needs-variable');
  const [addJarName, setAddJarName] = useState('');
  const [addJarColor, setAddJarColor] = useState(CUSTOM_COLORS[0]);
  const [addJarTarget, setAddJarTarget] = useState('');
  const [addJarDescription, setAddJarDescription] = useState('');
  const [targetJar, setTargetJar] = useState<JarMeta | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [moveJarModal, setMoveJarModal] = useState<{ from: EnvelopeKey; to: EnvelopeKey | null } | null>(null);
  const [moveAmount, setMoveAmount] = useState('');

  const key = useMemo(() => storageKey(userId), [userId]);
  const customJars = useMemo(() => state.customJars || [], [state.customJars]);
  const combinedJars = useMemo(() => {
    const defaults = [...ENVELOPES];
    const existingIds = new Set(defaults.map(j => j.key));
    customJars.forEach(jar => {
      if (!existingIds.has(jar.key)) {
        defaults.push(jar);
      }
    });
    return defaults;
  }, [customJars]);
  const jarMetaMap = useMemo(
    () => Object.fromEntries(combinedJars.map(jar => [jar.key, jar])),
    [combinedJars]
  );

  // Change from percentage-based to money-based allocations
  const allocationsMoney = useMemo(() => {
    return combinedJars.reduce((acc, jar) => {
      const pct = state.allocationsPct[jar.key] || 0;
      acc[jar.key] = Math.floor((effectiveIncome * pct) / 100);
      return acc;
    }, {} as Record<EnvelopeKey, number>);
  }, [combinedJars, state.allocationsPct, effectiveIncome]);
  
  const totalAllocated = useMemo(() => {
    return Object.values(allocationsMoney).reduce((acc, v) => acc + v, 0);
  }, [allocationsMoney]);
  
  const remainingAllocation = effectiveIncome - totalAllocated;

  useEffect(() => {
    (async () => {
      try {
        const [raw, readyRaw] = await Promise.all([
          AsyncStorage.getItem(key),
          AsyncStorage.getItem(READY_KEY(userId)),
        ]);
        const stored = raw ? JSON.parse(raw) : undefined;
        const hydrated = hydrateState(stored);
        if (readyRaw) {
          hydrated.readyInvestments = JSON.parse(readyRaw);
        }
        setState(hydrated);
      } catch (error) {
        console.warn('Failed to load jars', error);
      }
    })();
  }, [key, userId]);

  const syncReadyInvestments = async (snapshot: EnvelopeState) => {
    const jarDefs = (() => {
      const defaults = [...ENVELOPES];
      const ids = new Set(defaults.map(j => j.key));
      (snapshot.customJars || []).forEach(j => {
        if (!ids.has(j.key)) {
          defaults.push(j);
        }
      });
      return defaults;
    })();

    const ready = jarDefs
      .map(jar => {
        const targetAmount = snapshot.jarTargets?.[jar.key] ?? jar.defaultTarget ?? 0;
        const balance = snapshot.balances[jar.key] || 0;
        const shouldTrack = ['invest', 'savings'].includes(jar.bucket);
        if (!targetAmount || !shouldTrack) return null;
        if (balance < targetAmount) return null;
        return {
          id: jar.key,
          label: jar.label,
          targetAmount,
          currentAmount: balance,
          bucket: jar.bucket,
          achievedAt: new Date().toISOString(),
        } as ReadyInvestment;
      })
      .filter(Boolean) as ReadyInvestment[];

    const updated = { ...snapshot, readyInvestments: ready };
    await AsyncStorage.setItem(READY_KEY(userId), JSON.stringify(ready));
    return updated;
  };

  const persist = async (next: EnvelopeState) => {
    const normalized = hydrateState(next);
    const withReady = await syncReadyInvestments(normalized);
    setState(withReady);
    await AsyncStorage.setItem(key, JSON.stringify(withReady));
  };

  const effectiveIncome = useMemo(() => {
    // Only show if there are transactions today
    if (todayNetIncome > 0) return todayNetIncome;
    if (todayIncome > 0) return todayIncome;
    return 0; // Don't show default if no transactions today
  }, [todayIncome, todayNetIncome]);
  
  const hasTodayTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const start = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
    const end = new Date(yyyy, mm, dd, 23, 59, 59).getTime();
    
    return transactions.some((t) => {
      const created = new Date(t.created_at).getTime();
      return created >= start && created <= end;
    });
  }, [transactions]);

  const bucketSections = useMemo(() => {
    const totalBalance = Object.values(state.balances).reduce((acc, val) => acc + val, 0);
    return (Object.keys(BUCKET_COPY) as JarBucket[]).reduce((acc, bucket) => {
      const jars = combinedJars.filter(jar => jar.bucket === bucket);
      const saved = jars.reduce((sum, jar) => sum + (state.balances[jar.key] || 0), 0);
      const plannedPct = jars.reduce((sum, jar) => sum + (state.allocationsPct[jar.key] || 0), 0);
      const share = totalBalance > 0 ? (saved / totalBalance) * 100 : 0;
      acc[bucket] = {
        jars,
        saved,
        share,
        plannedPct,
        targetPct: BUCKET_COPY[bucket].targetPct,
      };
      return acc;
    }, {} as Record<JarBucket, { jars: JarMeta[]; saved: number; share: number; plannedPct: number; targetPct: number }>);
  }, [combinedJars, state.allocationsPct, state.balances]);

  const proposeTodayAllocation = () => {
    // Use current money allocations directly
    setPendingAllocations(allocationsMoney);
  };
  
  const updateAllocationMoney = (jarKey: EnvelopeKey, amount: number) => {
    const newAllocations = { ...allocationsMoney };
    newAllocations[jarKey] = Math.max(0, Math.min(effectiveIncome, amount));
    
    // Update percentage allocations based on money
    const next = {
      ...state,
      allocationsPct: { ...state.allocationsPct },
    };
    
    if (effectiveIncome > 0) {
      next.allocationsPct[jarKey] = Math.round((newAllocations[jarKey] / effectiveIncome) * 100);
    }
    
    persist(next);
  };

  const confirmAllocation = async () => {
    if (!pendingAllocations) return;
    const next = { ...state, balances: { ...state.balances } };
    combinedJars.forEach(({ key }) => {
      next.balances[key] = (next.balances[key] || 0) + (pendingAllocations[key] || 0);
    });
    await persist(next);
    setPendingAllocations(null);
  };

  const handleMoveBetweenJars = async () => {
    if (!moveJarModal) return;
    const amt = parseFloat(moveAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!moveJarModal.to) {
      Alert.alert('Error', 'Please select a destination jar');
      return;
    }
    if (moveJarModal.from === moveJarModal.to) {
      Alert.alert('Error', 'Please select different jars');
      return;
    }
    const fromBalance = state.balances[moveJarModal.from] || 0;
    if (fromBalance < amt) {
      const fromLabel = jarMetaMap[moveJarModal.from]?.label || 'selected jar';
      Alert.alert('Error', `Insufficient balance in ${fromLabel}. Available: ₹${fromBalance.toFixed(0)}`);
      return;
    }

    const next = {
      ...state,
      balances: {
        ...state.balances,
        [moveJarModal.from]: fromBalance - amt,
        [moveJarModal.to]: (state.balances[moveJarModal.to] || 0) + amt,
      },
    };
    await persist(next);
    setMoveAmount('');
    setMoveJarModal(null);
    const fromLabel = jarMetaMap[moveJarModal.from]?.label || 'Jar';
    const toLabel = jarMetaMap[moveJarModal.to]?.label || 'Jar';
    Alert.alert('Success', `₹${amt.toFixed(0)} moved from ${fromLabel} to ${toLabel}`);
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


  const readyJarCount = state.readyInvestments?.length || 0;

  const openAddJar = (bucket: JarBucket) => {
    setAddJarBucket(bucket);
    setAddJarColor(CUSTOM_COLORS[Math.floor(Math.random() * CUSTOM_COLORS.length)]);
    setAddJarName('');
    setAddJarTarget('');
    setAddJarDescription('');
    setAddJarVisible(true);
  };

  const handleCreateJar = async () => {
    if (!addJarName.trim()) {
      Alert.alert('Name required', 'Give this jar a name so you remember what it is for.');
      return;
    }
    const newKey = `custom-${Date.now()}`;
    const newJar: JarMeta = {
      key: newKey,
      label: addJarName.trim(),
      color: addJarColor,
      icon: 'target',
      bucket: addJarBucket,
      description: addJarDescription.trim() || BUCKET_COPY[addJarBucket].subtitle,
      targetPct: 0,
      defaultTarget: addJarTarget ? parseInt(addJarTarget, 10) : undefined,
    };

    const next: EnvelopeState = {
      ...state,
      balances: { ...state.balances, [newKey]: 0 },
      allocationsPct: { ...state.allocationsPct, [newKey]: 0 },
      customJars: [...(state.customJars || []), newJar],
      jarTargets: {
        ...(state.jarTargets || {}),
        [newKey]: addJarTarget ? parseInt(addJarTarget, 10) : 0,
      },
    };

    await persist(next);
    setAddJarVisible(false);
  };

  const startEditTarget = (jar: JarMeta) => {
    setTargetJar(jar);
    setTargetValue(String(state.jarTargets?.[jar.key] ?? jar.defaultTarget ?? ''));
  };

  const handleSaveTarget = async () => {
    if (!targetJar) return;
    const amount = Math.max(0, parseInt(targetValue || '0', 10));
    const next = {
      ...state,
      jarTargets: {
        ...(state.jarTargets || {}),
        [targetJar.key]: amount,
      },
    };
    await persist(next);
    setTargetJar(null);
    setTargetValue('');
  };

  const bucketOrder: JarBucket[] = ['needs-fixed', 'needs-variable', 'wants', 'savings', 'invest'];
  const readyJarSet = useMemo(
    () => new Set((state.readyInvestments || []).map(item => item.id)),
    [state.readyInvestments]
  );

  const renderJarCard = (jar: JarMeta) => {
    const balance = state.balances[jar.key] || 0;
    const targetAmount = state.jarTargets?.[jar.key] ?? jar.defaultTarget ?? 0;
    const progress = targetAmount > 0 ? Math.min(100, (balance / targetAmount) * 100) : 0;
    const isReady = readyJarSet.has(jar.key);
    const isCustomJar = jar.key.startsWith('custom-');
    
    return (
      <View key={jar.key} style={styles.jarCard}>
        <View style={styles.jarCardHeader}>
          <View style={[styles.jarCardIcon, { backgroundColor: `${jar.color}20` }]}>
            <Icon name={jar.icon as any} size={20} color={jar.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.jarCardTitle}>{jar.label}</Text>
            <Text style={styles.jarCardDescription}>{jar.description}</Text>
          </View>
          {isReady && (
            <View style={styles.jarReadyBadgeContainer}>
              <Text style={styles.jarReadyBadge}>Ready</Text>
            </View>
          )}
        </View>
        <View style={styles.jarAmountSection}>
          <Text style={styles.jarCardAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          {targetAmount > 0 && (
            <Text style={styles.jarCardTarget}>
              Target: ₹{targetAmount.toLocaleString('en-IN')} ({progress.toFixed(0)}%)
            </Text>
          )}
        </View>
        <View style={styles.jarProgressBackground}>
          <View
            style={[
              styles.jarProgressFill,
              {
                width: `${progress}%`,
                backgroundColor: jar.color,
              },
            ]}
          />
        </View>
        <View style={styles.jarCardActions}>
          {isCustomJar && balance > 0 && (
            <TouchableOpacity 
              style={[styles.jarActionButton, styles.jarMoveButton]} 
              onPress={() => setMoveJarModal({ from: jar.key, to: null })}
            >
              <Icon name="arrow-right-circle" size={16} color="#007AFF" />
              <Text style={styles.jarActionText}>Move</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.jarActionButton} onPress={() => startEditTarget(jar)}>
            <Icon name="edit-2" size={16} color="#4B5563" />
            <Text style={styles.jarActionText}>Target</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderJarSection = (bucket: JarBucket) => {
    const section = bucketSections[bucket];
    if (!section) return null;
    const meta = BUCKET_COPY[bucket];
    return (
      <View key={bucket} style={styles.jarSection}>
        <View style={styles.jarSectionHeader}>
          <View>
            <Text style={styles.jarSectionTitle}>{meta.title}</Text>
            <Text style={styles.jarSectionSubtitle}>{meta.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.addJarButton} onPress={() => openAddJar(bucket)}>
            <Icon name="plus" size={14} color="#007AFF" />
            <Text style={styles.addJarButtonText}>Add jar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bucketSummaryRow}>
          <Text style={styles.bucketAmount}>₹{section.saved.toFixed(0)} saved</Text>
          <Text style={styles.bucketBalance}>
            {section.share.toFixed(1)}% of jars
          </Text>
        </View>
        {section.jars.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarCardsScroll}>
            {section.jars.map(renderJarCard)}
          </ScrollView>
        ) : (
          <Text style={styles.emptyJarText}>No jars yet. Add one to start tracking this bucket.</Text>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.wrapper} showsVerticalScrollIndicator={false}>
      {hasTodayTransactions && effectiveIncome > 0 && (
        <View style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Net earned today</Text>
            <Text style={styles.summaryValue}>₹{effectiveIncome.toFixed(0)}</Text>
            <View style={styles.summaryMetaRow}>
              <View style={styles.metaItem}>
                <Icon name="arrow-down" size={14} color="#34C759" />
                <Text style={[styles.summaryMeta, { color: '#34C759', marginLeft: 4 }]}>₹{todayIncome.toFixed(0)} received</Text>
              </View>
              {todayNetIncome < todayIncome && (
                <View style={styles.metaItem}>
                  <Icon name="arrow-up" size={14} color="#FF3B30" />
                  <Text style={[styles.summaryMeta, { color: '#FF3B30', marginLeft: 4 }]}>₹{Math.max(0, todayIncome - todayNetIncome).toFixed(0)} spent</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {readyJarCount > 0 && (
        <View style={styles.readyInvestCard}>
          <View style={styles.readyInvestHeader}>
            <Icon name="target" size={16} color="#7C3AED" />
            <Text style={styles.readyInvestTitle}>Jars ready to invest</Text>
          </View>
          {(state.readyInvestments || []).map(item => (
            <View key={item.id} style={styles.readyInvestRow}>
              <Text style={styles.readyInvestLabel}>{jarMetaMap[item.id]?.label || item.label}</Text>
              <Text style={styles.readyInvestAmount}>
                ₹{(item.currentAmount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
          <Text style={styles.readyInvestHint}>Hop over to the Investments tab whenever you are ready.</Text>
          {state.lastInvestmentPull && (
            <Text style={styles.readyInvestHint}>
              Last auto sweep · {new Date(state.lastInvestmentPull.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          )}
        </View>
      )}

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

      {hasTodayTransactions && effectiveIncome > 0 && (
        <View style={styles.incomeCard}>
          <Text style={styles.sectionTitle}>Allocation Plan</Text>
          <Text style={styles.allocDescription}>Set how much money (₹{effectiveIncome.toFixed(0)}) goes to each jar based on your priority</Text>
          
          <View style={styles.allocSummaryBox}>
            <View style={styles.allocSummaryRow}>
              <Text style={styles.allocSummaryLabel}>Total Allocated</Text>
              <Text style={[styles.allocSummaryText, { color: remainingAllocation >= 0 ? '#34C759' : '#FF3B30' }]}>
                ₹{totalAllocated.toFixed(0)} / ₹{effectiveIncome.toFixed(0)}
              </Text>
            </View>
            {remainingAllocation > 0 && (
              <Text style={styles.allocHint}>
                ₹{remainingAllocation.toFixed(0)} remaining to allocate
              </Text>
            )}
            {remainingAllocation < 0 && (
              <Text style={[styles.allocHint, { color: '#FF3B30' }]}>
                Over by ₹{Math.abs(remainingAllocation).toFixed(0)}
              </Text>
            )}
          </View>

          <View style={styles.allocGrid}>
            {combinedJars.map(({ key, label, color, icon }) => {
              const amount = allocationsMoney[key] || 0;
              const sliderValue = effectiveIncome > 0 ? (amount / effectiveIncome) * 100 : 0;
              return (
                <View key={key} style={styles.allocItem}>
                  <View style={styles.allocItemHeader}>
                    <View style={[styles.allocIconContainer, { backgroundColor: `${color}15` }]}>
                      <Icon name={icon as any} size={18} color={color} />
                    </View>
                    <Text style={styles.allocItemLabel} numberOfLines={1}>{label}</Text>
                  </View>
                  <View style={styles.allocSliderContainer}>
                    <View style={styles.allocSliderTrack}>
                      <View
                        style={[
                          styles.allocSliderFill,
                          {
                            width: `${Math.min(100, Math.max(0, sliderValue))}%`,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.allocInputContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      value={String(amount)}
                      onChangeText={(value) => {
                        const numValue = Math.max(0, Math.min(effectiveIncome, parseInt(value || '0', 10)));
                        updateAllocationMoney(key, numValue);
                      }}
                      keyboardType="numeric"
                      style={[styles.allocInputMoney, { borderColor: color }]}
                      placeholder="0"
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={proposeTodayAllocation}>
            <Icon name="zap" size={18} color="white" />
            <Text style={styles.primaryButtonText}>Allocate Today's Income</Text>
          </TouchableOpacity>
          {pendingAllocations && (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>Today's Allocation</Text>
              <View style={styles.pendingList}>
                {combinedJars
                  .filter(({ key }) => (pendingAllocations[key] || 0) > 0)
                  .map(({ key, label, color }) => (
                    <View key={key} style={styles.pendingRow}>
                      <View style={styles.pendingRowLeft}>
                        <View style={[styles.pendingDot, { backgroundColor: color }]} />
                        <Text style={styles.pendingLabel}>{label}</Text>
                      </View>
                      <Text style={[styles.pendingValue, { color }]}>₹{(pendingAllocations[key] || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
              </View>
              <TouchableOpacity style={[styles.primaryButton, { backgroundColor: '#34C759', marginTop: 16 }]} onPress={confirmAllocation}>
                <Text style={styles.primaryButtonText}>Confirm & Add to Jars</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkButton} onPress={() => setPendingAllocations(null)}>
                <Text style={styles.linkButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {bucketOrder.map(bucket => renderJarSection(bucket))}

      <Modal visible={addJarVisible} animationType="slide" transparent onRequestClose={() => setAddJarVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add a new jar</Text>
            <Text style={styles.modalLabel}>Jar name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Eg. Phone upgrade"
              value={addJarName}
              onChangeText={setAddJarName}
            />

            <Text style={styles.modalLabel}>Jar type</Text>
            <View style={styles.modalBucketRow}>
              {bucketOrder.map(bucket => (
                <TouchableOpacity
                  key={`bucket-${bucket}`}
                  style={[
                    styles.bucketChip,
                    addJarBucket === bucket && { backgroundColor: `${BUCKET_COPY[bucket].accent}15`, borderColor: BUCKET_COPY[bucket].accent },
                  ]}
                  onPress={() => setAddJarBucket(bucket)}
                >
                  <Text
                    style={[
                      styles.bucketChipText,
                      addJarBucket === bucket && { color: BUCKET_COPY[bucket].accent },
                    ]}
                  >
                    {BUCKET_COPY[bucket].title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Target amount (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Eg. 5000"
              keyboardType="numeric"
              value={addJarTarget}
              onChangeText={setAddJarTarget}
            />

            <Text style={styles.modalLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, { height: 60 }]}
              placeholder="What will you store here?"
              value={addJarDescription}
              onChangeText={setAddJarDescription}
              multiline
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setAddJarVisible(false)}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleCreateJar}>
                <Text style={styles.modalPrimaryText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!targetJar} animationType="fade" transparent onRequestClose={() => setTargetJar(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set target for {targetJar?.label}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount in ₹"
              keyboardType="numeric"
              value={targetValue}
              onChangeText={setTargetValue}
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setTargetJar(null)}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveTarget}>
                <Text style={styles.modalPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
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

      <Modal visible={!!moveJarModal} animationType="slide" transparent onRequestClose={() => setMoveJarModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Move Money</Text>
            {moveJarModal && (
              <>
                <Text style={styles.modalLabel}>From: {jarMetaMap[moveJarModal.from]?.label}</Text>
                <Text style={styles.modalSubtext}>
                  Available: ₹{(state.balances[moveJarModal.from] || 0).toFixed(0)}
                </Text>
                
                <Text style={styles.modalLabel}>To</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jarSelector}>
                  {combinedJars
                    .filter(jar => jar.key !== moveJarModal.from)
                    .map(({ key, label, color, icon }) => {
                      const isSelected = moveJarModal.to === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.jarOption,
                            isSelected && { borderColor: color, backgroundColor: `${color}15` },
                          ]}
                          onPress={() => setMoveJarModal({ ...moveJarModal, to: key })}
                        >
                          <Icon name={icon as any} size={20} color={isSelected ? color : '#8e8e93'} />
                          <Text style={[styles.jarOptionLabel, isSelected && { color }]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                <Text style={styles.modalLabel}>Amount</Text>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    value={moveAmount}
                    onChangeText={setMoveAmount}
                    placeholder="Enter amount"
                    keyboardType="numeric"
                    style={styles.amountInput}
                    placeholderTextColor="#8e8e93"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const avail = state.balances[moveJarModal.from] || 0;
                      setMoveAmount(String(Math.max(0, Math.floor(avail))));
                    }}
                    style={styles.maxButton}
                  >
                    <Text style={styles.maxButtonText}>Max</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.modalSecondaryBtn} onPress={() => setMoveJarModal(null)}>
                    <Text style={styles.modalSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalPrimaryBtn,
                      (!moveJarModal.to || !moveAmount || moveJarModal.from === moveJarModal.to) && styles.modalPrimaryBtnDisabled,
                    ]}
                    onPress={handleMoveBetweenJars}
                    disabled={!moveJarModal.to || !moveAmount || moveJarModal.from === moveJarModal.to}
                  >
                    <Text style={styles.modalPrimaryText}>Move</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  allocDescription: {
    fontSize: 14,
    color: '#6c6c70',
    marginTop: 4,
    marginBottom: 16,
  },
  allocSummaryBox: {
    backgroundColor: '#f7faff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  allocSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocSummaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  allocHint: {
    fontSize: 13,
    color: '#6c6c70',
    marginTop: 8,
    textAlign: 'center',
  },
  allocGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  allocItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  allocItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  allocIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  allocItemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
  },
  allocSliderContainer: {
    marginVertical: 10,
  },
  allocSliderTrack: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  allocSliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  allocInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginRight: 6,
  },
  allocInputMoney: {
    borderWidth: 2,
    borderRadius: 8,
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    backgroundColor: 'white',
  },
  allocInput: {
    borderWidth: 2,
    borderRadius: 8,
    width: 60,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    backgroundColor: 'white',
  },
  allocPercent: {
    fontSize: 14,
    color: '#6c6c70',
    marginLeft: 6,
    fontWeight: '600',
  },
  allocAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  allocSummaryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  allocOk: { backgroundColor: '#e6f8ec' },
  allocUnder: { backgroundColor: '#fff4d6' },
  allocOver: { backgroundColor: '#ffe3e3' },
  allocSummaryText: {
    fontWeight: '700',
    color: '#1c1c1e',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  pendingCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pendingTitle: {
    fontWeight: '700',
    color: '#1c1c1e',
    fontSize: 18,
    marginBottom: 16,
  },
  pendingList: {
    marginBottom: 8,
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pendingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  pendingLabel: {
    color: '#1c1c1e',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  pendingValue: {
    fontWeight: '700',
    fontSize: 16,
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
  readyInvestCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  readyInvestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  readyInvestTitle: {
    fontWeight: '700',
    color: '#1c1c1e',
    fontSize: 15,
  },
  readyInvestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  readyInvestLabel: {
    color: '#4b5563',
    fontWeight: '600',
  },
  readyInvestAmount: {
    color: '#111827',
    fontWeight: '700',
  },
  readyInvestHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  sectionCalloutBox: {
    backgroundColor: '#eef9ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionCallout: {
    color: '#0a84ff',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionCalloutSecondary: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  jarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bucketSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jarSection: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  jarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jarSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  jarSectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  addJarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  addJarButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 12,
  },
  jarContainer: {
    width: '48%',
  },
  jarBody: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderColor: '#ffffff',
    borderWidth: 2,
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
  jarCardsScroll: {
    marginTop: 12,
  },
  jarCard: {
    width: 240,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jarAmountSection: {
    marginVertical: 10,
  },
  jarReadyBadgeContainer: {
    backgroundColor: '#e6f8ec',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jarMoveButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jarCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarCardTitle: {
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  jarReadyBadge: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  jarCardDescription: {
    fontSize: 12,
    color: '#6b7280',
    minHeight: 32,
  },
  jarCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 6,
  },
  jarCardTarget: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  jarProgressBackground: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
    overflow: 'hidden',
  },
  jarProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  jarCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  jarActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jarActionText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  emptyJarText: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  modalBucketRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bucketChip: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bucketChipText: {
    fontSize: 12,
    color: '#374151',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
    gap: 12,
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  modalPrimaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#007AFF',
  },
  modalPrimaryText: {
    color: 'white',
    fontWeight: '700',
  },
  modalPrimaryBtnDisabled: {
    backgroundColor: '#c7c7cc',
    opacity: 0.6,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#6c6c70',
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    marginBottom: 12,
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
});


