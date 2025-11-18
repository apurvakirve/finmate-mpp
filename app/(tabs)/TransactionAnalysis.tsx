import { Feather as Icon } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import FinanceBot from '../../components/FinanceBot';
import FinanceToast from '../../components/FinanceToast';
import { supabase } from '../../lib/supabase';

const screenWidth = Dimensions.get('window').width;

// Chart configuration
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#007AFF',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#e5e5e5',
    strokeWidth: 1,
  },
};

interface Transaction {
  id: string;
  from_user_id: string;
  to_user_id: string;
  from_name: string;
  to_name: string;
  amount: number;
  type: string;
  method?: string;
  timestamp: string;
  created_at: string;
  transaction_type: string;
}

interface SpendingAnalysis {
  totalSpent: number;
  totalReceived: number;
  netFlow: number;
  transactionCount: number;
  averageTransaction: number;
  largestTransaction: number;
  spendingByCategory: {
    [key: string]: number;
  };
  frequentContacts: Array<{
    name: string;
    amount: number;
    count: number;
    type: 'sent' | 'received';
  }>;
  monthlySpending: Array<{
    month: string;
    spent: number;
    received: number;
  }>;
  spendingPattern: 'high' | 'moderate' | 'low';
  topSpendingCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  dailySpending: Array<{
    day: string;
    amount: number;
  }>;
  spendingInsights: string[];
  categoryBreakdown: Array<{
    category: string;
    spent: number;
    received: number;
    count: number;
    percentage: number;
  }>;
  upcomingBillsEstimate: number;
  overspendingCategories: string[];
  totalSaved: number;
  savingsRate: number;
  weeklySpendingData: number[];
}

interface TransactionAnalysisProps {
  currentUser: any;
  initialTab?: 'overview' | 'categories' | 'coach';
}

// Category colors and icons
const CATEGORY_CONFIG = {
  food: { color: '#FF6384', icon: 'coffee', label: 'Food & Dining' },
  transportation: { color: '#36A2EB', icon: 'car', label: 'Transportation' },
  shopping: { color: '#FFCE56', icon: 'shopping-bag', label: 'Shopping' },
  utilities: { color: '#4BC0C0', icon: 'home', label: 'Utilities' },
  entertainment: { color: '#9966FF', icon: 'film', label: 'Entertainment' },
  healthcare: { color: '#FF9F40', icon: 'heart', label: 'Healthcare' },
  transfer: { color: '#C9CBCF', icon: 'send', label: 'Money Transfer' },
  other: { color: '#8AC926', icon: 'box', label: 'Other' },
};

export default function TransactionAnalysis({ currentUser, initialTab = 'overview' }: TransactionAnalysisProps) {
  // State hooks - must be called unconditionally at the top level
  // State hooks - must be called unconditionally at the top level
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'coach'>(initialTab as 'overview' | 'categories' | 'coach');
  const [showBot, setShowBot] = useState(false);
  const [botAlert, setBotAlert] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'warning' | 'success' | 'error'>('info');
  const [showToast, setShowToast] = useState(false);
  
  // Calculate derived state
  const showCoachTab = activeTab === 'coach';
  const showOverviewTab = activeTab === 'overview';
  const showCategoriesTab = activeTab === 'categories';

  // Ensure the activeTab is in sync with initialTab
  useEffect(() => {
    if (initialTab && ['overview', 'categories', 'coach'].includes(initialTab)) {
      setActiveTab(initialTab as 'overview' | 'categories' | 'coach');
    }
  }, [initialTab]);

  // Fetch transactions when currentUser or timeRange changes
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        if (!currentUser?.id) {
          console.error('No current user found');
          setLoading(false);
          return;
        }

        let query = supabase
          .from('transactions')
          .select('*')
          .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        const now = new Date();
        let startDate = new Date();
        
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());

        const { data, error } = await query;

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser, timeRange]);

  // Analyze spending patterns
  const spendingAnalysis: SpendingAnalysis = useMemo(() => {
    // Ensure transactions is an array and has data
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
        totalSpent: 0,
        totalReceived: 0,
        netFlow: 0,
        transactionCount: 0,
        averageTransaction: 0,
        largestTransaction: 0,
        spendingByCategory: {},
        frequentContacts: [],
        monthlySpending: [],
        spendingPattern: 'low',
        topSpendingCategories: [],
        dailySpending: [],
        spendingInsights: ['No transaction data available for analysis.'],
        categoryBreakdown: [],
        upcomingBillsEstimate: 0,
        overspendingCategories: [],
        totalSaved: 0,
        savingsRate: 0,
        weeklySpendingData: []
      };
    }

    // Ensure transactions have required fields and valid amounts
    const userTransactions = transactions.filter(t => {
      const hasValidIds = t && 
                         (t.from_user_id === currentUser?.id || t.to_user_id === currentUser?.id);
      const hasValidAmount = t.amount !== undefined && t.amount !== null && !isNaN(Number(t.amount));
      return hasValidIds && hasValidAmount;
    });

    // Calculate basic metrics
    const sentTransactions = userTransactions.filter(t => t && t.from_user_id === currentUser?.id);
    const receivedTransactions = userTransactions.filter(t => t && t.to_user_id === currentUser?.id);

    const totalSpent = sentTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalReceived = receivedTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netFlow = totalReceived - totalSpent;
    const transactionCount = userTransactions.length;
    const averageTransaction = transactionCount > 0 ? (totalSpent + totalReceived) / transactionCount : 0;
    
    // Safely calculate largest transaction
    const amounts = userTransactions
      .map(t => Number(t.amount) || 0)
      .filter(amount => !isNaN(amount));
    const largestTransaction = amounts.length > 0 ? Math.max(...amounts) : 0;

    // Categorize spending using transaction_type
    const spendingByCategory: { [key: string]: number } = {};
    const categoryBreakdownMap: { [key: string]: { spent: number; received: number; count: number } } = {};
    const contactMap: { [key: string]: { name: string; sent: number; received: number; count: number } } = {};
    const dailySpendingMap: { [key: string]: number } = {};

    // Initialize category breakdown
    Object.keys(CATEGORY_CONFIG).forEach(category => {
      categoryBreakdownMap[category] = { spent: 0, received: 0, count: 0 };
    });

    sentTransactions.forEach(transaction => {
      const amount = Number(transaction.amount) || 0;
      const recipient = transaction.to_name || 'Unknown';
      const date = transaction.created_at ? new Date(transaction.created_at) : new Date();
      const dayKey = date.toISOString().split('T')[0];
      const category = (transaction.transaction_type && typeof transaction.transaction_type === 'string') 
        ? transaction.transaction_type.toLowerCase() 
        : 'other';
      
      // Track daily spending
      dailySpendingMap[dayKey] = (dailySpendingMap[dayKey] || 0) + amount;

      // Categorize transactions using transaction_type
      spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;

      // Update category breakdown
      if (!categoryBreakdownMap[category]) {
        categoryBreakdownMap[category] = { spent: 0, received: 0, count: 0 };
      }
      categoryBreakdownMap[category].spent += amount;
      categoryBreakdownMap[category].count += 1;

      // Track frequent contacts
      if (!contactMap[recipient]) {
        contactMap[recipient] = { name: recipient, sent: 0, received: 0, count: 0 };
      }
      contactMap[recipient].sent += amount;
      contactMap[recipient].count += 1;
    });

    receivedTransactions.forEach(transaction => {
      const sender = transaction.from_name || 'Unknown';
      const amount = Number(transaction.amount) || 0;
      const category = (transaction.transaction_type && typeof transaction.transaction_type === 'string')
        ? transaction.transaction_type.toLowerCase()
        : 'other';

      // Update category breakdown for received transactions
      if (!categoryBreakdownMap[category]) {
        categoryBreakdownMap[category] = { spent: 0, received: 0, count: 0 };
      }
      categoryBreakdownMap[category].received += amount;
      categoryBreakdownMap[category].count += 1;

      if (!contactMap[sender]) {
        contactMap[sender] = { name: sender, sent: 0, received: 0, count: 0 };
      }
      contactMap[sender].received += amount;
      contactMap[sender].count += 1;
    });

    // Convert category breakdown to array with validation
    const categoryBreakdown = Object.entries(categoryBreakdownMap)
      .map(([category, data]) => {
        const spent = Number(data.spent) || 0;
        const received = Number(data.received) || 0;
        const count = Number(data.count) || 0;
        const percentage = totalSpent > 0 ? (spent / totalSpent) * 100 : 0;
        
        return {
          category,
          spent,
          received,
          count,
          percentage
        };
      })
      .sort((a, b) => b.spent - a.spent);

    // Convert contact map to array and sort
    const frequentContacts = Object.values(contactMap)
      .map(contact => ({
        name: contact.name,
        amount: Math.max(contact.sent, contact.received),
        count: contact.count,
        type: contact.sent > contact.received ? 'sent' as const : 'received' as const
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Calculate monthly spending
    const monthlyData: { [key: string]: { spent: number; received: number } } = {};
    userTransactions.forEach(transaction => {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { spent: 0, received: 0 };
      }

      if (transaction.from_user_id === currentUser.id) {
        monthlyData[monthKey].spent += transaction.amount;
      } else {
        monthlyData[monthKey].received += transaction.amount;
      }
    });

    const monthlySpending = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: month.split('-')[1] + '/' + month.split('-')[0].slice(2),
        spent: data.spent,
        received: data.received
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    // Daily spending data - FIXED: Only include sent transactions
    const dailySpending = Object.entries(dailySpendingMap)
      .map(([day, amount]) => ({
        day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount
      }))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())
      .slice(-7);

    // Determine spending pattern - FIXED: Better calculation
    let spendingPattern: 'high' | 'moderate' | 'low' = 'low';
    const daysInRange = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'year' ? 365 : 
                       Math.max(1, Math.ceil((new Date().getTime() - new Date(Math.min(...userTransactions.map(t => new Date(t.created_at).getTime()))).getTime()) / (1000 * 60 * 60 * 24)));
    
    const dailyAverageSpending = totalSpent / daysInRange;
    
    if (dailyAverageSpending > 100) spendingPattern = 'high';
    else if (dailyAverageSpending > 30) spendingPattern = 'moderate';
    else spendingPattern = 'low';

    // Calculate top spending categories
    const topSpendingCategories = Object.entries(spendingByCategory)
      .map(([category, amount]) => ({
        category: CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label || category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // Generate spending insights
    const spendingInsights: string[] = [];
    
    if (totalSpent > 0) {
      // Spending pattern insight
      spendingInsights.push(`Your spending pattern is ${spendingPattern}. You spend an average of ₹${dailyAverageSpending.toFixed(2)} per day.`);

      // Largest category insight
      if (topSpendingCategories.length > 0) {
        const largestCategory = topSpendingCategories[0];
        spendingInsights.push(`Your largest spending category is ${largestCategory.category} (${largestCategory.percentage.toFixed(1)}% of total spending).`);
      }

      // Category diversity insight
      const activeCategories = categoryBreakdown.filter(cat => cat.spent > 0).length;
      if (activeCategories > 3) {
        spendingInsights.push(`You spend across ${activeCategories} different categories.`);
      }

      // Net flow insight
      if (netFlow > 0) {
        spendingInsights.push(`Great! You've received ₹${netFlow.toFixed(2)} more than you've spent.`);
      } else if (netFlow < 0) {
        spendingInsights.push(`You've spent ₹${Math.abs(netFlow).toFixed(2)} more than you've received.`);
      }

      // Frequency insight
      const avgTransactionsPerDay = transactionCount / daysInRange;
      if (avgTransactionsPerDay > 1) {
        spendingInsights.push(`You make an average of ${avgTransactionsPerDay.toFixed(1)} transactions per day.`);
      }

      // Large transaction insight
      if (largestTransaction > 500) {
        spendingInsights.push(`Your largest transaction was ₹${largestTransaction.toFixed(2)}.`);
      }
    }

    // Calculate upcoming bills estimate based on recurring fixed categories
    // Categories that typically have monthly bills: utilities, insurance, emis
    const recurringCategories = ['utilities', 'insurance', 'emis', 'rent'];
    const monthlyAverageForBills = recurringCategories.reduce((sum, cat) => {
      const catData = categoryBreakdownMap[cat];
      if (catData && catData.spent > 0) {
        // Estimate monthly based on timeRange
        const multiplier = timeRange === 'week' ? 4.33 : timeRange === 'month' ? 1 : 1 / 12;
        return sum + (catData.spent * multiplier);
      }
      return sum;
    }, 0);
    
    const upcomingBillsEstimate = Math.round(monthlyAverageForBills);

    // Calculate total saved (net positive flow, but also consider it as income - expenses)
    const totalSaved = Math.max(0, netFlow);

    // Identify overspending categories (categories where spending exceeds 30% of income)
    const incomeThreshold = totalReceived || totalSpent; // Use total spent if no income
    const overspendingThreshold = incomeThreshold * 0.3;
    const overspendingCategories = topSpendingCategories
      .filter(cat => cat.amount > overspendingThreshold)
      .map(cat => cat.category);

    // Calculate savings rate
    const savingsRate = totalReceived > 0 ? (totalSaved / totalReceived) * 100 : 0;

    // Prepare weekly spending data for charts
    const weeklySpendingData = dailySpending.map(item => item.amount);

    return {
      totalSpent,
      totalReceived,
      netFlow,
      transactionCount,
      averageTransaction,
      largestTransaction,
      spendingByCategory,
      frequentContacts,
      monthlySpending,
      spendingPattern,
      topSpendingCategories,
      dailySpending,
      spendingInsights,
      categoryBreakdown,
      upcomingBillsEstimate,
      overspendingCategories,
      totalSaved,
      savingsRate,
      weeklySpendingData
    };
  }, [transactions, currentUser?.id, timeRange]);



  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your spending patterns...</Text>
      </SafeAreaView>
    );
  }

  // Debug: Check if we have data
  console.log('TransactionAnalysis - Transactions:', transactions.length);
  console.log('TransactionAnalysis - Spending Analysis:', spendingAnalysis);

  // Generate alerts and toast notifications based on spending data
  useEffect(() => {
    if (!loading && spendingAnalysis && transactions.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Calculate today's spending
      const todaySpending = transactions
        .filter((t: Transaction) => {
          const txDate = new Date(t.created_at);
          return txDate >= today && t.from_user_id === currentUser.id;
        })
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      // Calculate this week's spending
      const weekSpending = transactions
        .filter((t: Transaction) => {
          const txDate = new Date(t.created_at);
          return txDate >= weekAgo && t.from_user_id === currentUser.id;
        })
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);

      // Calculate average daily spending
      const avgDailySpending = spendingAnalysis.totalSpent / (timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365);

      // Generate contextual alerts
      const alerts: Array<{ message: string; type: 'info' | 'warning' | 'success' | 'error' }> = [];
      
      // Today's spending alert
      if (todaySpending > avgDailySpending * 1.5 && todaySpending > 0) {
        alerts.push({
          message: `💰 You've spent ₹${todaySpending.toLocaleString('en-IN')} today - ${((todaySpending / avgDailySpending - 1) * 100).toFixed(0)}% more than average. Make sure to save some!`,
          type: 'warning'
        });
      }

      // This week's spending alert
      if (weekSpending > spendingAnalysis.totalSpent * 0.3 && weekSpending > 0) {
        const weekIncrease = timeRange === 'week' ? 'this week' : 'recently';
        alerts.push({
          message: `📊 You've spent ₹${weekSpending.toLocaleString('en-IN')} ${weekIncrease}. Consider reducing expenses to meet your savings goals.`,
          type: 'warning'
        });
      }

      // Check for overspending
      if (spendingAnalysis.overspendingCategories.length > 0) {
        alerts.push({
          message: `⚠️ Overspending detected in: ${spendingAnalysis.overspendingCategories.join(', ')}. Review these categories.`,
          type: 'error'
        });
      }
      
      // Check savings rate
      if (spendingAnalysis.savingsRate < 10 && spendingAnalysis.totalReceived > 0) {
        alerts.push({
          message: `💡 Your savings rate is ${spendingAnalysis.savingsRate.toFixed(1)}%. Aim for at least 20% to build wealth!`,
          type: 'warning'
        });
      }
      
      // Check upcoming bills
      if (spendingAnalysis.upcomingBillsEstimate > spendingAnalysis.totalSaved && spendingAnalysis.upcomingBillsEstimate > 0) {
        alerts.push({
          message: `📅 Upcoming bills (₹${spendingAnalysis.upcomingBillsEstimate.toLocaleString('en-IN')}) may exceed your savings. Plan ahead!`,
          type: 'warning'
        });
      }
      
      // Check spending pattern
      if (spendingAnalysis.spendingPattern === 'high') {
        alerts.push({
          message: `📊 High spending pattern detected. Review your expenses to improve savings this ${timeRange}.`,
          type: 'warning'
        });
      }

      // Positive reinforcement
      if (spendingAnalysis.savingsRate >= 20 && spendingAnalysis.totalReceived > 0) {
        alerts.push({
          message: `🎉 Great job! You're saving ${spendingAnalysis.savingsRate.toFixed(1)}% of your income. Keep it up!`,
          type: 'success'
        });
      }

      // Show toast notifications (one at a time, rotating)
      if (alerts.length > 0) {
        const firstAlert = alerts[0];
        if (!toastMessage) {
          setToastMessage(firstAlert.message);
          setToastType(firstAlert.type);
          setShowToast(true);
          
          // Set bot alert for persistent notification
          if (!botAlert) {
            setBotAlert(firstAlert.message);
          }
        }
      }
    }
  }, [loading, spendingAnalysis, transactions, timeRange]);

  const getBotUserData = () => {
    return {
      totalIncome: spendingAnalysis.totalReceived,
      totalSpent: spendingAnalysis.totalSpent,
      totalSaved: spendingAnalysis.totalSaved,
      savingsRate: spendingAnalysis.savingsRate,
      topCategories: spendingAnalysis.topSpendingCategories,
      overspendingCategories: spendingAnalysis.overspendingCategories,
      upcomingBills: spendingAnalysis.upcomingBillsEstimate,
      transactionCount: spendingAnalysis.transactionCount,
      spendingPattern: spendingAnalysis.spendingPattern,
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Finance Toast Notification */}
      <FinanceToast
        message={toastMessage || ''}
        type={toastType}
        isVisible={showToast}
        onDismiss={() => {
          setShowToast(false);
          setToastMessage(null);
        }}
        duration={6000}
      />

      {/* Finance Bot */}
      <FinanceBot
        userId={currentUser.id}
        userSpendingData={getBotUserData()}
        isVisible={showBot}
        onClose={() => {
          setShowBot(false);
          setBotAlert(null);
        }}
        showAsAlert={!!botAlert}
        alertMessage={botAlert || undefined}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Spending Analysis</Text>
          <TouchableOpacity
            style={styles.botButton}
            onPress={() => setShowBot(true)}
          >
            <Icon name="message-circle" size={22} color="#007AFF" />
            {botAlert && <View style={styles.alertBadge} />}
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeFilter}>
          {(['week', 'month', 'year'] as const).map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeFilterButton,
                timeRange === range && styles.timeFilterButtonActive
              ]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[
                styles.timeFilterText,
                timeRange === range && styles.timeFilterTextActive
              ]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'categories', 'coach'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab === 'coach' ? 'Coach' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coach Tab - Using showCoachTab variable for conditional rendering */}
        {showCoachTab ? (
          <View style={styles.coachContainer}>
            <Text style={styles.coachTitle}>Financial Coach</Text>
            <Text style={styles.coachSubtitle}>Get personalized financial advice</Text>
            
            <TouchableOpacity 
              style={styles.coachButton}
              onPress={() => setShowBot(true)}
            >
              <Icon name="message-circle" size={20} color="white" style={styles.coachButtonIcon} />
              <Text style={styles.coachButtonText}>Chat with Financial Coach</Text>
            </TouchableOpacity>
            
            <View style={styles.coachTips}>
              <Text style={styles.coachTipsTitle}>Quick Tips</Text>
              <View style={styles.tipItem}>
                <Icon name="trending-up" size={16} color="#4CAF50" />
                <Text style={styles.tipText}>Save at least 20% of your income</Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="alert-triangle" size={16} color="#FFA000" />
                <Text style={styles.tipText}>High-interest debt should be your priority</Text>
              </View>
              <View style={styles.tipItem}>
                <Icon name="bar-chart-2" size={16} color="#2196F3" />
                <Text style={styles.tipText}>Diversify your investments</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Overview Tab - Using showOverviewTab variable for conditional rendering */}
        {showOverviewTab && (
          <View>
            {/* Mini Dashboard */}
            <View style={styles.dashboardCard}>
              <Text style={styles.dashboardTitle}>Financial Overview</Text>
              <Text style={styles.dashboardSubtitle}>
                {timeRange === 'week' ? 'This Week' : timeRange === 'month' ? 'This Month' : 'This Year'}
              </Text>
              
              <View style={styles.dashboardGrid}>
                {/* Total Income */}
                <View style={styles.dashboardMetricCard}>
                  <View style={[styles.dashboardIconContainer, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="arrow-down" size={24} color="#34C759" />
                  </View>
                  <Text style={styles.dashboardMetricValue}>
                    ₹{spendingAnalysis.totalReceived.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.dashboardMetricLabel}>Total Income</Text>
                </View>

                {/* Total Spent */}
                <View style={styles.dashboardMetricCard}>
                  <View style={[styles.dashboardIconContainer, { backgroundColor: '#FFEBEE' }]}>
                    <Icon name="arrow-up" size={24} color="#FF3B30" />
                  </View>
                  <Text style={styles.dashboardMetricValue}>
                    ₹{spendingAnalysis.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.dashboardMetricLabel}>Total Spent</Text>
                </View>

                {/* Total Saved */}
                <View style={styles.dashboardMetricCard}>
                  <View style={[styles.dashboardIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Icon name="shield" size={24} color="#007AFF" />
                  </View>
                  <Text style={[styles.dashboardMetricValue, { color: '#007AFF' }]}>
                    ₹{spendingAnalysis.totalSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.dashboardMetricLabel}>Total Saved</Text>
                </View>

                {/* Upcoming Bills */}
                <View style={styles.dashboardMetricCard}>
                  <View style={[styles.dashboardIconContainer, { backgroundColor: '#FFF3E0' }]}>
                    <Icon name="alert-circle" size={24} color="#FF9500" />
                  </View>
                  <Text style={[styles.dashboardMetricValue, { color: '#FF9500' }]}>
                    ₹{spendingAnalysis.upcomingBillsEstimate.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.dashboardMetricLabel}>Upcoming Bills</Text>
                </View>
              </View>

              {/* Spending Nature / Overspending Areas */}
              {spendingAnalysis.overspendingCategories.length > 0 && (
                <View style={styles.overspendingSection}>
                  <View style={styles.overspendingHeader}>
                    <Icon name="alert-triangle" size={18} color="#FF3B30" />
                    <Text style={[styles.overspendingTitle, { marginLeft: 8 }]}>Overspending Areas</Text>
                  </View>
                  <View style={styles.overspendingChips}>
                    {spendingAnalysis.overspendingCategories.map((category, index) => {
                      const categoryData = spendingAnalysis.topSpendingCategories.find(c => c.category === category);
                      if (!categoryData) return null;
                      return (
                        <View key={index} style={[styles.overspendingChip, { marginRight: 8, marginBottom: 8 }]}>
                          <Text style={styles.overspendingChipText}>{category}</Text>
                          <Text style={styles.overspendingChipPercent}>
                            {categoryData.percentage.toFixed(0)}%
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Spending Nature Summary */}
              <View style={styles.spendingNatureSection}>
                <Text style={styles.spendingNatureTitle}>Spending Nature</Text>
                <View style={styles.spendingNatureCard}>
                  <View style={styles.spendingNatureRow}>
                    <Text style={styles.spendingNatureLabel}>Pattern</Text>
                    <View style={[
                      styles.spendingNatureBadge,
                      spendingAnalysis.spendingPattern === 'high' && styles.spendingNatureBadgeHigh,
                      spendingAnalysis.spendingPattern === 'moderate' && styles.spendingNatureBadgeModerate,
                      spendingAnalysis.spendingPattern === 'low' && styles.spendingNatureBadgeLow,
                    ]}>
                      <Text style={styles.spendingNatureBadgeText}>
                        {spendingAnalysis.spendingPattern.charAt(0).toUpperCase() + spendingAnalysis.spendingPattern.slice(1)}
                      </Text>
                    </View>
                  </View>
                  {spendingAnalysis.topSpendingCategories.length > 0 && (
                    <View style={styles.topCategoriesPreview}>
                      <Text style={styles.topCategoriesLabel}>Top Categories:</Text>
                      <View style={styles.topCategoriesChips}>
                        {spendingAnalysis.topSpendingCategories.slice(0, 3).map((category, index) => (
                          <View key={index} style={[styles.categoryChip, { marginRight: 8, marginBottom: 8 }]}>
                            <View style={[styles.categoryChipDot, { backgroundColor: ['#007AFF', '#34C759', '#FF3B30'][index] }]} />
                            <Text style={styles.categoryChipText}>{category.category}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Spending Trend Chart */}
            {spendingAnalysis.dailySpending.length > 0 && timeRange === 'week' && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Daily Spending Trend</Text>
                <LineChart
                  data={{
                    labels: spendingAnalysis.dailySpending.map(item => {
                      const parts = item.day.split(' ');
                      return parts.length > 1 ? parts[0] : item.day.substring(0, 3);
                    }),
                    datasets: [
                      {
                        data: spendingAnalysis.weeklySpendingData.length > 0 
                          ? spendingAnalysis.weeklySpendingData 
                          : [0],
                        color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>
            )}

            {/* Monthly Spending Trend */}
            {spendingAnalysis.monthlySpending.length > 0 && timeRange === 'year' && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
                <BarChart
                  data={{
                    labels: spendingAnalysis.monthlySpending.map(item => item.month),
                    datasets: [
                      {
                        data: spendingAnalysis.monthlySpending.map(item => item.spent),
                      },
                    ],
                  }}
                  width={screenWidth - 80}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                    barPercentage: 0.7,
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  fromZero
                  yAxisLabel="₹"
                  yAxisSuffix=""
                />
              </View>
            )}

            {/* Category Breakdown Pie Chart */}
            {spendingAnalysis.topSpendingCategories.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Spending by Category</Text>
                <View style={styles.pieChartContainer}>
                  <PieChart
                    data={spendingAnalysis.topSpendingCategories.slice(0, 6).map((cat, index) => ({
                      name: cat.category.length > 10 ? cat.category.substring(0, 10) : cat.category,
                      amount: cat.amount,
                      color: ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', '#AF52DE'][index],
                      legendFontColor: '#333',
                      legendFontSize: 12,
                    }))}
                    width={screenWidth - 80}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    style={styles.chart}
                    absolute
                  />
                </View>
              </View>
            )}

            {/* Income vs Expenses Comparison */}
            {spendingAnalysis.totalReceived > 0 && spendingAnalysis.totalSpent > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Income vs Expenses</Text>
                <View style={styles.comparisonBars}>
                  <View style={styles.comparisonBarContainer}>
                    <View style={styles.comparisonBarLabel}>
                      <Icon name="arrow-down" size={16} color="#34C759" />
                      <Text style={[styles.comparisonBarText, { marginLeft: 6 }]}>Income</Text>
                    </View>
                    <View style={styles.comparisonBarWrapper}>
                      <View 
                        style={[
                          styles.comparisonBar, 
                          { 
                            width: '100%', 
                            backgroundColor: '#34C759',
                            maxWidth: '100%'
                          }
                        ]} 
                      >
                        <Text style={styles.comparisonBarValue}>
                          ₹{spendingAnalysis.totalReceived.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.comparisonBarContainer}>
                    <View style={styles.comparisonBarLabel}>
                      <Icon name="arrow-up" size={16} color="#FF3B30" />
                      <Text style={[styles.comparisonBarText, { marginLeft: 6 }]}>Expenses</Text>
                    </View>
                    <View style={styles.comparisonBarWrapper}>
                      <View 
                        style={[
                          styles.comparisonBar, 
                          { 
                            width: `${Math.min(100, (spendingAnalysis.totalSpent / spendingAnalysis.totalReceived) * 100)}%`, 
                            backgroundColor: '#FF3B30'
                          }
                        ]} 
                      >
                        <Text style={styles.comparisonBarValue}>
                          ₹{spendingAnalysis.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.comparisonSummary}>
                    <Text style={styles.comparisonSummaryText}>
                      {spendingAnalysis.netFlow >= 0 ? 'You saved' : 'You overspent'}{' '}
                      <Text style={{ fontWeight: 'bold', color: spendingAnalysis.netFlow >= 0 ? '#34C759' : '#FF3B30' }}>
                        ₹{Math.abs(spendingAnalysis.netFlow).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Savings Rate & Additional Stats */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Icon name="trending-up" size={20} color="#007AFF" />
                </View>
                <Text style={styles.statValue}>
                  {spendingAnalysis.savingsRate >= 0 ? '+' : ''}{spendingAnalysis.savingsRate.toFixed(1)}%
                </Text>
                <Text style={styles.statLabel}>Savings Rate</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFF3E0' }]}>
                  <Icon name="activity" size={20} color="#FF9500" />
                </View>
                <Text style={styles.statValue}>{spendingAnalysis.transactionCount}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <Icon name="credit-card" size={20} color="#5856D6" />
                </View>
                <Text style={styles.statValue}>
                  ₹{spendingAnalysis.averageTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statLabel}>Avg Transaction</Text>
              </View>
              
              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Icon name="maximize-2" size={20} color="#FF3B30" />
                </View>
                <Text style={styles.statValue}>
                  ₹{spendingAnalysis.largestTransaction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statLabel}>Largest Expense</Text>
              </View>
            </View>

            {/* Top Categories Summary */}
            {spendingAnalysis.topSpendingCategories.length > 0 && (
              <View style={styles.topCategoriesCard}>
                <Text style={styles.sectionTitle}>Top Spending Categories</Text>
                {spendingAnalysis.topSpendingCategories.slice(0, 5).map((category, index) => (
                  <View key={index} style={styles.topCategoryRow}>
                    <View style={styles.topCategoryLeft}>
                      <View style={[styles.topCategoryDot, { backgroundColor: ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6'][index] }]} />
                      <Text style={styles.topCategoryName}>{category.category}</Text>
                    </View>
                    <View style={styles.topCategoryRight}>
                      <Text style={styles.topCategoryAmount}>₹{category.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                      <Text style={styles.topCategoryPercent}>{category.percentage.toFixed(0)}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Spending Insights */}
            {spendingAnalysis.spendingInsights.length > 0 && (
              <View style={styles.insightsContainer}>
                <Text style={styles.sectionTitle}>Key Insights</Text>
                {spendingAnalysis.spendingInsights.slice(0, 3).map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <Icon name="info" size={16} color="#007AFF" />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Categories Tab - Using showCategoriesTab variable for conditional rendering */}
        {showCategoriesTab && (
          <View>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {spendingAnalysis.categoryBreakdown
              .filter(category => category.spent > 0)
              .map((category, index) => {
                const config = CATEGORY_CONFIG[category.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
                return (
                  <View key={category.category} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryTitle}>
                        <View style={[styles.categoryIconContainer, { backgroundColor: `${config.color}15` }]}>
                          <Icon name={config.icon as any} size={20} color={config.color} />
                        </View>
                        <View style={styles.categoryTextContainer}>
                          <Text style={styles.categoryName}>{config.label}</Text>
                          <Text style={styles.transactionCount}>{category.count} transactions</Text>
                        </View>
                      </View>
                      <Text style={styles.categoryAmount}>₹{category.spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${Math.min(category.percentage, 100)}%`,
                            backgroundColor: config.color
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}% of total spending</Text>
                  </View>
                );
              })}
          </View>
        )}

      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Coach Tab Styles
  coachContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coachTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1a1a1a',
  },
  coachSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  coachButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  coachButtonIcon: {
    marginRight: 8,
  },
  coachButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  coachTips: {
    marginTop: 16,
  },
  coachTipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1a1a1a',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  botButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  timeFilter: {
    marginTop: 1,
  },
  timeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  timeFilterButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  timeFilterTextActive: {
    color: 'white',
  },
  tabContainer: {
    backgroundColor: 'white',
     paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 5,
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20, 
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricCardWide: {
    width: '100%',
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  topCategoriesCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  topCategoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  topCategoryRight: {
    alignItems: 'flex-end',
  },
  topCategoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  topCategoryPercent: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  insightsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  categoryItem: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  transactionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  // Dashboard Styles
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dashboardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontWeight: '500',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dashboardMetricCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dashboardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dashboardMetricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  dashboardMetricLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Overspending Styles
  overspendingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  overspendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  overspendingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  overspendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  overspendingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  overspendingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C62828',
    marginRight: 6,
  },
  overspendingChipPercent: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  // Spending Nature Styles
  spendingNatureSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  spendingNatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  spendingNatureCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  spendingNatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  spendingNatureLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  spendingNatureBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  spendingNatureBadgeHigh: {
    backgroundColor: '#FFEBEE',
  },
  spendingNatureBadgeModerate: {
    backgroundColor: '#FFF3E0',
  },
  spendingNatureBadgeLow: {
    backgroundColor: '#E8F5E9',
  },
  spendingNatureBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  topCategoriesPreview: {
    marginTop: 8,
  },
  topCategoriesLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  topCategoriesChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  // Chart Styles
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stats Grid Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Comparison Bar Styles
  comparisonBars: {
    marginTop: 8,
  },
  comparisonBarContainer: {
    marginBottom: 20,
  },
  comparisonBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  comparisonBarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  comparisonBarWrapper: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  comparisonBar: {
    height: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  comparisonBarValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 8,
  },
  comparisonSummary: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
  },
  comparisonSummaryText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});












