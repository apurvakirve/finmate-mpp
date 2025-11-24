import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
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
import { AgenticPiggyBankCoach } from '../../lib/AgenticPiggyBankCoach';
import { AIInsight } from '../../types/agenticCoach';

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
  jarSpending?: Record<EnvelopeKey, number>; // Today's spending from each jar
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
  spiritAnimal?: { type: string; profile: any } | null;
  demoMode?: 'off' | '1w' | '1m' | '1y';
  demoData?: any;
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
  spiritAnimal = null,
  demoMode = 'off',
  demoData = null,
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
  const [activeTab, setActiveTab] = useState<'allocate' | 'jars'>('allocate');

  // AI Coach State
  const [aiCoach] = useState(() => new AgenticPiggyBankCoach(String(userId)));
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiOptimized, setAiOptimized] = useState(true); // Default to enabled
  const [overspendingAlerts, setOverspendingAlerts] = useState<AIInsight[]>([]);

  // Set spirit animal in AI coach
  useEffect(() => {
    if (spiritAnimal?.type) {
      aiCoach.setSpiritAnimal(spiritAnimal.type as any);
    }
  }, [spiritAnimal, aiCoach]);

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

  // Today's profit = income - expenses (this is what we allocate)
  const effectiveIncome = useMemo(() => {
    // User can edit income, otherwise use calculated from transactions
    if (state.editedIncome !== undefined && state.editedIncome > 0) {
      return state.editedIncome;
    }
    // Use net income (profit) - this is income minus expenses
    if (todayNetIncome > 0) return todayNetIncome;
    if (todayIncome > 0) return todayIncome;
    return 0; // Don't show default if no transactions today
  }, [todayIncome, todayNetIncome, state.editedIncome]);

  // Calculate today's expenses from transactions
  const todayExpenses = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const start = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
    const end = new Date(yyyy, mm, dd, 23, 59, 59).getTime();

    return transactions
      .filter((t) => {
        const created = new Date(t.created_at).getTime();
        return created >= start && created <= end && t.transaction_type === 'debit';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  // Calculate upcoming bills (needs-fixed jars with targets)
  const upcomingBills = useMemo(() => {
    return combinedJars
      .filter((jar) => jar.bucket === 'needs-fixed')
      .reduce((sum, jar) => {
        const target = state.jarTargets?.[jar.key] || jar.defaultTarget || 0;
        return sum + target;
      }, 0);
  }, [combinedJars, state.jarTargets]);

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

    // Get base priorities (default based on jar type, or user-set)
    const basePriorities = combinedJars.reduce((acc, jar) => {
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

    // Create jar buckets map
    const jarBuckets = combinedJars.reduce((acc, jar) => {
      acc[jar.key] = jar.bucket;
      return acc;
    }, {} as Record<EnvelopeKey, string>);

    // Apply AI adjustments if AI optimization is enabled
    const priorities = aiOptimized
      ? aiCoach.getAdjustedPriorities(
        basePriorities,
        state.jarTargets || {},
        state.balances,
        jarBuckets
      )
      : basePriorities;

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
  }, [combinedJars, effectiveIncome, state.jarPriorities, aiOptimized, aiCoach, state.jarTargets, state.balances]);

  // Check for overspending and generate alerts
  useEffect(() => {
    if (!state.jarSpending) return;

    const alerts: AIInsight[] = [];
    Object.entries(state.jarSpending).forEach(([jarKey, spent]) => {
      const balance = state.balances[jarKey] || 0;
      if (spent > balance) {
        const jar = combinedJars.find((j) => j.key === jarKey);
        if (jar) {
          const alert = aiCoach.checkOverspending(
            jarKey,
            jar.label,
            balance,
            spent,
            upcomingBills
          );
          if (alert) alerts.push(alert);
        }
      }
    });
    setOverspendingAlerts(alerts);
  }, [state.jarSpending, state.balances, combinedJars, aiCoach, upcomingBills]);

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
      if (demoMode && demoMode !== 'off' && demoData) {
        // Use Demo Data
        const demoState = {
          ...defaultState,
          balances: demoData.balances,
          jarTargets: demoData.jarTargets,
          readyInvestments: demoData.readyInvestments || [],
        };
        setState(hydrateState(demoState));
        return;
      }

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
  }, [key, userId, demoMode, demoData]);

  // Initialize AI Coach and generate insights
  useEffect(() => {
    aiCoach.initialize().catch(console.error);

    // Generate insights when income or balances change
    if (effectiveIncome > 0) {
      const context = {
        currentBalances: state.balances,
        jarTargets: state.jarTargets || {},
        jarPriorities: state.jarPriorities || {},
        dailyIncome: effectiveIncome,
        goals: combinedJars.map(jar => ({
          jarKey: jar.key,
          jarLabel: jar.label,
          target: (state.jarTargets?.[jar.key] || jar.defaultTarget || 0),
          current: state.balances[jar.key] || 0,
          priority: (state.jarPriorities?.[jar.key] || 5),
          deadline: undefined,
        })),
        historicalAllocations: [],
        userPreferences: aiCoach.getLearningProfile(),
      };
      aiCoach.generateInsights(context, allocationsMoney).then(setAiInsights).catch(console.error);
    }
  }, [aiCoach, effectiveIncome, state.balances, state.jarTargets, combinedJars, allocationsMoney]);

  // Auto-fill jars based on bill dates and investment dates
  useEffect(() => {
    const checkAndAutoFill = async () => {
      const today = new Date();
      const currentDay = today.getDate();
      let hasChanges = false;
      const next = { ...state };

      // Check if it's investment day
      if (state.scheduledInvestmentDay && currentDay === state.scheduledInvestmentDay) {
        const lastPull = state.lastInvestmentPull;
        const lastPullDate = lastPull ? new Date(lastPull.at).getDate() : null;

        if (lastPullDate !== currentDay) {
          // Mark ready investment jars
          combinedJars
            .filter(jar => jar.bucket === 'invest' || jar.bucket === 'savings')
            .forEach(jar => {
              const target = state.jarTargets?.[jar.key] || jar.defaultTarget || 0;
              const current = state.balances[jar.key] || 0;
              if (target > 0 && current >= target * 0.9) {
                if (!next.readyInvestments) next.readyInvestments = [];
                const existing = next.readyInvestments.find(r => r.id === jar.key);
                if (!existing) {
                  next.readyInvestments.push({
                    id: jar.key,
                    label: jar.label,
                    targetAmount: target,
                    currentAmount: current,
                    bucket: jar.bucket,
                    achievedAt: new Date().toISOString(),
                  });
                  hasChanges = true;
                }
              }
            });

          next.lastInvestmentPull = {
            amount: Object.values(state.balances).reduce((sum, v) => sum + v, 0),
            at: new Date().toISOString(),
          };
          hasChanges = true;
        }
      }

      // Check if it's EMI/bill day - auto-allocate to fixed needs
      if (state.emiPayDay && currentDay === state.emiPayDay) {
        combinedJars
          .filter(jar => jar.bucket === 'needs-fixed')
          .forEach(jar => {
            const target = state.jarTargets?.[jar.key] || jar.defaultTarget || 0;
            if (target > 0) {
              const current = state.balances[jar.key] || 0;
              const needed = target - current;
              if (needed > 0 && effectiveIncome > 0) {
                const allocation = Math.min(needed, effectiveIncome * 0.3);
                next.balances = { ...next.balances };
                next.balances[jar.key] = (next.balances[jar.key] || 0) + allocation;
                hasChanges = true;
              }
            }
          });
      }

      if (hasChanges) {
        await persist(next);
      }
    };

    if (effectiveIncome > 0 && (state.scheduledInvestmentDay || state.emiPayDay)) {
      checkAndAutoFill();
    }
  }, [state.scheduledInvestmentDay, state.emiPayDay, effectiveIncome, combinedJars, state.balances, state.jarTargets, state]);

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

    // Ensure total never exceeds effectiveIncome
    const currentTotal = Object.values(newAllocations).reduce((sum, v) => sum + v, 0);
    if (currentTotal > effectiveIncome) {
      // Scale down proportionally, but keep the changed jar at its requested amount if possible
      const otherTotal = currentTotal - clampedAmount;
      const maxOtherTotal = effectiveIncome - clampedAmount;
      if (maxOtherTotal < 0) {
        // Requested amount exceeds total, clamp it
        newAllocations[jarKey] = effectiveIncome;
        // Set all others to 0
        Object.keys(newAllocations).forEach(key => {
          if (key !== jarKey) newAllocations[key] = 0;
        });
      } else if (otherTotal > maxOtherTotal) {
        // Need to reduce others
        const scale = maxOtherTotal / otherTotal;
        Object.keys(newAllocations).forEach(key => {
          if (key !== jarKey) {
            newAllocations[key] = Math.floor(newAllocations[key] * scale);
          }
        });
      }
    }

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
      // Distribute any remainder
      const newTotal = Object.values(newAllocations).reduce((sum, v) => sum + v, 0);
      const remainder = effectiveIncome - newTotal;
      if (remainder > 0) {
        // Add remainder to highest priority jar
        const sorted = combinedJars
          .map(j => ({ jar: j, priority: state.jarPriorities?.[j.key] || 5 }))
          .sort((a, b) => b.priority - a.priority);
        if (sorted.length > 0) {
          newAllocations[sorted[0].jar.key] = (newAllocations[sorted[0].jar.key] || 0) + remainder;
        }
      }
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

  const toggleAIOptimization = () => {
    setAiOptimized(!aiOptimized);
  };

  const confirmAllocation = async () => {
    if (!pendingAllocations) return;
    const next = { ...state, balances: { ...state.balances } };
    combinedJars.forEach(({ key }) => {
      next.balances[key] = (next.balances[key] || 0) + (pendingAllocations[key] || 0);
    });
    await persist(next);

    // Learn from user's allocation decision
    if (aiOptimized) {
      await aiCoach.learnFromAllocation(
        pendingAllocations,
        effectiveIncome,
        state.jarTargets || {},
        state.balances
      );
      // Regenerate insights with new allocations
      const context = {
        currentBalances: next.balances,
        jarTargets: state.jarTargets || {},
        jarPriorities: state.jarPriorities || {},
        dailyIncome: effectiveIncome,
        goals: combinedJars.map(jar => ({
          jarKey: jar.key,
          jarLabel: jar.label,
          target: (state.jarTargets?.[jar.key] || jar.defaultTarget || 0),
          current: next.balances[jar.key] || 0,
          priority: (state.jarPriorities?.[jar.key] || 5),
          deadline: undefined,
        })),
        historicalAllocations: [],
        userPreferences: aiCoach.getLearningProfile(),
      };
      aiCoach.generateInsights(context, pendingAllocations).then(setAiInsights).catch(console.error);
    }

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
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={styles.jarCardAmount}>₹{balance.toLocaleString('en-IN')}</Text>
            {targetAmount > 0 && (
              <Text style={{ fontSize: 16, color: '#9CA3AF', fontWeight: '600' }}>
                / ₹{targetAmount.toLocaleString('en-IN')}
              </Text>
            )}
          </View>
          {targetAmount > 0 && (
            <View style={styles.jarTargetRow}>
              <Text style={styles.jarCardTarget}>
                Target Goal
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
    <View style={styles.wrapper}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'allocate' && styles.tabActive]}
          onPress={() => setActiveTab('allocate')}
        >
          <Icon name="zap" size={18} color={activeTab === 'allocate' ? '#007AFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'allocate' && styles.tabTextActive]}>
            Allocate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'jars' && styles.tabActive]}
          onPress={() => setActiveTab('jars')}
        >
          <Icon name="layers" size={18} color={activeTab === 'jars' ? '#007AFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'jars' && styles.tabTextActive]}>
            Jars
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'allocate' && (
          <>
            {effectiveIncome > 0 && (
              <LinearGradient
                colors={['#0052CC', '#0033A0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryCard}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.summaryHeaderRow}>
                    <Text style={styles.summaryLabel}>Profit to allocate today</Text>
                    <TouchableOpacity onPress={() => {
                      setEditingIncome(true);
                      setTempIncome(String(effectiveIncome));
                    }}>
                      <Icon name="edit-2" size={16} color="rgba(255,255,255,0.8)" />
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
                            <Icon name="arrow-down" size={14} color="#4ADE80" />
                            <Text style={[styles.summaryMeta, { color: '#4ADE80', marginLeft: 4 }]}>₹{todayIncome.toFixed(0)} income</Text>
                          </View>
                          {todayExpenses > 0 && (
                            <View style={styles.metaItem}>
                              <Icon name="arrow-up" size={14} color="#F87171" />
                              <Text style={[styles.summaryMeta, { color: '#F87171', marginLeft: 4 }]}>₹{todayExpenses.toFixed(0)} expenses</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </View>
              </LinearGradient>
            )}

            {effectiveIncome > 0 && (
              <View style={styles.incomeCard}>
                <View style={styles.allocHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.allocTitleRow}>
                      <Icon name="zap" size={20} color="#007AFF" />
                      <Text style={styles.sectionTitle}>Allocation Plan</Text>
                      {aiOptimized && (
                        <View style={styles.aiBadge}>
                          <Icon name="zap" size={12} color="#007AFF" />
                          <Text style={styles.aiBadgeText}>AI Optimized</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.allocDescription}>
                      {aiOptimized
                        ? 'AI has optimized priorities based on your goals. Adjust amounts using +/- buttons, slider, or enter directly.'
                        : 'Allocation based on priority. Adjust amounts using +/- buttons, slider, or enter directly.'}
                    </Text>
                  </View>
                  <View style={styles.allocHeaderActions}>
                    <TouchableOpacity
                      style={[styles.aiToggleButton, aiOptimized && styles.aiToggleButtonActive]}
                      onPress={toggleAIOptimization}
                    >
                      <Icon name="zap" size={14} color={aiOptimized ? "#FFFFFF" : "#007AFF"} />
                      <Text style={[styles.aiToggleText, aiOptimized && styles.aiToggleTextActive]}>
                        AI
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resetAllocButton}
                      onPress={() => {
                        // Reset to default allocation
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
                </View>

                {/* Overspending Alerts */}
                {overspendingAlerts.length > 0 && (
                  <View style={styles.overspendingContainer}>
                    {overspendingAlerts.map((alert, index) => (
                      <View key={index} style={styles.overspendingCard}>
                        <Icon name="alert-triangle" size={18} color="#FF3B30" />
                        <View style={styles.overspendingContent}>
                          <Text style={styles.overspendingTitle}>{alert.title}</Text>
                          <Text style={styles.overspendingMessage}>{alert.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <View style={styles.aiInsightsContainer}>
                    {aiInsights.map((insight, index) => (
                      <View key={index} style={[styles.aiInsightCard, insight.priority === 'high' && styles.aiInsightCardHigh]}>
                        <Icon
                          name={
                            insight.type === 'warning'
                              ? 'alert-triangle'
                              : insight.type === 'kudos'
                                ? 'check-circle'
                                : insight.type === 'action'
                                  ? 'zap'
                                  : 'info'
                          }
                          size={14}
                          color={
                            insight.type === 'warning'
                              ? '#FF9500'
                              : insight.type === 'kudos'
                                ? '#34C759'
                                : insight.type === 'action'
                                  ? '#007AFF'
                                  : '#6B7280'
                          }
                        />
                        <View style={styles.aiInsightContent}>
                          <Text style={styles.aiInsightTitle}>{insight.title}</Text>
                          <Text style={styles.aiInsightText}>{insight.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

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
          </>
        )}

        {activeTab === 'jars' && (
          <>
            {/* Compact Summary */}
            {effectiveIncome > 0 && (
              <View style={styles.compactSummaryCard}>
                <View style={styles.compactSummaryLeft}>
                  <Text style={styles.compactSummaryLabel}>Today's Profit</Text>
                  <Text style={styles.compactSummaryValue}>₹{effectiveIncome.toLocaleString('en-IN')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.compactEditButton}
                  onPress={() => {
                    setEditingIncome(true);
                    setTempIncome(String(effectiveIncome));
                  }}
                >
                  <Icon name="edit-2" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Jars Grid */}
            <View style={styles.jarsGridContainer}>
              {bucketOrder.map(bucket => {
                const section = bucketSections[bucket];
                if (!section || section.jars.length === 0) return null;
                const meta = BUCKET_COPY[bucket];
                return (
                  <View key={bucket} style={styles.bucketGridSection}>
                    <View style={styles.bucketGridHeader}>
                      <View>
                        <Text style={styles.bucketGridTitle}>{meta.title}</Text>
                        <Text style={styles.bucketGridSubtitle}>₹{section.saved.toLocaleString('en-IN')} saved</Text>
                      </View>
                      <TouchableOpacity style={styles.addJarButtonSmall} onPress={() => openAddJar(bucket)}>
                        <Icon name="plus" size={14} color="#007AFF" />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.jarsGrid}>
                      {section.jars.map(jar => {
                        const balance = state.balances[jar.key] || 0;
                        const targetAmount = state.jarTargets?.[jar.key] ?? jar.defaultTarget ?? 0;
                        const progress = targetAmount > 0 ? Math.min(100, (balance / targetAmount) * 100) : 0;
                        const isReady = readyJarSet.has(jar.key);
                        return (
                          <TouchableOpacity
                            key={jar.key}
                            style={[styles.jarGridCard, { borderLeftColor: jar.color }]}
                            onPress={() => {
                              if (balance > 0) {
                                setMoveJarModal({ from: jar.key, to: null });
                              } else {
                                startEditTarget(jar);
                              }
                            }}
                          >
                            <View style={styles.jarGridHeader}>
                              <View style={[styles.jarGridIcon, { backgroundColor: `${jar.color}15` }]}>
                                <Icon name={jar.icon as any} size={18} color={jar.color} />
                              </View>
                              {isReady && (
                                <View style={styles.jarGridBadge}>
                                  <Icon name="check" size={10} color="#34C759" />
                                </View>
                              )}
                            </View>
                            <Text style={styles.jarGridLabel} numberOfLines={1}>{jar.label}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                              <Text style={styles.jarGridAmount}>₹{balance.toLocaleString('en-IN')}</Text>
                              {targetAmount > 0 && (
                                <Text style={{ fontSize: 11, color: '#9CA3AF', fontWeight: '600' }}>
                                  / ₹{targetAmount.toLocaleString('en-IN')}
                                </Text>
                              )}
                            </View>
                            {targetAmount > 0 && (
                              <View style={styles.jarGridProgress}>
                                <View style={[styles.jarGridProgressBar, { width: `${progress}%`, backgroundColor: jar.color }]} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Layout wrappers
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EEF8',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#F0F9FF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  scrollContent: {
    flex: 1,
    padding: 12,
  },

  // --- Summary / top card
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  compactSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compactSummaryLeft: {
    flex: 1,
  },
  compactSummaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  compactSummaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  compactEditButton: {
    padding: 8,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  summaryMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryMeta: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // --- Income edit
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
    borderColor: '#E6EEF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  incomeEditSave: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 8,
  },
  incomeEditCancel: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 8,
  },

  // --- Allocation / income card
  incomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  allocHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  allocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  allocDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 12,
  },
  resetAllocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#FBFDFF',
  },
  resetAllocText: {
    color: '#0F62FE',
    fontSize: 13,
    fontWeight: '700',
  },

  // --- Alloc summary
  allocSummaryBox: {
    backgroundColor: '#FBFDFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8EFFD',
  },
  allocSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  allocSummaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  allocSummaryText: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 15,
  },
  allocHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },

  // --- Alloc grid & items
  allocGrid: {
    marginBottom: 8,
  },
  allocItem: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E6EEF8',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  allocItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  allocIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocItemLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  allocItemAmount: {
    fontSize: 18,
    fontWeight: '800',
  },

  // --- Slider (cleaner)
  allocSliderContainer: {
    marginVertical: 10,
  },
  allocSliderTrack: {
    position: 'relative',
    height: 8,
    backgroundColor: '#EEF2F7',
    borderRadius: 8,
    overflow: 'visible',
  },
  allocSliderFill: {
    height: '100%',
    borderRadius: 8,
  },
  allocSliderThumb: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#0F172A',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  allocSliderThumbActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    transform: [{ translateX: -13 }],
  },

  // --- Input row / controls
  allocInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  allocButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  allocInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E6EEF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    height: 48,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  allocInputMoney: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
    paddingHorizontal: 6,
    borderWidth: 0,
    textAlign: 'left',
    backgroundColor: 'transparent',
    color: '#0F172A',
  },

  // --- Buttons
  primaryButton: {
    backgroundColor: '#0F62FE',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkButtonText: {
    color: '#0F62FE',
    fontWeight: '700',
  },

  // --- Pending allocation card
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pendingTitle: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 16,
    marginBottom: 12,
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
    borderBottomColor: '#F1F5F9',
  },
  pendingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  pendingLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  pendingValue: {
    fontWeight: '800',
    fontSize: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  scheduleTitle: {
    fontWeight: '700',
    color: '#0F172A',
  },
  scheduleSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
  jarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  jarsGridContainer: {
    paddingBottom: 20,
  },
  bucketGridSection: {
    marginBottom: 20,
  },
  bucketGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bucketGridTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  bucketGridSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  addJarButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  jarGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jarGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jarGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarGridBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jarGridLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  jarGridAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  jarGridProgress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EEF2F7',
    overflow: 'hidden',
  },
  jarGridProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  jarSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jarSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  jarSectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addJarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    gap: 6,
    backgroundColor: '#FBFDFF',
  },
  addJarButtonText: {
    color: '#0F62FE',
    fontWeight: '700',
    fontSize: 13,
  },
  bucketSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bucketAmount: {
    fontWeight: '800',
    color: '#0F172A',
  },
  bucketBalance: {
    color: '#6B7280',
  },
  jarCardsScroll: {
    marginTop: 8,
  },
  jarCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  jarCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jarCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 13,
    flex: 1,
  },
  jarCardDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  jarReadyBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  jarReadyBadge: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '800',
  },
  jarAmountSection: {
    marginVertical: 8,
  },
  jarCardAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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
    color: '#6B7280',
  },
  jarProgressText: {
    fontSize: 13,
    fontWeight: '800',
  },
  jarProgressBackground: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2F7',
    marginTop: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  jarProgressFill: {
    height: '100%',
    borderRadius: 8,
  },
  jarCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  jarMoveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0F62FE',
    paddingVertical: 8,
    borderRadius: 10,
  },
  jarMoveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  jarTargetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FBFDFF',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  jarTargetButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // --- Ready investments card
  readyInvestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8EFFD',
  },
  readyInvestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  readyInvestTitle: {
    fontWeight: '800',
    color: '#0F172A',
    fontSize: 14,
  },
  readyInvestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  readyInvestLabel: {
    color: '#374151',
    fontWeight: '700',
  },
  readyInvestAmount: {
    color: '#0F172A',
    fontWeight: '800',
  },
  readyInvestHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },

  // --- Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 760,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: '#0F172A',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#EEF2F7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalBucketRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bucketChip: {
    borderWidth: 1,
    borderColor: '#E6EEF8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FBFDFF',
  },
  bucketChipText: {
    fontSize: 12,
    color: '#374151',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalSecondaryText: {
    color: '#6B7280',
    fontWeight: '700',
  },
  modalPrimaryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0F62FE',
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // --- Calendar modal
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    maxWidth: 520,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarWeekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 6,
    color: '#6B7280',
  },
  calendarBlank: {
    width: `${100 / 7}%`,
    height: 36,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  calendarDayActive: {
    backgroundColor: '#0F62FE',
  },
  calendarDayText: {
    color: '#0F172A',
  },
  calendarDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // --- Move modal specifics
  moveModalCard: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    maxHeight: '84%',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  moveModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  moveModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  moveFromCard: {
    backgroundColor: '#FBFDFF',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    marginBottom: 12,
  },
  moveSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveJarName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  moveJarBalance: {
    fontSize: 13,
    color: '#6B7280',
  },
  moveArrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  moveToCard: {
    padding: 16,
    paddingTop: 6,
  },
  moveJarSelector: {
    marginTop: 8,
  },
  moveJarOption: {
    width: 120,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    backgroundColor: '#FBFDFF',
  },
  moveJarOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  moveJarOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  moveJarOptionBalance: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  moveAmountCard: {
    padding: 16,
    paddingTop: 6,
  },
  moveAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E6EEF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  moveCurrencySymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  moveAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 12,
    color: '#0F172A',
  },
  moveMaxButton: {
    marginLeft: 10,
    backgroundColor: '#EEF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moveMaxButtonText: {
    color: '#0F62FE',
    fontWeight: '800',
  },
  moveModalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  moveCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    backgroundColor: '#FBFDFF',
  },
  moveCancelButtonText: {
    color: '#6B7280',
    fontWeight: '800',
    fontSize: 15,
  },
  moveConfirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F62FE',
  },
  moveConfirmButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.6,
  },
  moveConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },

  // --- Callout / misc
  sectionCalloutBox: {
    backgroundColor: '#F1FAFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionCallout: {
    color: '#0F62FE',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionCalloutSecondary: {
    color: '#0F62FE',
    fontSize: 13,
    marginTop: 6,
    fontWeight: '700',
  },
  emptyJarText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 8,
  },

  // --- small utilities (kept for references)
  jarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jarContainer: { width: '48%' },
  jarBody: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  jarContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    padding: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // --- Transfer card
  transferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E6EEF8',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    paddingVertical: 12,
    color: '#0F172A',
  },
  maxButton: {
    marginLeft: 8,
    backgroundColor: '#EEF6FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  maxButtonText: {
    color: '#0F62FE',
    fontWeight: '800',
    fontSize: 13,
  },
  availableText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'right',
  },

  // --- small shared tokens
  currencySymbolSmall: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },

  // --- AI Coach styles
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginLeft: 8,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  allocHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  aiToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6EEF8',
    backgroundColor: '#FBFDFF',
    gap: 4,
  },
  aiToggleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  aiToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  aiToggleTextActive: {
    color: '#FFFFFF',
  },
  aiInsightsContainer: {
    marginBottom: 12,
    gap: 8,
  },
  aiInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  aiInsightContent: {
    flex: 1,
  },
  aiInsightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  aiInsightText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  aiInsightCardHigh: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  overspendingContainer: {
    marginBottom: 12,
  },
  overspendingCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
    marginBottom: 8,
    gap: 12,
  },
  overspendingContent: {
    flex: 1,
  },
  overspendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF3B30',
    marginBottom: 4,
  },
  overspendingMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
