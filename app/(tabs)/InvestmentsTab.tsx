import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, RefreshControl } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import RiskProfile, { computeRiskScore, riskProfileStorageKey, type RiskLevel } from './RiskProfile';

interface FundRecommendation {
  code: string;
  label: string;
  category: string;
  sipSuggestion: number;
}

interface FundDetail {
  meta: {
    fund_house: string;
    scheme_name: string;
  };
  data: Array<{ date: string; nav: string }>;
}

const FUND_RECOMMENDATIONS: Record<RiskLevel, FundRecommendation[]> = {
  conservative: [
    { code: '119598', label: 'HDFC Liquid Fund - Growth', category: 'Debt / Liquid', sipSuggestion: 3000 },
    { code: '118834', label: 'ICICI Pru Short Term Fund', category: 'Debt / Short Duration', sipSuggestion: 4000 },
  ],
  moderate: [
    { code: '118651', label: 'HDFC Balanced Advantage', category: 'Hybrid / Balanced', sipSuggestion: 5000 },
    { code: '135781', label: 'Axis Growth Opportunities', category: 'Large & Mid Cap', sipSuggestion: 6000 },
  ],
  aggressive: [
    { code: '120464', label: 'Nippon India Small Cap', category: 'Equity / Small Cap', sipSuggestion: 7000 },
    { code: '125354', label: 'Mirae Asset Emerging Bluechip', category: 'Equity / Large & Mid', sipSuggestion: 8000 },
  ],
};

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(60, 60, 67, ${opacity})`,
  propsForDots: {
    r: '3',
    strokeWidth: '1',
    stroke: '#007AFF',
  },
};

async function getRiskLevel(userId: string | number): Promise<RiskLevel> {
  try {
    const raw = await AsyncStorage.getItem(riskProfileStorageKey(userId));
    if (raw) {
      const profile = JSON.parse(raw);
      return computeRiskScore(profile).level;
    }
  } catch {}
  return 'moderate';
}

async function fetchFund(code: string): Promise<FundDetail | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json as FundDetail;
  } catch (e) {
    console.log('mf fetch error', e);
    return null;
  }
}

function computeReturns(data: FundDetail['data']) {
  if (!data || data.length === 0) return { d30: 0, d180: 0, d365: 0 };
  const sorted = [...data].slice(0, 365).reverse(); // latest first
  const latest = parseFloat(sorted[sorted.length - 1].nav);
  const getChange = (days: number) => {
    if (sorted.length < days + 1) return 0;
    const past = parseFloat(sorted[sorted.length - 1 - days].nav);
    return past > 0 ? ((latest - past) / past) * 100 : 0;
  };
  return {
    d30: getChange(30),
    d180: getChange(180),
    d365: getChange(350),
  };
}

interface InvestmentsTabProps {
  userId: string | number;
}

export default function InvestmentsTab({ userId }: InvestmentsTabProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [loading, setLoading] = useState(true);
  const [funds, setFunds] = useState<Record<string, FundDetail | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (level: RiskLevel) => {
    setLoading(true);
    const recs = FUND_RECOMMENDATIONS[level];
    const entries: Record<string, FundDetail | null> = {};
    await Promise.all(recs.map(async (fund) => {
      const detail = await fetchFund(fund.code);
      entries[fund.code] = detail;
    }));
    setFunds(entries);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const level = await getRiskLevel(userId);
      setRiskLevel(level);
      await fetchAll(level);
    })();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(riskLevel);
    setRefreshing(false);
  };

  const recommendedFunds = FUND_RECOMMENDATIONS[riskLevel];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <Text style={styles.title}>Investments</Text>
          <Text style={styles.subtitle}>
            Risk profile: <Text style={{ fontWeight: '700', textTransform: 'uppercase' }}>{riskLevel}</Text>
          </Text>
          <Text style={styles.helper}>Tap to update your preferences.</Text>
          <RiskProfile variant="summary" userId={userId} onRiskLevelChange={async (level) => {
            setRiskLevel(level);
            await fetchAll(level);
          }} />
        </View>

        <View style={styles.quickPanel}>
          <Icon name="trending-up" size={18} color="#34C759" />
          <Text style={styles.quickText}>
            Suggested SIP per fund: ₹{recommendedFunds[0].sipSuggestion.toLocaleString()} - ₹{recommendedFunds[recommendedFunds.length - 1].sipSuggestion.toLocaleString()} per month
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Fetching live NAVs...</Text>
          </View>
        ) : (
          recommendedFunds.map((fund) => {
            const detail = funds[fund.code];
            const returns = detail ? computeReturns(detail.data) : { d30: 0, d180: 0, d365: 0 };
            const chartData = detail ? detail.data.slice(0, 30).reverse() : [];
            return (
              <View key={fund.code} style={styles.fundCard}>
                <View style={styles.fundHeader}>
                  <View>
                    <Text style={styles.fundName}>{fund.label}</Text>
                    <Text style={styles.fundCategory}>{fund.category}</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{riskLevel}</Text>
                  </View>
                </View>
                {detail ? (
                  <Text style={styles.fundHouse}>{detail.meta.fund_house}</Text>
                ) : (
                  <Text style={styles.fundHouse}>Live data unavailable. Showing recommendations only.</Text>
                )}

                <View style={styles.returnsRow}>
                  <View style={styles.returnCell}>
                    <Text style={styles.returnLabel}>1M</Text>
                    <Text style={[styles.returnValue, returns.d30 >= 0 ? styles.green : styles.red]}>{returns.d30.toFixed(2)}%</Text>
                  </View>
                  <View style={styles.returnCell}>
                    <Text style={styles.returnLabel}>6M</Text>
                    <Text style={[styles.returnValue, returns.d180 >= 0 ? styles.green : styles.red]}>{returns.d180.toFixed(2)}%</Text>
                  </View>
                  <View style={styles.returnCell}>
                    <Text style={styles.returnLabel}>1Y</Text>
                    <Text style={[styles.returnValue, returns.d365 >= 0 ? styles.green : styles.red]}>{returns.d365.toFixed(2)}%</Text>
                  </View>
                </View>

                {chartData.length >= 5 && (
                  <LineChart
                    data={{
                      labels: chartData.map((item, idx) => (idx % 6 === 0 ? item.date.split('-').reverse().slice(0, 2).join('/') : '')),
                      datasets: [{ data: chartData.map(item => parseFloat(item.nav)) }],
                    }}
                    width={Math.min(320, styles.chartWidth)}
                    height={180}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                )}

                <View style={styles.sipBox}>
                  <Icon name="calendar" size={16} color="#007AFF" />
                  <Text style={styles.sipText}>
                    Suggested SIP: ₹{fund.sipSuggestion.toLocaleString()} / month • Ideal horizon: {riskLevel === 'conservative' ? '2-3 yrs' : riskLevel === 'moderate' ? '5+ yrs' : '7+ yrs'}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.disclaimer}>
          Data courtesy mfapi.in. This is not investment advice; double-check fund details before investing.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  subtitle: {
    color: '#6c6c70',
    marginTop: 4,
  },
  helper: {
    color: '#8e8e93',
    marginTop: 4,
    fontSize: 12,
  },
  quickPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f8ed',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  quickText: {
    marginLeft: 10,
    color: '#0b8457',
    fontWeight: '600',
  },
  loaderBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#6c6c70',
  },
  fundCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  fundCategory: {
    color: '#8e8e93',
    fontSize: 12,
    marginTop: 2,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 10,
  },
  fundHouse: {
    marginTop: 10,
    color: '#6c6c70',
    fontSize: 13,
  },
  returnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  returnCell: {
    alignItems: 'center',
    flex: 1,
  },
  returnLabel: {
    fontSize: 12,
    color: '#8e8e93',
  },
  returnValue: {
    marginTop: 4,
    fontWeight: '700',
  },
  green: { color: '#34C759' },
  red: { color: '#FF3B30' },
  chart: {
    marginTop: 16,
    borderRadius: 16,
    alignSelf: 'center',
  },
  chartWidth: 320,
  sipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  sipText: {
    marginLeft: 10,
    color: '#1c1c1e',
    flex: 1,
  },
  disclaimer: {
    marginTop: 12,
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'center',
  },
});


