interface FundDetail {
  meta: {
    fund_house: string;
    scheme_name: string;
  };
  data: Array<{ date: string; nav: string }>;
}

const chartConfig = {
  backgroundColor: '#F8FAFC',
  backgroundGradientFrom: '#F0F9FF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(28, 28, 30, ${opacity})`,
  strokeWidth: 3,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#007AFF',
    fill: '#FFFFFF',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#E5E7EB',
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

interface InvestmentsTabProps {
  userId: string | number;
}

export default function InvestmentsTab({ userId }: InvestmentsTabProps) {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('moderate');
  const [loading, setLoading] = useState(true);
  const [funds, setFunds] = useState<Record<string, FundDetail | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  // AI Coach State
  const [aiCoach] = useState(() => new AgenticInvestmentCoach(String(userId)));
  const [aiRecommendations, setAiRecommendations] = useState<AIFundRecommendation[]>([]);
  const [aiInsights, setAiInsights] = useState<InvestmentInsight[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [selectedFunds, setSelectedFunds] = useState<InvestmentFund[]>([]);

  // Chat State
  const [chatVisible, setChatVisible] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const fetchAll = async (level: RiskLevel) => {
    setLoading(true);

    // Get AI-powered recommendations
    const baseFunds = getRecommendationsByRiskLevel(level);
    const entries: Record<string, FundDetail | null> = {};
    const historicalDataMap = new Map<string, Array<{ date: string; nav: number }>>();

    await Promise.all(baseFunds.map(async (fund) => {
      const detail = await fetchFund(fund.code);
      entries[fund.code] = detail;
      if (detail) {
        historicalDataMap.set(fund.code, detail.data.map(d => ({ date: d.date, nav: parseFloat(d.nav) })));
      }
    }));

    setFunds(entries);

    // Generate AI recommendations
    const recommendations = await aiCoach.generateRecommendations(level, historicalDataMap);
    setAiRecommendations(recommendations);

    // Analyze portfolio (using recommended funds as selected for demo)
    const analysis = aiCoach.analyzePortfolio(baseFunds);
    setPortfolioAnalysis(analysis);

    // Generate insights
    const insights = aiCoach.generateInsights(baseFunds, analysis);
    setAiInsights(insights);

    setSelectedFunds(baseFunds);
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

            {/* Portfolio Allocation Pie Chart */}
            {Object.values(portfolioAnalysis.allocationBreakdown).some(v => v > 0) && (
              <View style={styles.allocationCard}>
                <View style={styles.allocationHeader}>
                  <Icon name="pie-chart" size={20} color="#007AFF" />
                  <Text style={styles.allocationTitle}>Asset Allocation</Text>
                </View>

                <PieChart
                  data={[
                    { name: 'Equity', population: portfolioAnalysis.allocationBreakdown.equity, color: '#007AFF', legendFontColor: '#1c1c1e' },
                    { name: 'Debt', population: portfolioAnalysis.allocationBreakdown.debt, color: '#34C759', legendFontColor: '#1c1c1e' },
                    { name: 'Gold', population: portfolioAnalysis.allocationBreakdown.gold, color: '#FFD700', legendFontColor: '#1c1c1e' },
                    { name: 'Hybrid', population: portfolioAnalysis.allocationBreakdown.hybrid, color: '#AF52DE', legendFontColor: '#1c1c1e' },
                    { name: 'Liquid', population: portfolioAnalysis.allocationBreakdown.liquid, color: '#5AC8FA', legendFontColor: '#1c1c1e' },
                  ].filter(item => item.population > 0)}
                  width={Dimensions.get('window').width - 60}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  hasLegend={true}
                  style={styles.pieChart}
                />
              </View>
            )}
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
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fundName}>{recommendation.fund.name}</Text>
                      <Text style={styles.fundCategory}>{recommendation.fund.category}</Text>
                    </View>
                    <View style={[styles.scoreBox, { backgroundColor: recommendation.score >= 85 ? '#E3F8ED' : '#E3F2FD' }]}>
                      <Icon name="star" size={16} color={recommendation.score >= 85 ? '#34C759' : '#007AFF'} />
                      <Text style={[styles.scoreValue, { color: recommendation.score >= 85 ? '#34C759' : '#007AFF' }]}>{recommendation.score}</Text>
                      <Text style={[styles.scoreLabel, { color: recommendation.score >= 85 ? '#34C759' : '#007AFF' }]}>AI Score</Text>
                    </View>
                  </View>

                  {detail && <Text style={styles.fundHouse}>{detail.meta.fund_house}</Text>}

                  {/* AI Reasoning */}
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
                        {(recommendation.prediction.predictedGrowth.oneYear * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {chartData.length >= 5 && (
                    <LineChart
                      data={{
                        labels: chartData.map((item, idx) => (idx % 6 === 0 ? item.date.split('-').reverse().slice(0, 2).join('/') : '')),
                        datasets: [{
                          data: chartData.map(item => parseFloat(item.nav)),
                          strokeWidth: 3,
                        }],
                      }}
                      width={Dimensions.get('window').width - 60}
                      height={200}
                      chartConfig={chartConfig}
                      bezier
                      withInnerLines={true}
                      withOuterLines={false}
                      withVerticalLines={false}
                      withHorizontalLines={true}
                      style={styles.chart}
                    />
                  )}

                  <View style={styles.sipBox}>
                    <Icon name="calendar" size={16} color="#007AFF" />
                    <Text style={styles.sipText}>
                      AI Suggested SIP: ₹{recommendation.sipSuggestion.toLocaleString()} / month •
                      Confidence: {recommendation.prediction.confidence}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.disclaimer}>
          Data courtesy mfapi.in. AI recommendations are for informational purposes only. Please consult a financial advisor before investing.
        </Text>
      </ScrollView>

      {/* Floating AI Chat Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => setChatVisible(true)}
      >
        <Icon name="message-circle" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* AI Chat Modal */}
      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.chatOverlay}>
          <View style={styles.chatModal}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>AI Investment Assistant</Text>
              <TouchableOpacity onPress={() => setChatVisible(false)}>
                <Icon name="x" size={24} color="#6c6c70" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatContent}>
              <Text style={styles.chatWelcome}>
                Hi! I'm your AI investment assistant. Ask me anything about investments, diversification, or fund selection.
              </Text>

              {/* Quick Questions */}
              <View style={styles.quickQuestions}>
                <Text style={styles.quickTitle}>Quick Questions:</Text>
                {[
                  'How should I diversify?',
                  'Is this a good time to invest?',
                  'What is my risk profile?',
                  'How much should I invest monthly?',
                ].map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickButton}
                    onPress={() => handleAskQuestion(q)}
                  >
                    <Text style={styles.quickButtonText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {chatResponse && (
                <View style={styles.chatResponseBox}>
                  <Icon name="cpu" size={20} color="#007AFF" />
                  <Text style={styles.chatResponseText}>{chatResponse}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask me anything..."
                value={chatQuestion}
                onChangeText={setChatQuestion}
                onSubmitEditing={() => {
                  if (chatQuestion.trim()) {
                    handleAskQuestion(chatQuestion);
                  }
                }}
              />
              <TouchableOpacity
                style={styles.chatSendButton}
                onPress={() => {
                  if (chatQuestion.trim()) {
                    handleAskQuestion(chatQuestion);
                  }
                }}
                disabled={chatLoading}
              >
                {chatLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: 'white',
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
  dashboardCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#1c1c1e',
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
    color: '#6c6c70',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  miniMetricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  miniMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  miniMetricLabel: {
    fontSize: 11,
    color: '#8e8e93',
    fontWeight: '600',
  },
  alignmentBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  allocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  allocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  allocationTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1c1e',
  },
  pieChart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  insightsContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  insightMessage: {
    fontSize: 13,
    color: '#6c6c70',
    lineHeight: 18,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  tagText: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fundName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1c1e',
    lineHeight: 22,
  },
  fundCategory: {
    color: '#8e8e93',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  scoreBox: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 70,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  scoreValue: {
    fontSize: 22,
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
  fundHouse: {
    marginTop: 4,
    marginBottom: 12,
    color: '#6c6c70',
    fontSize: 13,
  },
  reasoningBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  reasoningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#6c6c70',
    lineHeight: 16,
  },
  returnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  returnCell: {
    alignItems: 'center',
    flex: 1,
  },
  returnLabel: {
    fontSize: 11,
    color: '#8e8e93',
  },
  returnValue: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 13,
  },
  green: { color: '#34C759' },
  red: { color: '#FF3B30' },
  chart: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 20,
    alignSelf: 'center',
    shadowColor: '#007AFF',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  sipText: {
    marginLeft: 10,
    color: '#1c1c1e',
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  disclaimer: {
    marginTop: 12,
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  chatOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f7',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c1e',
  },
  chatContent: {
    padding: 20,
    maxHeight: 400,
  },
  chatWelcome: {
    fontSize: 14,
    color: '#6c6c70',
    marginBottom: 16,
    lineHeight: 20,
  },
  quickQuestions: {
    marginBottom: 16,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1c1e',
    marginBottom: 8,
  },
  quickButton: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  chatResponseBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 12,
  },
  chatResponseText: {
    flex: 1,
    fontSize: 13,
    color: '#1c1c1e',
    lineHeight: 18,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f7',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  chatSendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
