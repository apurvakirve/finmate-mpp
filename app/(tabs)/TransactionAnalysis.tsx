import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import AIInsightsDashboard from '../../components/AIInsightsDashboard';
import { FinancialContext } from '../../types/aiInsights';

interface TransactionAnalysisProps {
  currentUser: any;
  transactions?: any[]; // Added transactions prop
  initialTab?: 'overview' | 'categories' | 'coach';
}

export default function TransactionAnalysis({ currentUser, transactions = [], initialTab = 'overview' }: TransactionAnalysisProps) {
  const [context, setContext] = useState<FinancialContext | null>(null);

  useEffect(() => {
    if (currentUser && transactions.length > 0) {
      // Calculate context from transactions
      const userTransactions = transactions.filter(t =>
        t.from_user_id === currentUser.id || t.to_user_id === currentUser.id
      );

      const sent = userTransactions.filter(t => t.from_user_id === currentUser.id);
      const received = userTransactions.filter(t => t.to_user_id === currentUser.id);

      const totalSpent = sent.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalIncome = received.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Calculate top categories
      const spendingByCategory: Record<string, number> = {};
      sent.forEach(t => {
        const cat = t.transaction_type || 'other';
        spendingByCategory[cat] = (spendingByCategory[cat] || 0) + (Number(t.amount) || 0);
      });

      const topCategories = Object.entries(spendingByCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Determine spending pattern (simple heuristic)
      const days = 30; // Assume monthly view for now
      const dailyAvg = totalSpent / days;
      let spendingPattern: 'low' | 'moderate' | 'high' = 'moderate';
      if (dailyAvg > 1000) spendingPattern = 'high';
      else if (dailyAvg < 200) spendingPattern = 'low';

      // Check for gig worker status (irregular income)
      // This logic should ideally be more robust or come from user profile
      // For demo, we can infer from transaction frequency or metadata
      const isGigWorker = currentUser.metadata?.includes('gig') || transactions.some(t => t.from_name === 'Gig Work');

      // Calculate upcoming bills (simple estimate from recurring categories)
      const recurringCategories = ['utilities', 'insurance', 'emis', 'rent'];
      const upcomingBills = topCategories
        .filter(c => recurringCategories.includes(c.category.toLowerCase()))
        .reduce((sum, c) => sum + c.amount, 0);

      // Calculate income volatility and frequency
      const incomeTransactions = received.map(t => ({
        amount: Number(t.amount) || 0,
        date: new Date(t.created_at).getTime()
      })).sort((a, b) => a.date - b.date);

      let incomeVolatility = 0;
      let incomeFrequency: 'weekly' | 'monthly' | 'irregular' = 'monthly';

      if (incomeTransactions.length > 1) {
        const meanIncome = totalIncome / incomeTransactions.length;
        const variance = incomeTransactions.reduce((sum, t) => sum + Math.pow(t.amount - meanIncome, 2), 0) / incomeTransactions.length;
        incomeVolatility = Math.sqrt(variance);

        const intervals = [];
        for (let i = 1; i < incomeTransactions.length; i++) {
          intervals.push((incomeTransactions[i].date - incomeTransactions[i - 1].date) / (1000 * 60 * 60 * 24));
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

        if (avgInterval < 10) incomeFrequency = 'weekly';
        else if (avgInterval > 25 && avgInterval < 35) incomeFrequency = 'monthly';
        else incomeFrequency = 'irregular';
      }

      // Safe to spend daily (Net Flow / 30 days)
      const safeToSpendDaily = Math.max(0, (totalIncome - totalSpent) / 30);

      setContext({
        userId: currentUser.id,
        transactions: userTransactions,
        totalIncome,
        totalSpent,
        totalSaved: Math.max(0, totalIncome - totalSpent),
        savingsRate: totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0,
        topCategories,
        spendingPattern,
        transactionCount: userTransactions.length,
        timeRange: 'month',
        isGigWorker,
        incomeVolatility,
        incomeFrequency,
        safeToSpendDaily,
        upcomingBills
      });
    }
  }, [currentUser, transactions]);

  if (!context) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Loading analysis...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AIInsightsDashboard context={context} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
