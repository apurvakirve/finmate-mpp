import { Feather as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import InsuranceRecommendationsCard from '../../components/InsuranceRecommendationsCard';
import PersonalityInsightCard from '../../components/PersonalityInsightCard';
import { AIStudioTheme } from '../../constants/aiStudioTheme';
import { AgenticInvestmentCoach, AIFundRecommendation, IncomeAnalysis, InvestmentInsight, PersonalityInvestmentStrategy, PortfolioAnalysis } from '../../lib/AgenticInvestmentCoach';
import { FundSearchResult, FundSearchService } from '../../lib/FundSearchService';
import { generateInsuranceRecommendations, getPersonalityInsuranceAdvice, InsuranceRecommendation, UserInsuranceProfile } from '../../lib/InsuranceRecommendation';
import { getRecommendationsByRiskLevel, InvestmentFund, InvestmentPrediction } from '../../lib/investmentPrediction';
import { PersonalizedRiskProfile, RiskScore, UserFinancialProfile } from '../../lib/PersonalizedRiskProfile';
import { SpiritAnimalType } from '../../types/spiritAnimal';
import RiskProfile, { computeRiskScore, riskProfileStorageKey, type RiskLevel } from './RiskProfile';

interface FundDetail {
  meta: {
    fund_house: string;
    scheme_name: string;
  };
  data: Array<{ date: string; nav: string }>;
}

const chartConfig = {
  backgroundColor: AIStudioTheme.colors.surface,
  backgroundGradientFrom: AIStudioTheme.colors.surface,
  backgroundGradientTo: AIStudioTheme.colors.surfaceVariant,
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(232, 234, 237, ${opacity})`,
  strokeWidth: 3,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: AIStudioTheme.colors.primary,
    fill: AIStudioTheme.colors.surface,
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: AIStudioTheme.colors.border,
    strokeWidth: 1,
  },
};

async function getRiskLevel(userId: string | number): Promise<RiskLevel> {
  try {
    const raw = await AsyncStorage.getItem(riskProfileStorageKey(userId));
    if (raw) {
      const profile = JSON.parse(raw);
      return computeRiskScore(profile).level;
    }
  } catch { }
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

function formatCurrency(amount: number) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface InvestmentsTabProps {
  userId: string | number;
  spiritAnimal?: SpiritAnimalType;
  transactions?: any[];
  monthlyIncome?: number;
}

export default function InvestmentsTab({ userId, spiritAnimal, transactions = [], monthlyIncome = 50000 }: InvestmentsTabProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [loading, setLoading] = useState(true);
  const [funds, setFunds] = useState<Record<string, FundDetail | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  // AI Coach State

  // AI Coach State
  const [aiCoach] = useState(() => new AgenticInvestmentCoach(String(userId)));
  const [aiRecommendations, setAiRecommendations] = useState<AIFundRecommendation[]>([]);
  const [aiInsights, setAiInsights] = useState<InvestmentInsight[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [incomeAnalysis, setIncomeAnalysis] = useState<IncomeAnalysis | null>(null);
  const [selectedFunds, setSelectedFunds] = useState<InvestmentFund[]>([]);

  // Chat State
  const [chatVisible, setChatVisible] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Personality & Insurance State
  const [personalityStrategy, setPersonalityStrategy] = useState<PersonalityInvestmentStrategy | null>(null);
  const [insuranceRecommendations, setInsuranceRecommendations] = useState<InsuranceRecommendation[]>([]);

  // Personalized Risk State
  const [personalizedRiskScore, setPersonalizedRiskScore] = useState<RiskScore | null>(null);
  const [userProfileData, setUserProfileData] = useState<{ age: number; dependents: number; monthlyIncome: number } | null>(null);

  const fetchAll = async (level: RiskLevel) => {
    setLoading(true);

    // 0. Load user's financial profile and calculate personalized risk
    let personalizedRiskLevel: RiskLevel = level;
    let riskScoreData: RiskScore | null = null;

    try {
      const profileKey = riskProfileStorageKey(userId);
      const profileData = await AsyncStorage.getItem(profileKey);

      if (profileData) {
        const profile = JSON.parse(profileData);

        // Convert to UserFinancialProfile format
        const userProfile: UserFinancialProfile = {
          age: profile.age || 25,
          dependents: profile.dependents || 0,
          monthlyIncome: profile.monthlyIncome || 50000,
          monthlyEMI: profile.monthlyEMI || 0,
          emergencyFund: (profile.emergencyFundMonths || 0) * (profile.monthlyIncome || 50000),
          spiritAnimal: spiritAnimal
        };

        // Calculate personalized risk score
        riskScoreData = PersonalizedRiskProfile.calculatePersonalizedRisk(userProfile);
        personalizedRiskLevel = riskScoreData.category;

        // Store for UI display
        setPersonalizedRiskScore(riskScoreData);
        setUserProfileData({
          age: userProfile.age,
          dependents: userProfile.dependents,
          monthlyIncome: userProfile.monthlyIncome
        });
      }
    } catch (e) {
      console.log('Error loading personalized risk profile', e);
    }

    // 1. Get Dynamic Funds using personalized risk level
    let dynamicFundsList: FundSearchResult[] = [];
    try {
      dynamicFundsList = await FundSearchService.getDynamicRecommendations(personalizedRiskLevel, spiritAnimal);
    } catch (e) {
      console.log('Dynamic search failed', e);
    }

    const entries: Record<string, FundDetail | null> = {};
    const historicalDataMap = new Map<string, Array<{ date: string; nav: number }>>();
    const investmentFunds: InvestmentFund[] = [];

    // Helper to calculate returns (CAGR)
    const calculateCAGR = (data: FundDetail['data'], years: number) => {
      if (!data || data.length < years * 250) return 12; // Approx trading days
      const latest = parseFloat(data[0].nav);
      // Find data point approx 'years' ago
      const pastIdx = Math.min(data.length - 1, Math.floor(years * 365));
      const past = parseFloat(data[pastIdx].nav);
      if (past <= 0) return 12;
      return ((Math.pow(latest / past, 1 / years) - 1) * 100);
    };

    // Fetch details for all dynamic funds
    await Promise.all(dynamicFundsList.map(async (fund) => {
      const detail = await fetchFund(fund.code);
      entries[fund.code] = detail;

      if (detail) {
        const history = detail.data.map(d => ({ date: d.date, nav: parseFloat(d.nav) }));
        historicalDataMap.set(fund.code, history);

        // Create InvestmentFund object
        investmentFunds.push({
          id: fund.code,
          code: fund.code,
          name: fund.name,
          type: FundSearchService.inferFundType(fund.name),
          riskLevel: FundSearchService.inferRiskLevel(fund.name),
          minInvestment: 500,
          expectedReturn: calculateCAGR(detail.data, 1), // 1Y CAGR
          category: 'Dynamic',
          expenseRatio: 0.75, // Estimated average
          description: 'A dynamically selected mutual fund that aligns with your investment goals and risk profile.',
          suitability: [level],
          growthFactors: ['Consistent historical returns', 'Professional management'],
          concerns: ['Market volatility risks'],
          lockInPeriod: fund.name.includes('ELSS') ? 3 : 0,
          taxBenefits: fund.name.includes('ELSS')
        });
      }
    }));

    // Fallback to static if no dynamic funds found
    if (investmentFunds.length === 0) {
      const baseFunds = getRecommendationsByRiskLevel(level);
      await Promise.all(baseFunds.map(async (fund) => {
        const detail = await fetchFund(fund.code);
        entries[fund.code] = detail;
        if (detail) {
          historicalDataMap.set(fund.code, detail.data.map(d => ({ date: d.date, nav: parseFloat(d.nav) })));
        }
        investmentFunds.push(fund);
      }));
    }

    setFunds(entries);

    // Analyze Income & Investment Capacity (Mock Data for Demo)
    const mockTransactions = [
      { date: new Date().toISOString(), amount: 85000, type: 'credit' },
      { date: new Date().toISOString(), amount: -15000, type: 'debit' },
      { date: new Date().toISOString(), amount: -5000, type: 'debit' },
      { date: new Date().toISOString(), amount: -8000, type: 'debit' },
    ];
    const mockJarBalance = 15000;

    const incomeAnalysisResult = await aiCoach.analyzeUserIncome(mockTransactions, mockJarBalance);
    setIncomeAnalysis(incomeAnalysisResult);

    // Generate AI recommendations
    const recommendations = await aiCoach.generateRecommendations(
      level,
      incomeAnalysisResult.recommendedMonthlyInvestment,
      historicalDataMap
    );
    // Override recommendations to use our dynamic list if available (since generateRecommendations might pull static)
    const analysis = aiCoach.analyzePortfolio(investmentFunds);
    setPortfolioAnalysis(analysis);

    // Generate insights
    const insights = aiCoach.generateInsights(investmentFunds, analysis);
    setAiInsights(insights);

    // Get personality strategy if spirit animal is available
    if (spiritAnimal) {
      const strategy = aiCoach.getPersonalityStrategy(spiritAnimal);
      setPersonalityStrategy(strategy);
    }

    // Generate insurance recommendations
    const insuranceProfile: UserInsuranceProfile = {
      age: 30, // Default, can be passed as prop
      monthlyIncome: monthlyIncome,
      dependents: 0, // Can be passed as prop
      hasExistingHealth: false,
      hasExistingLife: false,
      monthlyEMI: 0, // Can be calculated from transactions
      emergencyFund: mockJarBalance,
      spiritAnimal: spiritAnimal
    };
    const insurance = generateInsuranceRecommendations(insuranceProfile);
    setInsuranceRecommendations(insurance);

    // Create AI recommendations from investment funds
    const dynamicRecommendations: AIFundRecommendation[] = investmentFunds.map(fund => {
      const history = historicalDataMap.get(fund.code);
      const prediction: InvestmentPrediction = {
        fund: fund,
        predictedGrowth: {
          oneYear: fund.expectedReturn / 100,
          threeYear: fund.expectedReturn * 3 / 100,
          fiveYear: fund.expectedReturn * 5 / 100
        },
        confidence: 85,
        recommendationScore: 85,
        reasons: {
          positive: ['Strong historical performance', 'Matches your risk profile'],
          negative: []
        }
      };

      return {
        fund,
        prediction,
        score: 85,
        reasoning: [`Matches your ${spiritAnimal || level} profile`, 'Consistent returns'],
        tags: ['top-pick', 'high-growth'],
        sipSuggestion: Math.floor(incomeAnalysisResult.recommendedMonthlyInvestment / Math.max(investmentFunds.length, 1)),
        allocationPercentage: 100 / Math.max(investmentFunds.length, 1)
      };
    });

    setAiRecommendations(dynamicRecommendations);
    setSelectedFunds(investmentFunds);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const level = await getRiskLevel(userId);
      setRiskLevel(level);
      await aiCoach.initialize(level);
      await fetchAll(level);
    })();
  }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll(riskLevel);
    setRefreshing(false);
  };

  const handleAskQuestion = async (question: string) => {
    setChatLoading(true);
    setChatQuestion(question);
    const response = await aiCoach.answerQuestion(question, {
      selectedFunds,
      riskLevel,
      spiritAnimal,
    });
    setChatResponse(response);
    setChatLoading(false);
  };

  const getInsightIcon = (type: InvestmentInsight['type']) => {
    switch (type) {
      case 'kudos': return 'award';
      case 'warning': return 'alert-triangle';
      case 'alert': return 'alert-circle';
      default: return 'info';
    }
  };

  const getInsightColor = (type: InvestmentInsight['type']) => {
    switch (type) {
      case 'kudos': return '#34C759';
      case 'warning': return '#FF9500';
      case 'alert': return '#FF3B30';
      default: return '#007AFF';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'top-pick': return '#34C759';
      case 'high-growth': return '#FF9500';
      case 'rising-star': return '#AF52DE';
      default: return '#007AFF';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Investments</Text>
              <Text style={styles.subtitle}>
                Risk profile: <Text style={{ fontWeight: '700', textTransform: 'uppercase' }}>{riskLevel}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.aiButton} onPress={() => setChatVisible(true)}>
              <Icon name="message-circle" size={20} color="#007AFF" />
              <Text style={styles.aiButtonText}>AI Chat</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helper}>Tap to update your preferences.</Text>
          <RiskProfile variant="summary" userId={userId} onRiskLevelChange={async (level) => {
            setRiskLevel(level);
            await aiCoach.initialize(level);
            await fetchAll(level);
          }} />
        </View>

        {/* Personality Strategy Card */}
        {spiritAnimal && personalityStrategy && (
          <PersonalityInsightCard
            spiritAnimal={spiritAnimal}
            strategy={personalityStrategy}
          />
        )}

        {/* Insurance Recommendations */}
        {insuranceRecommendations.length > 0 && (
          <InsuranceRecommendationsCard
            recommendations={insuranceRecommendations}
            onLearnMore={(insurance) => {
              Alert.alert(
                insurance.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                `Coverage: ₹${(insurance.suggestedCoverage / 100000).toFixed(0)} lakhs\n` +
                `Premium: ₹${insurance.monthlyPremium}/month\n\n` +
                `Benefits:\n${insurance.benefits.map(b => `• ${b}`).join('\n')}\n\n` +
                `${spiritAnimal ? getPersonalityInsuranceAdvice(spiritAnimal) : ''}`,
                [{ text: 'Got it' }]
              );
            }}
          />
        )}

        {/* Income Analysis Card */}
        {incomeAnalysis && (
          <View style={styles.incomeCard}>
            <View style={styles.incomeHeader}>
              <Icon name="activity" size={20} color="#007AFF" />
              <Text style={styles.incomeTitle}>Smart Investment Plan</Text>
            </View>
            <Text style={styles.incomeText}>
              Based on your monthly savings of <Text style={{ fontWeight: '700' }}>₹{formatCurrency(incomeAnalysis.averageMonthlySavings)}</Text>,
              we recommend investing <Text style={{ fontWeight: '700', color: '#34C759' }}>₹{formatCurrency(incomeAnalysis.recommendedMonthlyInvestment)}/month</Text>.
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(100, (incomeAnalysis.recommendedMonthlyInvestment / incomeAnalysis.averageMonthlySavings) * 100)}%` }]} />
            </View>
            <Text style={styles.incomeSubtext}>
              {incomeAnalysis.canAfford ? '✅ Within your budget' : '⚠️ Exceeds current savings'}
            </Text>
          </View>
        )}

        {/* Portfolio Analysis Dashboard */}
        {portfolioAnalysis && (
          <>
            <View style={styles.dashboardCard}>
              <View style={styles.dashboardHeader}>
                <Icon name="trending-up" size={24} color="#007AFF" />
                <Text style={styles.dashboardTitle}>Portfolio Health</Text>
              </View>

              <View style={styles.healthRow}>
                <View style={[styles.healthMetric, styles.healthMetricPrimary]}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.healthScore}>{portfolioAnalysis.healthScore}</Text>
                    <Text style={styles.scoreOutOf}>/100</Text>
                  </View>
                  <Text style={styles.healthLabel}>Health Score</Text>
                  <Text style={styles.healthSubtext}>
                    {portfolioAnalysis.healthScore >= 80 ? 'Excellent' :
                      portfolioAnalysis.healthScore >= 60 ? 'Good' :
                        portfolioAnalysis.healthScore >= 40 ? 'Fair' : 'Needs Attention'}
                  </Text>
                </View>

                <View style={styles.metricsColumn}>
                  <View style={styles.miniMetric}>
                    <View style={styles.miniMetricHeader}>
                      <Icon name="pie-chart" size={16} color="#34C759" />
                      <Text style={styles.miniMetricValue}>{portfolioAnalysis.diversificationScore}</Text>
                    </View>
                    <Text style={styles.miniMetricLabel}>Diversification</Text>
                  </View>

                  <View style={styles.miniMetric}>
                    <View style={styles.miniMetricHeader}>
                      <Icon
                        name={portfolioAnalysis.riskAlignment === 'aligned' ? 'check-circle' : 'alert-circle'}
                        size={16}
                        color={portfolioAnalysis.riskAlignment === 'aligned' ? '#34C759' : '#FF9500'}
                      />
                      <Text style={[styles.miniMetricValue, {
                        color: portfolioAnalysis.riskAlignment === 'aligned' ? '#34C759' : '#FF9500'
                      }]}>
                        {portfolioAnalysis.riskAlignment === 'aligned' ? 'Aligned' : 'Mismatch'}
                      </Text>
                    </View>
                    <Text style={styles.miniMetricLabel}>Risk Profile</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {/* AI Insights Panel */}
        {aiInsights.length > 0 && (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            {aiInsights.slice(0, 3).map((insight, idx) => (
              <View key={idx} style={[styles.insightCard, { borderLeftColor: getInsightColor(insight.type) }]}>
                <View style={styles.insightHeader}>
                  <Icon name={getInsightIcon(insight.type)} size={18} color={getInsightColor(insight.type)} />
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightMessage}>{insight.message}</Text>
              </View>
            ))}
          </View>
        )}

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Analyzing funds with AI...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>AI Recommended Funds</Text>
            {aiRecommendations.map((recommendation) => {
              const detail = funds[recommendation.fund.code];
              const returns = detail ? computeReturns(detail.data) : { d30: 0, d180: 0, d365: 0 };
              const chartData = detail ? detail.data.slice(0, 30).reverse() : [];

              return (
                <View key={recommendation.fund.id} style={styles.fundCard}>
                  {/* AI Tags */}
                  {recommendation.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                      {recommendation.tags.map((tag, idx) => (
                        <View key={idx} style={[styles.tag, { backgroundColor: getTagColor(tag) + '15', borderColor: getTagColor(tag) + '40' }]}>
                          <Icon name="zap" size={10} color={getTagColor(tag)} />
                          <Text style={[styles.tagText, { color: getTagColor(tag) }]}>
                            {tag.replace('-', ' ').toUpperCase()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.fundHeader}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.fundName} numberOfLines={2} ellipsizeMode="tail">
                        {recommendation.fund.name}
                      </Text>
                      <Text style={styles.fundCategory}>{recommendation.fund.category}</Text>
                    </View>
                    <View style={[styles.scoreBox, { backgroundColor: recommendation.score >= 85 ? '#E3F8ED' : '#E3F2FD' }]}>
                      <Icon name="star" size={16} color={recommendation.score >= 85 ? '#34C759' : '#007AFF'} />
                      <Text style={[styles.scoreValue, { color: recommendation.score >= 85 ? '#34C759' : '#007AFF' }]}>
                        {Math.round(recommendation.score)}
                      </Text>
                      <Text style={[styles.scoreLabel, { color: recommendation.score >= 85 ? '#34C759' : '#007AFF' }]}>AI Score</Text>
                    </View>
                  </View>

                  <View style={styles.chartContainer}>
                    {chartData.length > 0 ? (
                      <LineChart
                        data={{
                          labels: [],
                          datasets: [{
                            data: chartData.map(d => {
                              const val = parseFloat(d.nav);
                              return isNaN(val) ? 0 : val;
                            })
                          }]
                        }}
                        width={Dimensions.get('window').width - 80}
                        height={100}
                        withDots={false}
                        withInnerLines={false}
                        withOuterLines={false}
                        withVerticalLabels={false}
                        withHorizontalLabels={false}
                        chartConfig={{
                          ...chartConfig,
                          color: (opacity = 1) => recommendation.score >= 85 ? `rgba(52, 199, 89, ${opacity})` : `rgba(138, 180, 248, ${opacity})`,
                          backgroundGradientFrom: AIStudioTheme.colors.surface,
                          backgroundGradientTo: AIStudioTheme.colors.surfaceVariant,
                        }}
                        bezier
                        style={{ paddingRight: 0, paddingLeft: 0 }}
                      />
                    ) : (
                      <View style={{ height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: AIStudioTheme.colors.surfaceVariant, borderRadius: 12 }}>
                        <Text style={{ color: AIStudioTheme.colors.textMuted, fontSize: 12 }}>Chart data unavailable</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.reasoningBox}>
                    <Text style={styles.reasoningTitle}>Why this fund?</Text>
                    {recommendation.reasoning.slice(0, 2).map((reason, idx) => (
                      <View key={idx} style={styles.reasonRow}>
                        <Icon name="check" size={14} color="#34C759" />
                        <Text style={styles.reasonText}>{reason}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.returnsRow}>
                    <View style={styles.returnCell}>
                      <Text style={styles.returnLabel}>1M</Text>
                      <Text style={[styles.returnValue, returns.d30 >= 0 ? styles.green : styles.red]}>
                        {returns.d30.toFixed(2)}%
                      </Text>
                    </View>
                    <View style={styles.returnCell}>
                      <Text style={styles.returnLabel}>6M</Text>
                      <Text style={[styles.returnValue, returns.d180 >= 0 ? styles.green : styles.red]}>
                        {returns.d180.toFixed(2)}%
                      </Text>
                    </View>
                    <View style={styles.returnCell}>
                      <Text style={styles.returnLabel}>1Y</Text>
                      <Text style={[styles.returnValue, returns.d365 >= 0 ? styles.green : styles.red]}>
                        {returns.d365.toFixed(2)}%
                      </Text>
                    </View>
                    <View style={styles.returnCell}>
                      <Text style={styles.returnLabel}>Predicted 1Y</Text>
                      <Text style={[styles.returnValue, styles.green]}>
                        +{Math.round(recommendation.prediction.predictedGrowth.oneYear * 100)}%
                      </Text>
                    </View>
                  </View>

                  {/* Smart SIP Suggestion */}
                  <View style={styles.sipContainer}>
                    <View style={styles.sipHeader}>
                      <Icon name="trending-up" size={16} color="#007AFF" />
                      <Text style={styles.sipTitle}>Recommended SIP</Text>
                    </View>
                    <View style={styles.sipRow}>
                      <Text style={styles.sipAmount}>₹{recommendation.sipSuggestion}</Text>
                      <Text style={styles.sipFrequency}>/ month</Text>
                      {recommendation.allocationPercentage && (
                        <View style={styles.allocationBadge}>
                          <Text style={styles.allocationText}>{recommendation.allocationPercentage}% of budget</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity style={styles.investButton}>
                    <Text style={styles.investButtonText}>Invest Now</Text>
                    <Icon name="arrow-right" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* AI Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Investment Coach</Text>
            <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeButton}>
              <Icon name="x" size={24} color="#1c1c1e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatContent}>
            <View style={styles.chatMessage}>
              <View style={styles.botAvatar}>
                <Icon name="cpu" size={20} color="white" />
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  Hello! I'm your personal investment coach. I've analyzed your portfolio and market trends. Ask me anything about your investments!
                </Text>
              </View>
            </View>

            {chatQuestion ? (
              <View style={[styles.chatMessage, styles.userMessageRow]}>
                <View style={[styles.messageBubble, styles.userBubble]}>
                  <Text style={[styles.messageText, styles.userMessageText]}>{chatQuestion}</Text>
                </View>
              </View>
            ) : null}

            {chatLoading ? (
              <View style={styles.chatMessage}>
                <View style={styles.botAvatar}>
                  <Icon name="cpu" size={20} color="white" />
                </View>
                <View style={[styles.messageBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.messageText}>Thinking...</Text>
                </View>
              </View>
            ) : chatResponse ? (
              <View style={styles.chatMessage}>
                <View style={styles.botAvatar}>
                  <Icon name="cpu" size={20} color="white" />
                </View>
                <View style={styles.messageBubble}>
                  <Text style={styles.messageText}>{chatResponse}</Text>
                </View>
              </View>
            ) : null}

            {!chatQuestion && (
              <View style={styles.suggestions}>
                <Text style={styles.suggestionsTitle}>Try asking:</Text>
                {['Is my portfolio diversified?', 'Why should I invest in gold?', 'What is a liquid fund?'].map((q, i) => (
                  <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => handleAskQuestion(q)}>
                    <Text style={styles.suggestionText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a question..."
              value={chatQuestion}
              onChangeText={setChatQuestion}
              onSubmitEditing={() => handleAskQuestion(chatQuestion)}
            />
            <TouchableOpacity
              style={[styles.sendButton, !chatQuestion && styles.sendButtonDisabled]}
              onPress={() => handleAskQuestion(chatQuestion)}
              disabled={!chatQuestion}
            >
              <Icon name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  subtitle: {
    color: AIStudioTheme.colors.textSecondary,
    marginTop: 4,
  },
  helper: {
    color: AIStudioTheme.colors.textMuted,
    marginTop: 4,
    fontSize: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  aiButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
  incomeCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  incomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  incomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  incomeText: {
    fontSize: 14,
    color: AIStudioTheme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  incomeSubtext: {
    fontSize: 12,
    color: AIStudioTheme.colors.textSecondary,
    fontStyle: 'italic',
  },
  dashboardCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AIStudioTheme.colors.text,
  },
  healthRow: {
    flexDirection: 'row',
    gap: 16,
  },
  healthMetric: {
    alignItems: 'center',
  },
  healthMetricPrimary: {
    flex: 1,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  healthScore: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scoreOutOf: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  healthLabel: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  healthSubtext: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 4,
  },
  metricsColumn: {
    flex: 1,
    gap: 12,
  },
  miniMetric: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  miniMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  miniMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  miniMetricLabel: {
    fontSize: 12,
    color: AIStudioTheme.colors.textSecondary,
  },
  insightsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: AIStudioTheme.colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  insightMessage: {
    fontSize: 14,
    color: AIStudioTheme.colors.textSecondary,
    lineHeight: 20,
  },
  fundCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: AIStudioTheme.colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  fundName: {
    fontSize: 18,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  fundCategory: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '500',
  },
  scoreBox: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 70,
    borderWidth: 1.5,
    borderColor: AIStudioTheme.colors.border,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  reasoningBox: {
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  returnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 12,
  },
  returnCell: {
    alignItems: 'center',
  },
  returnLabel: {
    fontSize: 11,
    color: AIStudioTheme.colors.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  returnValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  green: { color: '#34C759' },
  red: { color: '#FF3B30' },
  sipContainer: {
    backgroundColor: AIStudioTheme.colors.surfaceVariant,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  sipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  sipRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  sipAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#007AFF',
  },
  sipFrequency: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    fontWeight: '500',
  },
  allocationBadge: {
    backgroundColor: AIStudioTheme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  allocationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#007AFF',
  },
  investButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  investButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  loaderBox: {
    padding: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: AIStudioTheme.colors.textSecondary,
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: AIStudioTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AIStudioTheme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  closeButton: {
    padding: 4,
  },
  chatContent: {
    flex: 1,
    padding: 16,
  },
  chatMessage: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  userMessageRow: {
    flexDirection: 'row-reverse',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    flex: 1,
    backgroundColor: AIStudioTheme.colors.surface,
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: '80%',
    shadowColor: AIStudioTheme.colors.text,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#1c1c1e',
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  suggestions: {
    marginTop: 20,
    marginBottom: 40,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c6c70',
    marginBottom: 12,
    marginLeft: 4,
  },
  suggestionChip: {
    backgroundColor: AIStudioTheme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: AIStudioTheme.colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: AIStudioTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea',
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d1d6',
  },
  dynamicSection: {
    marginBottom: 24,
  },
  dynamicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dynamicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AIStudioTheme.colors.text,
  },
  dynamicSubtitle: {
    fontSize: 13,
    color: AIStudioTheme.colors.textSecondary,
    marginBottom: 12,
  },
  dynamicCard: {
    backgroundColor: AIStudioTheme.colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 160,
    height: 110,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(175, 82, 222, 0.2)', // Purple tint
    shadowColor: '#AF52DE',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dynamicFundName: {
    fontSize: 12,
    fontWeight: '600',
    color: AIStudioTheme.colors.text,
    lineHeight: 16,
  },
  dynamicBadge: {
    backgroundColor: 'rgba(175, 82, 222, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dynamicBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#AF52DE',
  },
});
