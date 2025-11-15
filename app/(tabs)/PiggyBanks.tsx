import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  PanResponder,
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
  jarPriorities?: Record<EnvelopeKey, number>; // 1-10 priority score
  editedIncome?: number; // User-edited income amount
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
  jarPriorities: {},
  editedIncome: undefined,
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
  const [editingIncome, setEditingIncome] = useState(false);
  const [tempIncome, setTempIncome] = useState('');

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

  const effectiveIncome = useMemo(() => {
    // User can edit income, otherwise use calculated from transactions
    if (state.editedIncome !== undefined && state.editedIncome > 0) {
      return state.editedIncome;
    }
    // Only show if there are transactions today
    if (todayNetIncome > 0) return todayNetIncome;
    if (todayIncome > 0) return todayIncome;
    return 0; // Don't show default if no transactions today
  }, [todayIncome, todayNetIncome, state.editedIncome]);
  
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

  // AI Algorithm: Calculate priority-based allocation
  const calculatePriorityAllocation = useMemo(() => {
    if (effectiveIncome <= 0) return {};
    
    // Get priorities (default based on jar type, or user-set)
    const priorities = combinedJars.reduce((acc, jar) => {
      const userPriority = state.jarPriorities?.[jar.key];
      if (userPriority !== undefined) {
        acc[jar.key] = userPriority;
      } else {
        // Default priorities based on bucket type
        const bucketPriority: Record<JarBucket, number> = {
          'needs-fixed': 9,    // Highest priority
          'needs-variable': 7,
          'savings': 6,
          'invest': 5,
          'wants': 4,          // Lowest priority
        };
        acc[jar.key] = bucketPriority[jar.bucket] || 5;
      }
      return acc;
    }, {} as Record<EnvelopeKey, number>);

    // Calculate weighted allocation
    const totalPriority = Object.values(priorities).reduce((sum, p) => sum + p, 0);
    const allocations: Record<EnvelopeKey, number> = {};
    
    combinedJars.forEach((jar) => {
      const priority = priorities[jar.key] || 5;
      const weight = priority / totalPriority;
      allocations[jar.key] = Math.floor(effectiveIncome * weight);
    });

    // Distribute remainder to highest priority jars (ensure we don't exceed total)
    const allocated = Object.values(allocations).reduce((sum, v) => sum + v, 0);
    const remainder = effectiveIncome - allocated;
    
    if (remainder > 0) {
      const sortedByPriority = combinedJars
        .map(jar => ({ jar, priority: priorities[jar.key] || 5 }))
        .sort((a, b) => b.priority - a.priority);
      
      let remaining = Math.min(remainder, effectiveIncome - allocated); // Cap at available
      for (const { jar } of sortedByPriority) {
        if (remaining <= 0) break;
        allocations[jar.key] += 1;
        remaining -= 1;
      }
    }
    
    // Final safety check: ensure total never exceeds effectiveIncome
    const finalTotal = Object.values(allocations).reduce((sum, v) => sum + v, 0);
    if (finalTotal > effectiveIncome) {
      // Scale down proportionally
      const scale = effectiveIncome / finalTotal;
      Object.keys(allocations).forEach(key => {
        allocations[key] = Math.floor(allocations[key] * scale);
      });
      // Distribute any remaining rounding errors
      const newTotal = Object.values(allocations).reduce((sum, v) => sum + v, 0);
      const finalRemainder = effectiveIncome - newTotal;
      if (finalRemainder > 0) {
        const sorted = combinedJars
          .map(jar => ({ jar, priority: priorities[jar.key] || 5 }))
          .sort((a, b) => b.priority - a.priority);
        let rem = finalRemainder;
        for (const { jar } of sorted) {
          if (rem <= 0) break;
          allocations[jar.key] += 1;
          rem -= 1;
        }
      }
    }

    return allocations;
  }, [combinedJars, effectiveIncome, state.jarPriorities]);

  // Current allocations (money-based)
  const allocationsMoney = useMemo(() => {
    // If user has manually set allocations, use those, otherwise use AI calculation
    const hasManualAllocations = Object.values(state.allocationsPct || {}).some(p => p > 0);
    
    if (hasManualAllocations) {
      return combinedJars.reduce((acc, jar) => {
        const pct = state.allocationsPct[jar.key] || 0;
        acc[jar.key] = Math.floor((effectiveIncome * pct) / 100);
        return acc;
      }, {} as Record<EnvelopeKey, number>);
    }
    
    return calculatePriorityAllocation;
  }, [combinedJars, state.allocationsPct, effectiveIncome, calculatePriorityAllocation]);
  
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
  
  // Auto-balance allocations when user adjusts one
  const updateAllocationMoney = (jarKey: EnvelopeKey, newAmount: number) => {
    const clampedAmount = Math.max(0, Math.min(effectiveIncome, newAmount));
    const currentAmount = allocationsMoney[jarKey] || 0;
    const difference = clampedAmount - currentAmount;
    
    if (Math.abs(difference) < 1) return; // No significant change
    
    const newAllocations = { ...allocationsMoney };
    newAllocations[jarKey] = clampedAmount;
    
    // Auto-balance: reduce from other jars proportionally
    const otherJars = combinedJars.filter(j => j.key !== jarKey);
    const totalOtherAllocated = otherJars.reduce((sum, j) => sum + (newAllocations[j.key] || 0), 0);
    const maxOtherTotal = effectiveIncome - clampedAmount; // Max available for others
    
    if (totalOtherAllocated > maxOtherTotal) {
      // Need to reduce from others
      const reductionNeeded = totalOtherAllocated - maxOtherTotal;
      const sortedByAmount = otherJars
        .map(j => ({ jar: j, amount: newAllocations[j.key] || 0 }))
        .sort((a, b) => a.amount - b.amount); // Reduce from smallest first
      
      let remaining = reductionNeeded;
      for (const { jar, amount } of sortedByAmount) {
        if (remaining <= 0) break;
        const reduce = Math.min(amount, remaining);
        newAllocations[jar.key] = Math.max(0, amount - reduce);
        remaining -= reduce;
      }
    } else if (totalOtherAllocated < maxOtherTotal) {
      // Can increase others proportionally
      const increaseAvailable = maxOtherTotal - totalOtherAllocated;
      const totalOtherPriority = otherJars.reduce((sum, j) => {
        const priority = state.jarPriorities?.[j.key] || 5;
        return sum + priority;
      }, 0);
      
      otherJars.forEach(jar => {
        const priority = state.jarPriorities?.[jar.key] || 5;
        const weight = totalOtherPriority > 0 ? priority / totalOtherPriority : 1 / otherJars.length;
        newAllocations[jar.key] = (newAllocations[jar.key] || 0) + Math.floor(increaseAvailable * weight);
      });
      
      // Distribute any remainder
      const newOtherTotal = otherJars.reduce((sum, j) => sum + (newAllocations[j.key] || 0), 0);
      const finalRemainder = maxOtherTotal - newOtherTotal;
      if (finalRemainder > 0) {
        const sorted = otherJars
          .map(j => ({ jar: j, priority: state.jarPriorities?.[j.key] || 5 }))
          .sort((a, b) => b.priority - a.priority);
        let rem = finalRemainder;
        for (const { jar } of sorted) {
          if (rem <= 0) break;
          newAllocations[jar.key] += 1;
          rem -= 1;
        }
      }
    }
    
    // Final safety check: ensure total never exceeds effectiveIncome
    const finalTotal = Object.values(newAllocations).reduce((sum, v) => sum + v, 0);
    if (finalTotal > effectiveIncome) {
      const scale = effectiveIncome / finalTotal;
      Object.keys(newAllocations).forEach(key => {
        newAllocations[key] = Math.floor(newAllocations[key] * scale);
      });
    }
    
    // Update percentage allocations based on money
    const next = {
      ...state,
      allocationsPct: { ...state.allocationsPct },
    };
    
    if (effectiveIncome > 0) {
      combinedJars.forEach(jar => {
        next.allocationsPct[jar.key] = Math.round(((newAllocations[jar.key] || 0) / effectiveIncome) * 100);
      });
    }
    
    persist(next);
  };
  
  const saveEditedIncome = async () => {
    const amount = parseFloat(tempIncome);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const next = {
      ...state,
      editedIncome: amount,
    };
    await persist(next);
    setEditingIncome(false);
    setTempIncome('');
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
    
    return (
      <View key={jar.key} style={[styles.jarCard, { borderLeftWidth: 4, borderLeftColor: jar.color }]}>
        <View style={styles.jarCardHeader}>
          <View style={[styles.jarCardIcon, { backgroundColor: jar.color }]}>
            <Icon name={jar.icon as any} size={22} color="white" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.jarTitleRow}>
          <Text style={styles.jarCardTitle}>{jar.label}</Text>
              {isReady && (
                <View style={styles.jarReadyBadgeContainer}>
                  <Icon name="check-circle" size={14} color="#34C759" />
                  <Text style={styles.jarReadyBadge}>Ready</Text>
        </View>
              )}
            </View>
            <Text style={styles.jarCardDescription} numberOfLines={1}>{jar.description}</Text>
          </View>
        </View>
        
        <View style={styles.jarAmountSection}>
        <Text style={styles.jarCardAmount}>₹{balance.toLocaleString('en-IN')}</Text>
          {targetAmount > 0 && (
            <View style={styles.jarTargetRow}>
        <Text style={styles.jarCardTarget}>
                Target: ₹{targetAmount.toLocaleString('en-IN')}
        </Text>
              <Text style={[styles.jarProgressText, { color: jar.color }]}>
                {progress.toFixed(0)}%
              </Text>
            </View>
          )}
        </View>
        
        {targetAmount > 0 && (
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
        )}
        
        <View style={styles.jarCardActions}>
          {balance > 0 && (
            <TouchableOpacity 
              style={styles.jarMoveButton} 
              onPress={() => setMoveJarModal({ from: jar.key, to: null })}
            >
              <Icon name="arrow-right" size={16} color="white" />
              <Text style={styles.jarMoveButtonText}>Move Money</Text>
          </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.jarTargetButton} onPress={() => startEditTarget(jar)}>
            <Icon name="target" size={16} color={jar.color} />
            <Text style={[styles.jarTargetButtonText, { color: jar.color }]}>Set Target</Text>
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
      {effectiveIncome > 0 && (
      <View style={styles.summaryCard}>
        <View style={{ flex: 1 }}>
            <View style={styles.summaryHeaderRow}>
          <Text style={styles.summaryLabel}>Net earned today</Text>
              <TouchableOpacity onPress={() => {
                setEditingIncome(true);
                setTempIncome(String(effectiveIncome));
              }}>
                <Icon name="edit-2" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            {editingIncome ? (
              <View style={styles.incomeEditContainer}>
                <View style={styles.incomeEditRow}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    value={tempIncome}
                    onChangeText={setTempIncome}
                    keyboardType="numeric"
                    style={styles.incomeEditInput}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.incomeEditSave} onPress={saveEditedIncome}>
                    <Icon name="check" size={18} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.incomeEditCancel} onPress={() => {
                    setEditingIncome(false);
                    setTempIncome('');
                  }}>
                    <Icon name="x" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
          <Text style={styles.summaryValue}>₹{effectiveIncome.toFixed(0)}</Text>
                {!state.editedIncome && (
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
                )}
              </>
            )}
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

      {effectiveIncome > 0 && (
      <View style={styles.incomeCard}>
          <View style={styles.allocHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.allocTitleRow}>
                <Icon name="zap" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Allocation Plan</Text>
              </View>
              <Text style={styles.allocDescription}>
                AI suggests allocation based on priority. Adjust amounts using +/- buttons, slider, or enter directly.
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.resetAllocButton}
              onPress={() => {
                // Reset to AI allocation
                const next = {
                  ...state,
                  allocationsPct: {},
                };
                persist(next);
              }}
            >
              <Icon name="refresh-cw" size={16} color="#007AFF" />
              <Text style={styles.resetAllocText}>Reset</Text>
            </TouchableOpacity>
          </View>
        
        <View style={styles.allocSummaryBox}>
          <View style={styles.allocSummaryRow}>
              <Text style={styles.allocSummaryLabel}>Total Allocated</Text>
              <Text style={[styles.allocSummaryText, { color: Math.abs(remainingAllocation) < 1 ? '#34C759' : remainingAllocation > 0 ? '#FF9500' : '#FF3B30' }]}>
                ₹{totalAllocated.toFixed(0)} / ₹{effectiveIncome.toFixed(0)}
              </Text>
            </View>
            {Math.abs(remainingAllocation) >= 1 && (
              <Text style={[styles.allocHint, { color: remainingAllocation > 0 ? '#FF9500' : '#FF3B30' }]}>
                {remainingAllocation > 0 
                  ? `₹${remainingAllocation.toFixed(0)} remaining to allocate`
                  : `Over by ₹${Math.abs(remainingAllocation).toFixed(0)}`}
            </Text>
          )}
        </View>

        <View style={styles.allocGrid}>
          {combinedJars.map(({ key, label, color, icon }) => {
            const amount = allocationsMoney[key] || 0;
            const sliderValue = effectiveIncome > 0 ? Math.min(100, Math.max(0, (amount / effectiveIncome) * 100)) : 0;
            
            // Create draggable slider component
            const SliderComponent = () => {
              const [sliderWidth, setSliderWidth] = useState(0);
              const [isDragging, setIsDragging] = useState(false);
              const trackRef = useRef<View>(null);
              
              const panResponder = PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: () => setIsDragging(true),
                onPanResponderMove: (evt, gestureState) => {
                  if (sliderWidth > 0 && trackRef.current) {
                    trackRef.current.measure((fx: number, fy: number, fw: number, fh: number, px: number, py: number) => {
                      const relativeX = evt.nativeEvent.pageX - px;
                      const newPercent = Math.max(0, Math.min(100, (relativeX / sliderWidth) * 100));
                      const newAmount = Math.floor((effectiveIncome * newPercent) / 100);
                      updateAllocationMoney(key, newAmount);
                    });
                  }
                },
                onPanResponderRelease: () => setIsDragging(false),
              });
              
              return (
                <View style={styles.allocSliderContainer}>
                  <View 
                    ref={trackRef}
                    style={styles.allocSliderTrack} 
                    {...panResponder.panHandlers}
                    onLayout={(e) => {
                      setSliderWidth(e.nativeEvent.layout.width);
                    }}
                  >
                    <View
                      style={[
                        styles.allocSliderFill,
                        {
                          width: `${sliderValue}%`,
                          backgroundColor: color,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.allocSliderThumb,
                        {
                          left: `${sliderValue}%`,
                          backgroundColor: color,
                          transform: [{ translateX: -8 }],
                        },
                        isDragging && styles.allocSliderThumbActive,
                      ]}
                    />
                  </View>
                </View>
              );
            };
            
            return (
              <View key={key} style={styles.allocItem}>
                <View style={styles.allocItemHeader}>
                  <View style={[styles.allocIconContainer, { backgroundColor: `${color}15` }]}>
                    <Icon name={icon as any} size={18} color={color} />
                  </View>
                  <Text style={styles.allocItemLabel} numberOfLines={1}>{label}</Text>
                  <Text style={[styles.allocItemAmount, { color }]}>₹{amount.toFixed(0)}</Text>
                </View>
                <SliderComponent />
                <View style={styles.allocInputRow}>
                  <TouchableOpacity
                    style={[styles.allocButton, { borderColor: color }]}
                    onPress={() => {
                      const newAmount = Math.max(0, amount - Math.max(10, Math.floor(effectiveIncome * 0.05)));
                      updateAllocationMoney(key, newAmount);
                    }}
                  >
                    <Icon name="minus" size={14} color={color} />
                  </TouchableOpacity>
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
                  <TouchableOpacity
                    style={[styles.allocButton, { borderColor: color }]}
                    onPress={() => {
                      const newAmount = Math.min(effectiveIncome, amount + Math.max(10, Math.floor(effectiveIncome * 0.05)));
                      updateAllocationMoney(key, newAmount);
                    }}
                  >
                    <Icon name="plus" size={14} color={color} />
                  </TouchableOpacity>
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
          <View style={styles.moveModalCard}>
            <View style={styles.moveModalHeader}>
              <Text style={styles.moveModalTitle}>Move Money Between Jars</Text>
              <TouchableOpacity onPress={() => setMoveJarModal(null)}>
                <Icon name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            {moveJarModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.moveFromCard}>
                  <Text style={styles.moveSectionLabel}>From</Text>
                  <View style={styles.moveJarDisplay}>
                    <View style={[styles.moveJarIcon, { backgroundColor: `${jarMetaMap[moveJarModal.from]?.color}20` }]}>
                      <Icon name={jarMetaMap[moveJarModal.from]?.icon as any} size={24} color={jarMetaMap[moveJarModal.from]?.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.moveJarName}>{jarMetaMap[moveJarModal.from]?.label}</Text>
                      <Text style={styles.moveJarBalance}>
                        Available: ₹{(state.balances[moveJarModal.from] || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.moveArrowContainer}>
                  <Icon name="arrow-down" size={24} color="#007AFF" />
                </View>

                <View style={styles.moveToCard}>
                  <Text style={styles.moveSectionLabel}>To</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moveJarSelector}>
                    {combinedJars
                      .filter(jar => jar.key !== moveJarModal.from)
                      .map(({ key, label, color, icon }) => {
                        const isSelected = moveJarModal.to === key;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={[
                              styles.moveJarOption,
                              isSelected && { borderColor: color, backgroundColor: `${color}15`, borderWidth: 2 },
                            ]}
                            onPress={() => setMoveJarModal({ ...moveJarModal, to: key })}
                          >
                            <View style={[styles.moveJarOptionIcon, { backgroundColor: `${color}20` }]}>
                              <Icon name={icon as any} size={24} color={isSelected ? color : '#8e8e93'} />
                            </View>
                            <Text style={[styles.moveJarOptionLabel, isSelected && { color, fontWeight: '700' }]}>{label}</Text>
                            <Text style={[styles.moveJarOptionBalance, isSelected && { color }]}>
                              ₹{(state.balances[key] || 0).toLocaleString('en-IN')}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                  </ScrollView>
                </View>

                <View style={styles.moveAmountCard}>
                  <Text style={styles.moveSectionLabel}>Amount</Text>
                  <View style={styles.moveAmountInputContainer}>
                    <Text style={styles.moveCurrencySymbol}>₹</Text>
                    <TextInput
                      value={moveAmount}
                      onChangeText={setMoveAmount}
                      placeholder="0"
                      keyboardType="numeric"
                      style={styles.moveAmountInput}
                      placeholderTextColor="#8e8e93"
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => {
                        const avail = state.balances[moveJarModal.from] || 0;
                        setMoveAmount(String(Math.max(0, Math.floor(avail))));
                      }}
                      style={styles.moveMaxButton}
                    >
                      <Text style={styles.moveMaxButtonText}>Max</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.moveModalButtonRow}>
                  <TouchableOpacity style={styles.moveCancelButton} onPress={() => setMoveJarModal(null)}>
                    <Text style={styles.moveCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.moveConfirmButton,
                      (!moveJarModal.to || !moveAmount || moveJarModal.from === moveJarModal.to) && styles.moveConfirmButtonDisabled,
                    ]}
                    onPress={handleMoveBetweenJars}
                    disabled={!moveJarModal.to || !moveAmount || moveJarModal.from === moveJarModal.to}
                  >
                    <Icon name="arrow-right" size={18} color="white" />
                    <Text style={styles.moveConfirmButtonText}>Move Money</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryMetaRow: {
    marginTop: 8,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incomeEditContainer: {
    marginTop: 8,
  },
  incomeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  incomeEditInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  incomeEditSave: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 8,
  },
  incomeEditCancel: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
  },
  allocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  allocHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  resetAllocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  resetAllocText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
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
    marginBottom: 20,
  },
  allocItem: {
    width: '100%',
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
    marginBottom: 12,
    gap: 8,
  },
  allocIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocItemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c1e',
    flex: 1,
  },
  allocItemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  allocSliderContainer: {
    marginVertical: 12,
  },
  allocSliderTrack: {
    position: 'relative',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'visible',
  },
  allocSliderFill: {
    height: '100%',
    borderRadius: 5,
  },
  allocSliderThumb: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  allocSliderThumbActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    transform: [{ translateX: -12 }],
  },
  allocInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  allocButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  allocSliderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sliderValueContainer: {
    minWidth: 50,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  allocInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    height: 40,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1c1c1e',
    marginRight: 6,
  },
  allocInputMoney: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 0,
    paddingHorizontal: 8,
    borderWidth: 0,
    textAlign: 'left',
    backgroundColor: 'transparent',
    color: '#1c1c1e',
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
    width: 180,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  jarCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jarCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  jarCardTitle: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 13,
    flex: 1,
  },
  jarCardDescription: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  jarReadyBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e6f8ec',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jarReadyBadge: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  jarAmountSection: {
    marginVertical: 8,
  },
  jarCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  jarTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  jarCardTarget: {
    fontSize: 12,
    color: '#4b5563',
  },
  jarProgressText: {
    fontSize: 13,
    fontWeight: '700',
  },
  jarProgressBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    marginTop: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  jarProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  jarCardActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  jarMoveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 8,
  },
  jarMoveButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  jarTargetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  jarTargetButtonText: {
    fontSize: 11,
    fontWeight: '700',
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
  // Move Money Modal Styles
  moveModalCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: 'white',
    borderRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  moveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  moveModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  moveFromCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 12,
  },
  moveSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c6c70',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moveJarDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moveJarIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveJarName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  moveJarBalance: {
    fontSize: 14,
    color: '#6c6c70',
  },
  moveArrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  moveToCard: {
    padding: 20,
    paddingTop: 0,
  },
  moveJarSelector: {
    marginTop: 8,
  },
  moveJarOption: {
    width: 120,
    borderWidth: 2,
    borderColor: '#e5e5ea',
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  moveJarOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moveJarOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 4,
    textAlign: 'center',
  },
  moveJarOptionBalance: {
    fontSize: 12,
    color: '#6c6c70',
    fontWeight: '600',
  },
  moveAmountCard: {
    padding: 20,
    paddingTop: 0,
  },
  moveAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    marginTop: 8,
  },
  moveCurrencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
    marginRight: 10,
  },
  moveAmountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    paddingVertical: 16,
    color: '#1c1c1e',
  },
  moveMaxButton: {
    marginLeft: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  moveMaxButtonText: {
    color: '#007AFF',
    fontWeight: '700',
    fontSize: 13,
  },
  moveModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  moveCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  moveCancelButtonText: {
    color: '#6c6c70',
    fontWeight: '700',
    fontSize: 16,
  },
  moveConfirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  moveConfirmButtonDisabled: {
    backgroundColor: '#c7c7cc',
    opacity: 0.6,
  },
  moveConfirmButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});


