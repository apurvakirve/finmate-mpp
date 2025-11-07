import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { Feather as Icon } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

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
}

interface TransactionAnalysisProps {
  currentUser: any;
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

export default function TransactionAnalysis({ currentUser }: TransactionAnalysisProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'contacts' | 'trends'>('overview');

  useEffect(() => {
    fetchTransactions();
  }, [currentUser, timeRange]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('transactions')
        .select('*')
        .or(`from_user_id.eq.${currentUser.id},to_user_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

      if (timeRange !== 'all') {
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
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Analyze spending patterns
  const spendingAnalysis: SpendingAnalysis = useMemo(() => {
    if (!transactions.length) {
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
        categoryBreakdown: []
      };
    }

    const userTransactions = transactions.filter(t => 
      t.from_user_id === currentUser.id || t.to_user_id === currentUser.id
    );

    // Calculate basic metrics
    const sentTransactions = userTransactions.filter(t => t.from_user_id === currentUser.id);
    const receivedTransactions = userTransactions.filter(t => t.to_user_id === currentUser.id);

    const totalSpent = sentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalReceived = receivedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netFlow = totalReceived - totalSpent;
    const transactionCount = userTransactions.length;
    const averageTransaction = transactionCount > 0 ? (totalSpent + totalReceived) / transactionCount : 0;
    const largestTransaction = Math.max(...userTransactions.map(t => t.amount));

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
      const amount = transaction.amount;
      const recipient = transaction.to_name;
      const date = new Date(transaction.created_at);
      const dayKey = date.toISOString().split('T')[0];
      const category = transaction.transaction_type || 'other';
      
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
      const sender = transaction.from_name;
      const amount = transaction.amount;
      const category = transaction.transaction_type || 'other';

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

    // Convert category breakdown to array
    const categoryBreakdown = Object.entries(categoryBreakdownMap)
      .map(([category, data]) => ({
        category,
        spent: data.spent,
        received: data.received,
        count: data.count,
        percentage: totalSpent > 0 ? (data.spent / totalSpent) * 100 : 0
      }))
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
      spendingInsights.push(`Your spending pattern is ${spendingPattern}. You spend an average of $${dailyAverageSpending.toFixed(2)} per day.`);

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
        spendingInsights.push(`Great! You've received $${netFlow.toFixed(2)} more than you've spent.`);
      } else if (netFlow < 0) {
        spendingInsights.push(`You've spent $${Math.abs(netFlow).toFixed(2)} more than you've received.`);
      }

      // Frequency insight
      const avgTransactionsPerDay = transactionCount / daysInRange;
      if (avgTransactionsPerDay > 1) {
        spendingInsights.push(`You make an average of ${avgTransactionsPerDay.toFixed(1)} transactions per day.`);
      }

      // Large transaction insight
      if (largestTransaction > 500) {
        spendingInsights.push(`Your largest transaction was $${largestTransaction.toFixed(2)}.`);
      }
    }

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
      categoryBreakdown
    };
  }, [transactions, currentUser.id, timeRange]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#007AFF'
    }
  };

  const screenWidth = Dimensions.get('window').width - 40;

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your spending patterns...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Spending Analysis</Text>
        <View style={styles.timeFilter}>
          {(['week', 'month', 'year', 'all'] as const).map(range => (
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
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        {(['overview', 'categories', 'contacts', 'trends'] as const).map(tab => (
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  ${spendingAnalysis.totalSpent.toFixed(2)}
                </Text>
                <Text style={styles.metricLabel}>Total Spent</Text>
                <Icon name="trending-down" size={16} color="#FF3B30" />
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  ${spendingAnalysis.totalReceived.toFixed(2)}
                </Text>
                <Text style={styles.metricLabel}>Total Received</Text>
                <Icon name="trending-up" size={16} color="#34C759" />
              </View>
              <View style={styles.metricCard}>
                <Text style={[
                  styles.metricValue,
                  { color: spendingAnalysis.netFlow >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  ${Math.abs(spendingAnalysis.netFlow).toFixed(2)}
                </Text>
                <Text style={styles.metricLabel}>
                  {spendingAnalysis.netFlow >= 0 ? 'Net Gain' : 'Net Loss'}
                </Text>
                <Icon 
                  name={spendingAnalysis.netFlow >= 0 ? "arrow-up" : "arrow-down"} 
                  size={16} 
                  color={spendingAnalysis.netFlow >= 0 ? '#34C759' : '#FF3B30'} 
                />
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {spendingAnalysis.transactionCount}
                </Text>
                <Text style={styles.metricLabel}>Transactions</Text>
                <Icon name="hash" size={16} color="#007AFF" />
              </View>
            </View>

            {/* Spending Insights */}
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Spending Insights</Text>
              {spendingAnalysis.spendingInsights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Icon name="info" size={16} color="#007AFF" />
                  <Text style={styles.insightText}>{insight}</Text>
                </View>
              ))}
            </View>

            {/* Quick Overview Chart */}
            {spendingAnalysis.topSpendingCategories.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Spending Distribution</Text>
                <PieChart
                  data={spendingAnalysis.topSpendingCategories.map((category, index) => ({
                    name: category.category,
                    population: category.amount,
                    color: ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#5856D6', '#AF52DE'][index],
                    legendFontColor: '#7F7F7F',
                    legendFontSize: 12,
                  }))}
                  width={screenWidth}
                  height={220}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}
          </View>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
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
                        <Icon name={config.icon as any} size={20} color={config.color} />
                        <Text style={styles.categoryName}>{config.label}</Text>
                      </View>
                      <Text style={styles.categoryAmount}>${category.spent.toFixed(2)}</Text>
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
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryPercentage}>{category.percentage.toFixed(1)}% of total</Text>
                      <Text style={styles.categoryCount}>{category.count} transactions</Text>
                    </View>
                    {category.received > 0 && (
                      <Text style={styles.categoryReceived}>
                        Received: ${category.received.toFixed(2)}
                      </Text>
                    )}
                  </View>
                );
              })}
          </View>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <View>
            <Text style={styles.sectionTitle}>Frequent Contacts</Text>
            {spendingAnalysis.frequentContacts.map((contact, index) => (
              <View key={contact.name} style={styles.contactItem}>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactDetails}>
                    {contact.count} transactions • {contact.type}
                  </Text>
                </View>
                <Text style={[
                  styles.contactAmount,
                  { color: contact.type === 'sent' ? '#FF3B30' : '#34C759' }
                ]}>
                  {contact.type === 'sent' ? '-' : '+'}${contact.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <View>
            <Text style={styles.sectionTitle}>Monthly Trends</Text>
            {spendingAnalysis.monthlySpending.length > 0 && (
              <BarChart
                data={{
                  labels: spendingAnalysis.monthlySpending.map(m => m.month),
                  datasets: [
                    {
                      data: spendingAnalysis.monthlySpending.map(m => m.spent),
                    },
                  ],
                }}
                width={screenWidth}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#ffa726'
                  }
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                verticalLabelRotation={30}
              />
            )}

            <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Daily Spending</Text>
            {spendingAnalysis.dailySpending.length > 0 && (
              <LineChart
                data={{
                  labels: spendingAnalysis.dailySpending.map(d => d.day),
                  datasets: [
                    {
                      data: spendingAnalysis.dailySpending.map(d => d.amount),
                    },
                  ],
                }}
                width={screenWidth}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            )}
          </View>
        )}

        {/* Refresh Button */}
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchTransactions}
        >
          <Icon name="refresh-cw" size={20} color="#007AFF" />
          <Text style={styles.refreshButtonText}>Refresh Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  timeFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  insightsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  categoryAmount: {
    fontSize: 16,
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
  categoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  categoryReceived: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactDetails: {
    fontSize: 12,
    color: '#666',
  },
  contactAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});