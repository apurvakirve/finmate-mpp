import { Feather as Icon } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AppHeader from '../../components/AppHeader';
import CompactAnomalyAlert from '../../components/CompactAnomalyAlert';
import CompactPredictionCard from '../../components/CompactPredictionCard';
import DailyInsightCard from '../../components/DailyInsightCard';
import FinancialOverviewCard from '../../components/FinancialOverviewCard';
import MetricCard from '../../components/MetricCard';
import PersonalityTipCard from '../../components/PersonalityTipCard';
import SpendingSnapshot from '../../components/SpendingSnapshot';
import TabPreviewCard from '../../components/TabPreviewCard';
import { AIStudioTheme } from '../../constants/aiStudioTheme';
import { getSpiritAnimalProfile } from '../../constants/spiritAnimals';
import { AIFinancialAnalyzer } from '../../lib/aiFinancialAnalyzer';
import { getLanguage, Language, setLanguage, t } from '../../lib/i18n';
import { generateSohamData } from '../../lib/sohamDemo';
import { supabase } from '../../lib/supabase';
import { AIInsights, FinancialContext } from '../../types/aiInsights';
import { SpiritAnimalType } from '../../types/spiritAnimal';
import InvestmentsTab from './InvestmentsTab';
import PiggyBanks from './PiggyBanks';
import { RiskLevel } from './RiskProfile';
import SignupForm from './SignupForm';
import TransactionAnalysis from './TransactionAnalysis';

// Add transaction types constant
const TRANSACTION_TYPES = [
  { value: 'food', label: '🍕 Food & Dining', icon: 'coffee' },
  { value: 'transportation', label: '🚗 Transportation', icon: 'car' },
  { value: 'shopping', label: '🛍️ Shopping', icon: 'shopping-bag' },
  { value: 'utilities', label: '💡 Utilities', icon: 'home' },
  { value: 'entertainment', label: '🎬 Entertainment', icon: 'film' },
  { value: 'healthcare', label: '🏥 Healthcare', icon: 'heart' },
  { value: 'transfer', label: '💸 Money Transfer', icon: 'send' },
  { value: 'other', label: '📦 Other', icon: 'box' },
];

export default function MoneyTransferApp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [categoryType, setCategoryType] = useState('other');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'transfer' | 'piggy' | 'analysis' | 'investments'>('transfer');
  const [piggyRiskLevel, setPiggyRiskLevel] = useState<RiskLevel>('moderate');
  const [showTotalBalance, setShowTotalBalance] = useState(false);
  const [cashBalance, setCashBalance] = useState<number>(0);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [cashCategory, setCashCategory] = useState('other');
  const [cashAction, setCashAction] = useState<'add' | 'spend'>('spend');
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>('en');

  // Demo Mode State
  const [demoMode, setDemoMode] = useState<'off' | '1w' | '1m' | '1y'>('off');
  const [demoData, setDemoData] = useState<any>(null);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tabFadeAnim = useRef(new Animated.Value(1)).current;

  // QR Code States
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [qrRecipient, setQrRecipient] = useState<any>(null);
  const [qrAmount, setQrAmount] = useState('');
  const [qrCategory, setQrCategory] = useState('other');
  const [permission, requestPermission] = useCameraPermissions();

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Use refs to prevent infinite loops
  const currentUserRef = useRef(currentUser);
  const usersRef = useRef(users);

  // Update refs when state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
    usersRef.current = users;
  }, [currentUser, users]);

  // Load language on mount
  useEffect(() => {
    (async () => {
      const lang = await getLanguage();
      setCurrentLang(lang);
    })();
  }, []);

  // Animate tab changes
  useEffect(() => {
    tabFadeAnim.setValue(0);
    Animated.timing(tabFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  // Load data when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchUsers();
      fetchTransactions();
      loadCashBalance();
      const cleanup = setupRealtime();
      return cleanup;
    }
  }, [currentUser]);

  const setupRealtime = () => {
    // Users changes
    const userSubscription = supabase
      .channel('users')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        (payload: any) => {
          fetchUsers();

          if (currentUserRef.current && payload.new && payload.new.id === currentUserRef.current.id) {
            setCurrentUser(payload.new);
          }
        }
      )
      .subscribe();

    // Transactions changes
    const transactionSubscription = supabase
      .channel('transactions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      transactionSubscription.unsubscribe();
    };
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;

      const newUsers = data || [];
      setUsers(newUsers);

      if (currentUserRef.current) {
        const updatedCurrentUser = newUsers.find((user: any) => user.id === currentUserRef.current.id);
        if (updatedCurrentUser && updatedCurrentUser.balance !== currentUserRef.current.balance) {
          setCurrentUser(updatedCurrentUser);
        }
      }
    } catch (error) {
      console.log('Error fetching users:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`from_user_id.eq.${currentUserRef.current?.id},to_user_id.eq.${currentUserRef.current?.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.log('Error fetching transactions:', error);
    }
  };

  const loadAIInsights = async () => {
    if (!currentUser || transactions.length === 0) return;

    try {
      setLoadingInsights(true);

      // Build financial context
      const totalIncome = transactions
        .filter((t: any) => t.to_user_id === currentUser.id)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      const totalSpent = transactions
        .filter((t: any) => t.from_user_id === currentUser.id)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

      const categoryTotals: { [key: string]: number } = {};
      transactions
        .filter((t: any) => t.from_user_id === currentUser.id)
        .forEach((t: any) => {
          const cat = t.transaction_type || 'other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount || 0);
        });

      const topCategories = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const context: FinancialContext = {
        userId: currentUser.id,
        totalIncome,
        totalSpent,
        totalSaved: totalIncome - totalSpent,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0,
        incomeVolatility: 0,
        isGigWorker: false,
        incomeFrequency: 'monthly',
        safeToSpendDaily: 0,
        topCategories,
        upcomingBills: 0,
        transactionCount: transactions.length,
        spendingPattern: totalSpent > 5000 ? 'high' : totalSpent > 2000 ? 'moderate' : 'low',
        transactions: transactions.slice(0, 50),
        timeRange: 'month',
      };

      const insights = await AIFinancialAnalyzer.analyzeFinances(context);
      setAiInsights(insights);
    } catch (error) {
      console.log('Error loading AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Load AI insights when transactions change
  useEffect(() => {
    if (currentUser && transactions.length > 0) {
      loadAIInsights();
    }
  }, [transactions.length, currentUser?.id]);

  // Helper to insert rows and fallback if 'method' column doesn't exist
  const insertRowsSafe = async (rows: any[]) => {
    try {
      const { error } = await supabase.from('transactions').insert(rows);
      if (error) throw error;
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('method') || msg.toLowerCase().includes('column')) {
        const stripped = rows.map((r) => {
          const { method, ...rest } = r;
          return rest;
        });
        const { error: retryError } = await supabase.from('transactions').insert(stripped);
        if (retryError) throw retryError;
      } else {
        throw err;
      }
    }
  };

  const insertOneSafe = async (row: any) => insertRowsSafe([row]);

  const todayIncome = useMemo(() => {
    if (!currentUserRef.current) return 0;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const start = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
    const end = new Date(yyyy, mm, dd, 23, 59, 59).getTime();

    return transactions
      .filter((t) => {
        if (t.to_user_id !== currentUserRef.current?.id) return false;
        const created = new Date(t.created_at).getTime();
        return created >= start && created <= end;
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const todayNetIncome = useMemo(() => {
    if (!currentUserRef.current) return 0;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    const start = new Date(yyyy, mm, dd, 0, 0, 0).getTime();
    const end = new Date(yyyy, mm, dd, 23, 59, 59).getTime();

    let received = 0;
    let sent = 0;
    transactions.forEach((t) => {
      const created = new Date(t.created_at).getTime();
      if (created < start || created > end) return;
      if (t.to_user_id === currentUserRef.current?.id) {
        received += Number(t.amount || 0);
      }
      if (t.from_user_id === currentUserRef.current?.id) {
        sent += Number(t.amount || 0);
      }
    });
    return received - sent;
  }, [transactions]);

  // DEV-ONLY: Seed ~60 days of demo data for current user
  const seedDemoData = async () => {
    try {
      if (!currentUserRef.current) return;
      setLoading(true);
      const me = currentUserRef.current;
      const others = (usersRef.current || []).filter((u: any) => u.id !== me.id).slice(0, 3);
      if (!others.length) {
        Alert.alert('Seed', 'Need at least one other user in database.');
        return;
      }
      const categories = ['food', 'transportation', 'shopping', 'utilities', 'entertainment', 'healthcare', 'other'];
      const rows: any[] = [];
      const today = new Date();
      for (let d = 0; d < 60; d++) {
        const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);

        // Income: 0-2 receipts/day
        const incomeCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < incomeCount; i++) {
          const from = others[Math.floor(Math.random() * others.length)];
          const amount = Math.floor(200 + Math.random() * 800);
          rows.push({
            from_user_id: from.id,
            to_user_id: me.id,
            from_name: from.name,
            to_name: me.name,
            amount,
            type: 'transfer',
            method: 'qr_code',
            transaction_type: categories[Math.floor(Math.random() * categories.length)],
            created_at: new Date(day.getTime() + i * 3600_000).toISOString(),
          });
        }

        // Spending: 1-3 sends/day
        const spendCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < spendCount; i++) {
          const to = others[Math.floor(Math.random() * others.length)];
          const amount = Math.floor(50 + Math.random() * 600);
          rows.push({
            from_user_id: me.id,
            to_user_id: to.id,
            from_name: me.name,
            to_name: to.name,
            amount,
            type: 'transfer',
            method: 'qr_code',
            transaction_type: categories[Math.floor(Math.random() * categories.length)],
            created_at: new Date(day.getTime() + (i + 4) * 3600_000).toISOString(),
          });
        }

        // Cash spend ~50% days
        if (Math.random() < 0.5) {
          const amount = Math.floor(20 + Math.random() * 200);
          rows.push({
            from_user_id: me.id,
            to_user_id: me.id,
            from_name: me.name,
            to_name: 'Cash',
            amount,
            type: 'deduct',
            method: 'cash',
            transaction_type: categories[Math.floor(Math.random() * categories.length)],
            created_at: new Date(day.getTime() + 22 * 3600_000).toISOString(),
          });
        }
      }

      const chunkSize = 200;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await insertRowsSafe(chunk);
      }
      await fetchTransactions();
      Alert.alert('Seed', `Inserted ~${rows.length} demo transactions`);
    } catch (e) {
      console.log('Seed error', e);
      Alert.alert('Seed', `Failed to insert demo data: ${(e as any)?.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  // Cash wallet persistence
  const cashKey = (userId: string | number) => `mt_cash_${userId}`;
  const loadCashBalance = async () => {
    try {
      const raw = await AsyncStorage.getItem(cashKey(currentUserRef.current?.id));
      if (raw) setCashBalance(parseFloat(raw) || 0);
      else setCashBalance(0);
    } catch (e) {
      setCashBalance(0);
    }
  };
  const saveCashBalance = async (next: number) => {
    setCashBalance(next);
    await AsyncStorage.setItem(cashKey(currentUserRef.current?.id), String(next));
  };

  const handleCashSubmit = async () => {
    const amt = parseFloat(cashAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      setLoading(true);
      if (cashAction === 'add') {
        // Increase local cash only
        await saveCashBalance(cashBalance + amt);
      } else {
        // Spend from cash: decrease cash and record a transaction (method: cash)
        const nextCash = cashBalance - amt;
        if (nextCash < 0) {
          Alert.alert('Error', 'Insufficient cash');
          return;
        }
        await saveCashBalance(nextCash);
        await insertOneSafe({
          from_user_id: currentUserRef.current.id,
          to_user_id: currentUserRef.current.id,
          from_name: currentUserRef.current.name,
          to_name: 'Cash',
          amount: amt,
          type: 'deduct',
          method: 'cash',
          transaction_type: cashCategory,
        });
      }
      setShowCashModal(false);
      setCashAmount('');
      setCashCategory('other');
      setCashAction('spend');
    } catch (e) {
      Alert.alert('Error', 'Failed to update cash');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR Code Data for current user
  const generateQRData = () => {
    if (!currentUser) return '';
    const qrData = {
      type: 'money_request',
      userId: currentUser.id,
      userName: currentUser.name,
      email: currentUser.email,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData);
  };

  // Handle QR Code Scan
  const handleQRScan = ({ data }: { data: string }) => {
    setShowQRScanner(false);

    try {
      const qrData = JSON.parse(data);

      if (qrData.type === 'money_request') {
        setQrRecipient(qrData);
        setShowAmountModal(true);
      } else {
        Alert.alert('Invalid QR', 'This is not a valid money transfer QR code.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid QR code format.');
    }
  };

  // Handle QR payment with custom modal
  const handleQRPayment = async () => {
    if (!qrRecipient) return;

    const amt = parseFloat(qrAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    setLoading(true);
    setShowAmountModal(false);

    try {
      const sender = usersRef.current.find(u => u.id === currentUser.id);
      const receiver = usersRef.current.find(u => u.id === qrRecipient.userId);

      if (!sender || !receiver) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const senderBalance = parseFloat(sender.balance);
      const receiverBalance = parseFloat(receiver.balance);

      if (senderBalance < amt) {
        Alert.alert('Error', 'Insufficient balance');
        return;
      }

      // Calculate new balances
      const senderNewBalance = senderBalance - amt;
      const receiverNewBalance = receiverBalance + amt;

      // Update sender in database
      const { error: senderError } = await supabase
        .from('users')
        .update({ balance: senderNewBalance })
        .eq('id', sender.id);

      if (senderError) throw senderError;

      // Update receiver in database
      const { error: receiverError } = await supabase
        .from('users')
        .update({ balance: receiverNewBalance })
        .eq('id', receiver.id);

      if (receiverError) throw receiverError;

      // Create transaction with category
      await insertOneSafe({
        from_user_id: sender.id,
        to_user_id: receiver.id,
        from_name: sender.name,
        to_name: receiver.name,
        amount: amt,
        type: 'transfer',
        method: 'qr_code',
        transaction_type: qrCategory,
      });

      // Update current user immediately
      if (currentUser.id === sender.id) {
        setCurrentUser({ ...currentUser, balance: senderNewBalance });
      }

      Alert.alert('Success', `₹${amt} sent to ${receiver.name} via QR code!`);
      setQrAmount('');
      setQrRecipient(null);
      setQrCategory('other');

    } catch (error) {
      console.log('QR Transaction error:', error);
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim())
        .eq('password', password.trim())
        .single();

      if (error || !data) {
        Alert.alert('Error', 'Invalid email or password');
        return;
      }

      setCurrentUser(data);
      setEmail('');
      setPassword('');

      Alert.alert('Success', `Welcome ${data.name}!`);
    } catch (error) {
      Alert.alert('Error', 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (formData: any) => {
    setLoading(true);
    try {
      console.log('Starting signup with data:', {
        name: formData.name,
        email: formData.email,
        hasSpiritAnimal: !!formData.spiritAnimal,
        spiritAnimal: formData.spiritAnimal
      });

      const existing = await supabase
        .from('users')
        .select('id')
        .eq('email', formData.email.trim())
        .maybeSingle();

      if (existing.data) {
        Alert.alert('Error', 'Email already registered');
        return;
      }

      const metadata = {
        age: formData.age,
        phone: formData.phone,
        city: formData.city,
        occupation: formData.occupation,
        monthlyIncome: formData.monthlyIncome,
        maritalStatus: formData.maritalStatus || 'single',
        dependents: formData.dependents || '0',
        primaryGoal: formData.primaryGoal || 'wealth',
        investmentExperience: formData.investmentExperience || 'basic',
        spiritAnimal: formData.spiritAnimal || null,
      };

      console.log('Metadata to save:', metadata);

      // Try to insert user with metadata
      const { data, error } = await supabase
        .from('users')
        .insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role: 'user',
          balance: 0,
          metadata: JSON.stringify(metadata),
        })
        .select('*')
        .single();

      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // If metadata field doesn't exist, try without it
        if (error.message?.includes('metadata') || error.code === '42703') {
          console.log('Retrying without metadata field...');
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .insert({
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password.trim(),
              role: 'user',
              balance: 0,
            })
            .select('*')
            .single();

          if (retryError) {
            Alert.alert('Error', `Sign up failed: ${retryError.message || 'Unknown error'}`);
            return;
          }

          if (retryData) {
            console.log('Signup successful (without metadata):', retryData);
            setCurrentUser(retryData);
            setShowSignupForm(false);
            Alert.alert('Success', `Welcome ${retryData.name}!`);
            return;
          }
        }

        Alert.alert('Error', `Sign up failed: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data) {
        console.error('No data returned from signup');
        Alert.alert('Error', 'Sign up failed: No data returned');
        return;
      }

      console.log('Signup successful:', data);
      setCurrentUser(data);
      setShowSignupForm(false);
      Alert.alert('Success', `Welcome ${data.name}!`);
    } catch (error: any) {
      console.error('Signup exception:', error);
      Alert.alert('Error', `Sign up failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Please enter valid amount');
      return;
    }

    if (!selectedUser) {
      Alert.alert('Error', 'Please select a user');
      return;
    }

    setLoading(true);

    try {
      if (currentUser.role === 'bank') {
        if (!transactionType) {
          Alert.alert('Error', 'Please select Add or Deduct');
          return;
        }

        const targetUser = usersRef.current.find(u => u.id == selectedUser);
        if (!targetUser) {
          Alert.alert('Error', 'User not found');
          return;
        }

        let newBalance = parseFloat(targetUser.balance);
        if (transactionType === 'add') {
          newBalance += amt;
        } else {
          if (newBalance < amt) {
            Alert.alert('Error', 'Insufficient balance');
            return;
          }
          newBalance -= amt;
        }

        const { error } = await supabase
          .from('users')
          .update({ balance: newBalance })
          .eq('id', selectedUser);

        if (error) throw error;

        await supabase.from('transactions').insert({
          from_user_id: currentUser.id,
          to_user_id: parseInt(selectedUser),
          from_name: currentUser.name,
          to_name: targetUser.name,
          amount: amt,
          type: transactionType,
          transaction_type: categoryType,
        });

        Alert.alert('Success', `$${amt} ${transactionType}ed to ${targetUser.name}`);

      } else {
        const sender = usersRef.current.find(u => u.id === currentUser.id);
        const receiver = usersRef.current.find(u => u.id == selectedUser);

        if (!sender || !receiver) {
          Alert.alert('Error', 'User not found');
          return;
        }

        const senderBalance = parseFloat(sender.balance);
        const receiverBalance = parseFloat(receiver.balance);

        if (senderBalance < amt) {
          Alert.alert('Error', 'Insufficient balance');
          return;
        }

        const senderNewBalance = senderBalance - amt;
        const receiverNewBalance = receiverBalance + amt;

        const { error: senderError } = await supabase
          .from('users')
          .update({ balance: senderNewBalance })
          .eq('id', sender.id);

        if (senderError) throw senderError;

        const { error: receiverError } = await supabase
          .from('users')
          .update({ balance: receiverNewBalance })
          .eq('id', receiver.id);

        if (receiverError) throw receiverError;

        await supabase.from('transactions').insert({
          from_user_id: sender.id,
          to_user_id: receiver.id,
          from_name: sender.name,
          to_name: receiver.name,
          amount: amt,
          type: 'transfer',
          transaction_type: categoryType,
        });

        if (currentUser.id === sender.id) {
          setCurrentUser({ ...currentUser, balance: senderNewBalance });
        }

        Alert.alert('Success', `$${amt} sent to ${receiver.name}`);
      }

      setAmount('');
      setSelectedUser('');
      setTransactionType('');
      setCategoryType('other');

    } catch (error) {
      console.log('Transaction error:', error);
      Alert.alert('Error', 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsers([]);
    setTransactions([]);
    setActiveTab('transfer');
  };

  const selectDemo = (mode: 'off' | '1w' | '1m' | '1y') => {
    setDemoMode(mode);
    setShowDemoMenu(false);

    if (mode === 'off') {
      setDemoData(null);
      fetchTransactions(); // Restore real data
      fetchUsers(); // Restore real user
    } else {
      const data = generateSohamData(mode);
      setDemoData(data);
      // Override transactions
      setTransactions(data.transactions);
      // Override current user for display
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          name: 'Soham (Demo)',
          balance: data.balance,
          metadata: JSON.stringify({
            ...JSON.parse(currentUser.metadata || '{}'),
            spiritAnimal: 'squirrel'
          })
        });
      }
    }
  };

  // Helper to get spirit animal from user metadata
  const getUserSpiritAnimal = (user: any): { type: SpiritAnimalType; profile: any } | null => {
    try {
      if (!user?.metadata) return null;
      const metadata = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata;
      const spiritAnimalType = metadata.spiritAnimal as SpiritAnimalType;
      if (!spiritAnimalType) return null;
      return {
        type: spiritAnimalType,
        profile: getSpiritAnimalProfile(spiritAnimalType)
      };
    } catch (e) {
      return null;
    }
  };

  const refreshCurrentUser = async () => {
    if (currentUser) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setCurrentUser(data);
      }
    }
  };

  // Request camera permission for QR scanning
  const requestCameraPermission = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
  };

  // Render category selector for QR payment
  const renderQRCategorySelector = () => (
    <View style={styles.qrCategorySection}>
      <Text style={styles.qrCategoryTitle}>Select Category</Text>
      <View style={styles.qrCategoryGrid}>
        {TRANSACTION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.qrCategoryButton,
              qrCategory === type.value && styles.qrCategoryButtonActive
            ]}
            onPress={() => setQrCategory(type.value)}
          >
            <View style={[
              styles.radioCircle,
              qrCategory === type.value && styles.radioCircleActive
            ]}>
              {qrCategory === type.value && <View style={styles.radioInnerCircle} />}
            </View>
            <Icon
              name={type.icon as any}
              size={20}
              color={qrCategory === type.value ? '#007AFF' : '#666'}
            />
            <Text style={[
              styles.qrCategoryButtonText,
              qrCategory === type.value && styles.qrCategoryButtonTextActive
            ]}>
              {type.label.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render category selector for regular transfer
  const renderCategorySelector = () => (
    <View style={styles.categorySection}>
      <Text style={styles.sectionTitle}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {TRANSACTION_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.categoryButton,
              categoryType === type.value && styles.categoryButtonActive
            ]}
            onPress={() => setCategoryType(type.value)}
          >
            <Icon
              name={type.icon as any}
              size={20}
              color={categoryType === type.value ? '#007AFF' : '#666'}
            />
            <Text style={[
              styles.categoryButtonText,
              categoryType === type.value && styles.categoryButtonTextActive
            ]}>
              {type.label.split(' ')[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render transfer form for regular users
  const renderUserTransferForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Send Money</Text>

      <Text style={styles.label}>Select Recipient</Text>
      <FlatList
        data={users.filter(user => user.id !== currentUser.id)}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItem,
              selectedUser === item.id.toString() && styles.selectedItem
            ]}
            onPress={() => setSelectedUser(item.id.toString())}
          >
            <Text style={styles.userItemText}>{item.name}</Text>
            <Text style={styles.userBalance}>₹{parseFloat(item.balance).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        style={styles.flatList}
        scrollEnabled={true}
      />

      {renderCategorySelector()}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.sendButton, (!amount || !selectedUser) && styles.disabledButton]}
        onPress={handleTransaction}
        disabled={!amount || !selectedUser}
      >
        <Text style={styles.sendButtonText}>
          Send ₹{amount || '0.00'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render bank management form
  const renderBankForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Manage User Balance</Text>

      <Text style={styles.label}>Select User</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItem,
              selectedUser === item.id.toString() && styles.selectedItem
            ]}
            onPress={() => setSelectedUser(item.id.toString())}
          >
            <Text style={styles.userItemText}>{item.name}</Text>
            <Text style={styles.userBalance}>₹{parseFloat(item.balance).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        style={styles.flatList}
        scrollEnabled={true}
      />

      {renderCategorySelector()}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            transactionType === 'add' && styles.activeAdd
          ]}
          onPress={() => setTransactionType('add')}
        >
          <Text style={styles.actionButtonText}>Add Money</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            transactionType === 'deduct' && styles.activeDeduct
          ]}
          onPress={() => setTransactionType('deduct')}
        >
          <Text style={styles.actionButtonText}>Deduct Money</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.sendButton, (!amount || !selectedUser || !transactionType) && styles.disabledButton]}
        onPress={handleTransaction}
        disabled={!amount || !selectedUser || !transactionType}
      >
        <Text style={styles.sendButtonText}>
          {transactionType === 'add' ? 'Add' : 'Deduct'} ${amount || '0.00'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Loading screen
  if (loading && !currentUser) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Login/Signup screen
  if (!currentUser) {
    if (showSignupForm) {
      return (
        <SafeAreaView style={styles.container}>
          <SignupForm
            onSubmit={handleSignup}
            onCancel={() => setShowSignupForm(false)}
            loading={loading}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.loginBox, { opacity: fadeAnim }]}>
          <MaterialCommunityIcons name="currency-inr" size={18} color="#007AFF" />
          <Text style={styles.title}>{t('appName')}</Text>

          <TextInput
            placeholder={t('email')}
            placeholderTextColor={AIStudioTheme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder={t('password')}
            placeholderTextColor={AIStudioTheme.colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginText}>{t('login')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowSignupForm(true)} style={{ marginTop: 12 }}>
            <Text style={styles.toggleAuthText}>
              {t('signup')} - {t('welcome')}
            </Text>
          </TouchableOpacity>

          {/* Language Selector */}
          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>Language:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8, maxHeight: 32 }}
            >
              {(['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu'] as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langButton,
                    currentLang === lang && styles.langButtonActive,
                  ]}
                  onPress={async () => {
                    await setLanguage(lang);
                    setCurrentLang(lang);
                  }}
                >
                  <Text style={[
                    styles.langText,
                    currentLang === lang && styles.langTextActive,
                  ]}>
                    {lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo Accounts:</Text>
            <Text style={styles.demoText}>user1@example.com / user123</Text>
            <Text style={styles.demoText}>user2@example.com / user123</Text>
            <Text style={styles.demoText}>bank@example.com / bank123</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Main app screen with tabs
  return (
    <SafeAreaView style={styles.mainContainer}>
      {/* Modern Header */}
      <AppHeader
        userName={currentUser.name}
        spiritAnimal={getUserSpiritAnimal(currentUser)}
        onRefresh={refreshCurrentUser}
        onLogout={handleLogout}
      />

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: tabFadeAnim }}>
        {activeTab === 'transfer' && (
          <ScrollView
            style={styles.tabContent}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Financial Overview Card */}
            <FinancialOverviewCard
              walletBalance={parseFloat(currentUser.balance)}
              cashBalance={cashBalance}
              todayIncome={todayIncome}
              todaySpending={transactions
                .filter((t: any) => {
                  const today = new Date();
                  const tDate = new Date(t.created_at);
                  return (
                    t.from_user_id === currentUser.id &&
                    tDate.toDateString() === today.toDateString()
                  );
                })
                .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)}
              showTotal={showTotalBalance}
              onToggle={() => setShowTotalBalance(!showTotalBalance)}
              spiritAnimal={getUserSpiritAnimal(currentUser)?.type}
            />

            {/* Quick Actions - Moved to top */}
            <View style={styles.quickActionsSection}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => {
                    requestCameraPermission();
                    setShowQRScanner(true);
                  }}
                >
                  <View style={styles.actionIcon}>
                    <Icon name="camera" size={24} color={AIStudioTheme.colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>Scan QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => setShowMyQR(true)}
                >
                  <View style={styles.actionIcon}>
                    <Icon name="maximize" size={24} color={AIStudioTheme.colors.primary} />
                  </View>
                  <Text style={styles.actionLabel}>My QR</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => { setCashAction('add'); setShowCashModal(true); }}
                >
                  <View style={styles.actionIcon}>
                    <Icon name="plus-circle" size={24} color={AIStudioTheme.colors.success} />
                  </View>
                  <Text style={styles.actionLabel}>Add Cash</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => { setCashAction('spend'); setShowCashModal(true); }}
                >
                  <View style={styles.actionIcon}>
                    <Icon name="minus-circle" size={24} color={AIStudioTheme.colors.error} />
                  </View>
                  <Text style={styles.actionLabel}>Spend Cash</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Key Metrics Grid */}
            <View style={styles.metricsGrid}>
              <MetricCard
                icon="trending-up"
                iconColor="#8B5CF6"
                iconBgColor="#EDE9FE"
                label="Weekly Spending"
                value={`₹${transactions
                  .filter((t: any) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return (
                      t.from_user_id === currentUser.id &&
                      new Date(t.created_at) >= weekAgo
                    );
                  })
                  .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0)
                  .toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                trend={{
                  direction: 'down',
                  value: '12% less'
                }}
                onPress={() => setActiveTab('analysis')}
              />
              <MetricCard
                icon="shopping-bag"
                iconColor="#F59E0B"
                iconBgColor="#FEF3C7"
                label="Top Category"
                value={(() => {
                  const categoryTotals: { [key: string]: number } = {};
                  transactions
                    .filter((t: any) => t.from_user_id === currentUser.id)
                    .forEach((t: any) => {
                      const cat = t.transaction_type || 'other';
                      categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount || 0);
                    });
                  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
                  return topCat ? topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1) : 'None';
                })()}
                onPress={() => setActiveTab('analysis')}
              />
              <MetricCard
                icon="pie-chart"
                iconColor="#10B981"
                iconBgColor="#D1FAE5"
                label="Savings Rate"
                value={(() => {
                  const totalIncome = transactions
                    .filter((t: any) => t.to_user_id === currentUser.id)
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                  const totalSpent = transactions
                    .filter((t: any) => t.from_user_id === currentUser.id)
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                  const rate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome * 100) : 0;
                  return `${Math.max(0, rate).toFixed(0)}%`;
                })()}
                trend={{
                  direction: 'up',
                  value: '+5%'
                }}
                onPress={() => setActiveTab('piggy')}
              />
              <MetricCard
                icon="target"
                iconColor="#3B82F6"
                iconBgColor="#DBEAFE"
                label="Budget Status"
                value="On Track"
                onPress={() => setActiveTab('piggy')}
              />
            </View>

            {/* Phase 2: AI-Powered Insights */}
            {aiInsights && (
              <>
                {/* Spending Snapshot */}
                <SpendingSnapshot
                  last7Days={(() => {
                    const last7Days = [];
                    const today = new Date();
                    for (let i = 6; i >= 0; i--) {
                      const date = new Date(today);
                      date.setDate(date.getDate() - i);
                      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

                      const daySpending = transactions
                        .filter((t: any) => {
                          const tDate = new Date(t.created_at);
                          return (
                            t.from_user_id === currentUser.id &&
                            tDate >= dayStart &&
                            tDate <= dayEnd
                          );
                        })
                        .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

                      last7Days.push({
                        date: date.toISOString(),
                        amount: daySpending
                      });
                    }
                    return last7Days;
                  })()}
                  topCategories={(() => {
                    const categoryTotals: { [key: string]: number } = {};
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);

                    transactions
                      .filter((t: any) =>
                        t.from_user_id === currentUser.id &&
                        new Date(t.created_at) >= weekAgo
                      )
                      .forEach((t: any) => {
                        const cat = t.transaction_type || 'other';
                        categoryTotals[cat] = (categoryTotals[cat] || 0) + parseFloat(t.amount || 0);
                      });

                    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

                    return Object.entries(categoryTotals)
                      .map(([category, amount]) => ({
                        category,
                        amount,
                        percentage: total > 0 ? (amount / total) * 100 : 0
                      }))
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 3);
                  })()}
                  weekOverWeekChange={(() => {
                    const thisWeekStart = new Date();
                    thisWeekStart.setDate(thisWeekStart.getDate() - 7);
                    const lastWeekStart = new Date();
                    lastWeekStart.setDate(lastWeekStart.getDate() - 14);

                    const thisWeek = transactions
                      .filter((t: any) =>
                        t.from_user_id === currentUser.id &&
                        new Date(t.created_at) >= thisWeekStart
                      )
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

                    const lastWeek = transactions
                      .filter((t: any) => {
                        const tDate = new Date(t.created_at);
                        return (
                          t.from_user_id === currentUser.id &&
                          tDate >= lastWeekStart &&
                          tDate < thisWeekStart
                        );
                      })
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

                    return lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
                  })()}
                />

                {/* Anomaly Alerts */}
                {aiInsights.anomalies.length > 0 && (
                  <View style={styles.insightsSection}>
                    <View style={styles.insightsSectionHeader}>
                      <Text style={styles.insightsSectionTitle}>⚠️ Unusual Spending</Text>
                      <TouchableOpacity onPress={() => setActiveTab('analysis')}>
                        <Text style={styles.viewAllLink}>View All</Text>
                      </TouchableOpacity>
                    </View>
                    {aiInsights.anomalies.slice(0, 2).map((anomaly, index) => (
                      <CompactAnomalyAlert
                        key={index}
                        anomaly={anomaly}
                        onPress={() => setActiveTab('analysis')}
                      />
                    ))}
                  </View>
                )}

                {/* Smart Predictions */}
                {aiInsights.predictions.length > 0 && (
                  <View style={styles.insightsSection}>
                    <View style={styles.insightsSectionHeader}>
                      <Text style={styles.insightsSectionTitle}>🔮 Smart Predictions</Text>
                      <TouchableOpacity onPress={() => setActiveTab('analysis')}>
                        <Text style={styles.viewAllLink}>View All</Text>
                      </TouchableOpacity>
                    </View>
                    {aiInsights.predictions.slice(0, 2).map((prediction, index) => (
                      <CompactPredictionCard
                        key={index}
                        prediction={prediction}
                      />
                    ))}
                  </View>
                )}
              </>
            )}

            {/* AI Insights & Activity Cards */}
            {getUserSpiritAnimal(currentUser) && (
              <>
                {/* Daily Insight Card */}
                <DailyInsightCard
                  title="Smart Spending Tip"
                  description={`As a ${getUserSpiritAnimal(currentUser)?.profile.name}, focus on ${getUserSpiritAnimal(currentUser)?.profile.tips[0].toLowerCase()}`}
                  icon="lightbulb"
                  iconColor="#FFA000"
                  gradientColors={['#000000ff', '#000000ff']}
                />

                {/* Personality Tip */}
                <PersonalityTipCard profile={getUserSpiritAnimal(currentUser)!.profile} />
              </>
            )}

            {/* Phase 3: Tab Navigation Cards */}
            <View style={styles.tabNavigationSection}>
              <Text style={styles.tabNavigationTitle}>Explore More</Text>

              {/* Analysis Tab Preview */}
              <TabPreviewCard
                icon="bar-chart-2"
                iconColor="#8B5CF6"
                iconBgColor="#EDE9FE"
                title="Financial Analysis"
                subtitle={aiInsights
                  ? `${aiInsights.anomalies.length} anomalies, ${aiInsights.predictions.length} predictions`
                  : 'View detailed spending analysis'}
                badge={aiInsights?.anomalies.length || 0}
                onPress={() => setActiveTab('analysis')}
              />

              {/* Piggy Banks Tab Preview */}
              <TabPreviewCard
                icon="grid"
                iconColor="#10B981"
                iconBgColor="#D1FAE5"
                title="Piggy Banks"
                subtitle={(() => {
                  const savingsRate = (() => {
                    const totalIncome = transactions
                      .filter((t: any) => t.to_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    const totalSpent = transactions
                      .filter((t: any) => t.from_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    return totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome * 100) : 0;
                  })();
                  return `${savingsRate.toFixed(0)}% savings rate • Manage your jars`;
                })()}
                onPress={() => setActiveTab('piggy')}
              />

              {/* Investments Tab Preview */}
              <TabPreviewCard
                icon="pie-chart"
                iconColor="#3B82F6"
                iconBgColor="#DBEAFE"
                title="Investments"
                subtitle="AI-powered investment recommendations"
                onPress={() => setActiveTab('investments')}
              />
            </View>

            {/* Goal Progress */}
            <View style={styles.goalProgressSection}>
              <View style={styles.goalHeader}>
                <Icon name="target" size={20} color={AIStudioTheme.colors.primary} />
                <Text style={styles.goalTitle}>Monthly Savings Goal</Text>
              </View>
              <View style={styles.goalProgressBar}>
                <View style={[styles.goalProgressFill, {
                  width: `${Math.min(100, (() => {
                    const totalIncome = transactions
                      .filter((t: any) => t.to_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    const totalSpent = transactions
                      .filter((t: any) => t.from_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    const saved = totalIncome - totalSpent;
                    const goal = totalIncome * 0.2; // 20% savings goal
                    return goal > 0 ? (saved / goal) * 100 : 0;
                  })())}%`
                }]} />
              </View>
              <View style={styles.goalStats}>
                <Text style={styles.goalStat}>
                  Saved: ₹{(() => {
                    const totalIncome = transactions
                      .filter((t: any) => t.to_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    const totalSpent = transactions
                      .filter((t: any) => t.from_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    return (totalIncome - totalSpent).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                  })()}
                </Text>
                <Text style={styles.goalStat}>
                  Goal: ₹{(() => {
                    const totalIncome = transactions
                      .filter((t: any) => t.to_user_id === currentUser.id)
                      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                    return (totalIncome * 0.2).toLocaleString('en-IN', { maximumFractionDigits: 0 });
                  })()}
                </Text>
              </View>
              <Text style={styles.goalMessage}>
                {(() => {
                  const totalIncome = transactions
                    .filter((t: any) => t.to_user_id === currentUser.id)
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                  const totalSpent = transactions
                    .filter((t: any) => t.from_user_id === currentUser.id)
                    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);
                  const saved = totalIncome - totalSpent;
                  const goal = totalIncome * 0.2;
                  const progress = goal > 0 ? (saved / goal) * 100 : 0;

                  if (progress >= 100) return '🎉 Goal achieved! Great job!';
                  if (progress >= 75) return '💪 Almost there! Keep it up!';
                  if (progress >= 50) return '📈 You\'re halfway there!';
                  return '🎯 Keep saving to reach your goal!';
                })()}
              </Text>
            </View>

            {/* QR-only transfers: regular form removed */}

            {/* Recent Transactions */}
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <FlatList
              data={transactions
                .filter((t: any) => t.from_user_id === currentUser.id || t.to_user_id === currentUser.id)
                .slice(0, 10)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionNames}>
                      {item.from_name} → {item.to_name}
                    </Text>
                    <Text style={styles.transactionType}>
                      {item.transaction_type} • {new Date(item.created_at).toLocaleDateString()}
                      {item.method === 'qr_code' && ' • QR'}
                      {item.method === 'cash' && ' • Cash'}
                    </Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    {
                      color: item.type === 'add' ? 'green' :
                        item.type === 'deduct' ? 'red' :
                          item.from_user_id === currentUser.id ? 'red' : 'green'
                    }
                  ]}>
                    {item.from_user_id === currentUser.id ? '-' : '+'}₹{parseFloat(item.amount).toFixed(2)}
                  </Text>
                </View>
              )}
              style={styles.transactionList}
              scrollEnabled={false}
            />
          </ScrollView>
        )}

        {activeTab === 'piggy' && (
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.infoBanner}>
              <Icon name="sun" size={18} color="#007AFF" />
              <Text style={styles.infoBannerText}>
                Today’s recorded income: ₹{todayIncome.toFixed(0)} • Risk profile: {piggyRiskLevel.toUpperCase()}.
                Adjust jars or edit your profile below.
              </Text>
            </View>
            <PiggyBanks
              userId={currentUser.id}
              todayIncome={todayIncome}
              todayNetIncome={todayNetIncome}
              transactions={transactions}
              spiritAnimal={getUserSpiritAnimal(currentUser)}
              demoMode={demoMode}
              demoData={demoData?.piggyBanks}
            />
          </ScrollView>
        )}

        {/* Analysis Tab Content */}
        {activeTab === 'analysis' && (
          <TransactionAnalysis currentUser={currentUser} transactions={transactions} />
        )}



        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <InvestmentsTab userId={currentUser.id} />
        )}
      </Animated.View>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabContainer}>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('transfer')}
        >
          <Icon
            name="send"
            size={22}
            color={activeTab === 'transfer' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.bottomTabText, activeTab === 'transfer' && styles.bottomTabTextActive]}>Transfer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('piggy')}
        >
          <Icon
            name="grid"
            size={22}
            color={activeTab === 'piggy' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.bottomTabText, activeTab === 'piggy' && styles.bottomTabTextActive]}>Piggy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('analysis')}
        >
          <Icon
            name="bar-chart-2"
            size={22}
            color={activeTab === 'analysis' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.bottomTabText, activeTab === 'analysis' && styles.bottomTabTextActive]}>Analysis</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => setActiveTab('investments')}
        >
          <Icon
            name="pie-chart"
            size={22}
            color={activeTab === 'investments' ? '#007AFF' : '#666'}
          />
          <Text style={[styles.bottomTabText, activeTab === 'investments' && styles.bottomTabTextActive]}>Invest</Text>
        </TouchableOpacity>
      </View>

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan QR Code</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => setShowQRScanner(false)}>
                <Icon name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {permission?.granted ? (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={showQRScanner ? handleQRScan : undefined}
            >
              <View style={styles.scannerOverlay}>
                <View style={styles.scannerFrame} />
                <Text style={styles.scannerText}>Align QR code within frame</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* My QR Code Modal */}
      <Modal
        visible={showMyQR}
        animationType="slide"
        onRequestClose={() => setShowMyQR(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My QR Code</Text>
            <TouchableOpacity onPress={() => setShowMyQR(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.qrContainer}>
            <Text style={styles.qrTitle}>Scan to Pay Me</Text>
            <Text style={styles.qrSubtitle}>{currentUser.name}</Text>

            <View style={styles.qrCodeContainer}>
              <QRCode
                value={generateQRData()}
                size={250}
                backgroundColor="white"
                color="black"
              />
            </View>

            <Text style={styles.qrInstruction}>
              Ask others to scan this QR code to send you money instantly
            </Text>

            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoText}>Name: {currentUser.name}</Text>
              <Text style={styles.qrInfoText}>Email: {currentUser.email}</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Demo Menu Modal */}
      <Modal
        visible={showDemoMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDemoMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowDemoMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Select Persona View</Text>

            <TouchableOpacity style={styles.menuOption} onPress={() => selectDemo('off')}>
              <Icon name={demoMode === 'off' ? "check-circle" : "circle"} size={20} color={demoMode === 'off' ? "#007AFF" : "#666"} />
              <Text style={[styles.menuOptionText, demoMode === 'off' && styles.menuOptionTextActive]}>Normal View</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuOption} onPress={() => selectDemo('1w')}>
              <Icon name={demoMode === '1w' ? "check-circle" : "circle"} size={20} color={demoMode === '1w' ? "#007AFF" : "#666"} />
              <Text style={[styles.menuOptionText, demoMode === '1w' && styles.menuOptionTextActive]}>Soham: 1 Week</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => selectDemo('1m')}>
              <Icon name={demoMode === '1m' ? "check-circle" : "circle"} size={20} color={demoMode === '1m' ? "#007AFF" : "#666"} />
              <Text style={[styles.menuOptionText, demoMode === '1m' && styles.menuOptionTextActive]}>Soham: 1 Month</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOption} onPress={() => selectDemo('1y')}>
              <Icon name={demoMode === '1y' ? "check-circle" : "circle"} size={20} color={demoMode === '1y' ? "#007AFF" : "#666"} />
              <Text style={[styles.menuOptionText, demoMode === '1y' && styles.menuOptionTextActive]}>Soham: 1 Year</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Amount Input Modal for QR Payments */}
      <Modal
        visible={showAmountModal}
        animationType="slide"
        onRequestClose={() => setShowAmountModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Money</Text>
            <TouchableOpacity onPress={() => setShowAmountModal(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.amountModalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.amountModalRecipient}>
              Send to: {qrRecipient?.userName}
            </Text>
            <Text style={styles.amountModalEmail}>
              {qrRecipient?.email}
            </Text>

            {/* Category Selection */}
            {renderQRCategorySelector()}

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={qrAmount}
                  onChangeText={setQrAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  autoFocus
                />
              </View>
            </View>

            <View style={styles.quickAmounts}>
              <Text style={styles.quickAmountsTitle}>Quick Amounts</Text>
              <View style={styles.quickAmountButtons}>
                {[10, 20, 50, 100, 200, 500].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.quickAmountButton}
                    onPress={() => setQrAmount(amount.toString())}
                  >
                    <Text style={styles.quickAmountText}>${amount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!qrAmount || isNaN(parseFloat(qrAmount)) || parseFloat(qrAmount) <= 0) && styles.disabledButton
              ]}
              onPress={handleQRPayment}
              disabled={!qrAmount || isNaN(parseFloat(qrAmount)) || parseFloat(qrAmount) <= 0}
            >
              <Text style={styles.sendButtonText}>
                Send ₹{qrAmount || '0.00'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Cash Modal */}
      <Modal
        visible={showCashModal}
        animationType="slide"
        onRequestClose={() => setShowCashModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{cashAction === 'add' ? 'Add Cash' : 'Cash Spend'}</Text>
            <TouchableOpacity onPress={() => setShowCashModal(false)}>
              <Icon name="x" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.amountModalContent}>
            {cashAction === 'spend' && (
              <View style={{ marginBottom: 10 }}>
                {renderQRCategorySelector()}
              </View>
            )}
            <View style={styles.amountInputContainer}>
              <Text style={styles.amountLabel}>Amount</Text>
              <View style={styles.amountInputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  autoFocus
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.sendButton, (!cashAmount || isNaN(parseFloat(cashAmount)) || parseFloat(cashAmount) <= 0) && styles.disabledButton]}
              onPress={handleCashSubmit}
              disabled={!cashAmount || isNaN(parseFloat(cashAmount)) || parseFloat(cashAmount) <= 0}
            >
              <Text style={styles.sendButtonText}>{cashAction === 'add' ? 'Add Cash' : 'Record Spend'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.background,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  tabContent: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    padding: 20,
  },

  loginBox: {
    width: '100%',
    backgroundColor: AIStudioTheme.colors.surface,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: AIStudioTheme.colors.text,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    backgroundColor: AIStudioTheme.colors.surface,
    color: AIStudioTheme.colors.text,
  },
  loginButton: {
    backgroundColor: AIStudioTheme.colors.primary,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    opacity: 0.7,
  },
  loginText: {
    color: AIStudioTheme.colors.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleAuthText: {
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  demoBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 8,
    width: '100%',
  },
  demoTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: AIStudioTheme.colors.text,
  },
  demoText: {
    fontSize: 14,
    color: AIStudioTheme.colors.textSecondary,
  },
  languageSelector: {
    marginTop: 2,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c6c70',
  },
  langButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    marginRight: 6,
    backgroundColor: AIStudioTheme.colors.surface,
    minWidth: 40,
  },
  langButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#e6f0ff',
  },
  langText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c6c70',
  },
  langTextActive: {
    color: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: AIStudioTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: AIStudioTheme.colors.text,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 10,
  },
  logoutButton: {
    padding: 8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AIStudioTheme.colors.text,
  },
  userRole: {
    color: 'gray',
    fontSize: 14,
  },
  spiritAnimalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  spiritAnimalEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  spiritAnimalName: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '500',
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  // Bottom Tabs
  bottomTabContainer: {
    flexDirection: 'row',
    backgroundColor: AIStudioTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  bottomTabText: {
    fontSize: 12,
    color: AIStudioTheme.colors.textSecondary,
    marginTop: 2,
  },
  bottomTabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },

  balanceCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    opacity: 0.9,
  },
  balance: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  form: {
    backgroundColor: AIStudioTheme.colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    color: AIStudioTheme.colors.text,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: AIStudioTheme.colors.text,
  },
  flatList: {
    maxHeight: 150,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#f9f9f9',
  },
  selectedItem: {
    borderColor: '#007AFF',
    backgroundColor: '#e3f2fd',
  },
  userItemText: {
    fontSize: 16,
    color: AIStudioTheme.colors.text,
  },
  userBalance: {
    fontSize: 14,
    color: AIStudioTheme.colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
  },
  activeAdd: {
    borderColor: 'green',
    backgroundColor: '#e8f5e8',
  },
  activeDeduct: {
    borderColor: 'red',
    backgroundColor: '#ffeaea',
  },
  actionButtonText: {
    fontWeight: 'bold',
    color: AIStudioTheme.colors.text,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Category Styles
  categorySection: {
    marginVertical: 15,
  },
  categoryScroll: {
    marginVertical: 10,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    minWidth: 100,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  categoryButtonText: {
    marginLeft: 5,
    fontWeight: '600',
    color: AIStudioTheme.colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: '#007AFF',
  },
  // QR Category Styles
  qrCategorySection: {
    marginVertical: 20,
  },
  qrCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: AIStudioTheme.colors.text,
    textAlign: 'center',
  },
  qrCategoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  qrCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qrCategoryButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  qrCategoryButtonText: {
    marginLeft: 8,
    fontWeight: '600',
    color: AIStudioTheme.colors.textSecondary,
    fontSize: 14,
  },
  qrCategoryButtonTextActive: {
    color: '#007AFF',
  },
  // Radio Button Styles
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AIStudioTheme.colors.border,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#007AFF',
  },
  radioInnerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: AIStudioTheme.colors.surface,
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionNames: {
    fontWeight: 'bold',
    fontSize: 16,
    color: AIStudioTheme.colors.text,
  },
  transactionType: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  transactionList: {
    marginBottom: 20,
  },
  // Modal Styles
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: AIStudioTheme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1F2937',
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  menuOptionText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 10,
  },
  menuOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  qrContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  qrTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  qrSubtitle: {
    fontSize: 18,
    color: AIStudioTheme.colors.textSecondary,
    marginBottom: 30,
  },
  qrCodeContainer: {
    backgroundColor: AIStudioTheme.colors.surface,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: AIStudioTheme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  qrInstruction: {
    fontSize: 16,
    textAlign: 'center',
    color: AIStudioTheme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  qrInfo: {
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    padding: 15,
    borderRadius: 8,
    width: '100%',
  },
  qrInfoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  // Amount Modal Styles
  amountModalContent: {
    flex: 1,
    padding: 20,
  },
  amountModalRecipient: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  amountModalEmail: {
    fontSize: 16,
    color: AIStudioTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  amountInputContainer: {
    marginBottom: 30,
  },
  amountLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: AIStudioTheme.colors.text,
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: AIStudioTheme.colors.surface,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AIStudioTheme.colors.text,
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: AIStudioTheme.colors.text,
  },
  quickAmounts: {
    marginBottom: 30,
  },
  quickAmountsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: AIStudioTheme.colors.text,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '30%',
    alignItems: 'center',
  },
  quickAmountText: {
    fontWeight: 'bold',
    color: AIStudioTheme.colors.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf4ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    marginLeft: 10,
    color: '#0a66c2',
    flex: 1,
    fontWeight: '600',
  },
  // New Dashboard Styles
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  quickActionsSection: {
    marginHorizontal: 8,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '23%',
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: AIStudioTheme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: AIStudioTheme.colors.text,
    textAlign: 'center',
  },
  // Phase 2: AI Insights Styles
  insightsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  insightsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightsSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: AIStudioTheme.colors.primary,
  },
  // Phase 3: Tab Navigation & Goal Progress Styles
  tabNavigationSection: {
    marginHorizontal: 8,
    marginBottom: 16,
  },
  tabNavigationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 12,
  },
  goalProgressSection: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: AIStudioTheme.borderRadius.lg,
    padding: AIStudioTheme.spacing.lg,
    marginHorizontal: AIStudioTheme.spacing.md,
    marginBottom: AIStudioTheme.spacing.md,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
    ...AIStudioTheme.shadows.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  goalProgressBar: {
    height: 12,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: AIStudioTheme.colors.primary,
    borderRadius: 6,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalStat: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '600',
  },
  goalMessage: {
    fontSize: 14,
    color: AIStudioTheme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
  },
}); 
