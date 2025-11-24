import { Feather as Icon } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { AIFinancialAnalyzer } from '../lib/aiFinancialAnalyzer';
import { AIInsights, FinancialContext } from '../types/aiInsights';
import AnomalyAlert from './AnomalyAlert';
import BudgetRebalanceCard from './BudgetRebalanceCard';
import PersonalizedRuleCard from './PersonalizedRuleCard';
import PredictionCard from './PredictionCard';
import SpendingPatternCard from './SpendingPatternCard';
import SpendingReductionCard from './SpendingReductionCard';

interface AIInsightsDashboardProps {
    context: FinancialContext;
    onRefresh?: () => void;
}

export default function AIInsightsDashboard({ context, onRefresh }: AIInsightsDashboardProps) {
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'anomalies' | 'coaching' | 'patterns' | 'rebalancing' | 'reduction' | 'rules'>('overview');

    useEffect(() => {
        loadInsights();
    }, [context.userId]);

    const loadInsights = async (forceRefresh: boolean = false) => {
        try {
            setLoading(true);
            const result = await AIFinancialAnalyzer.analyzeFinances(context, forceRefresh);
            setInsights(result);
        } catch (error) {
            console.error('Error loading AI insights:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadInsights(true);
        onRefresh?.();
    };

    if (loading && !insights) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AIStudioTheme.colors.primary} />
                <Text style={styles.loadingText}>Analyzing your finances with AI...</Text>
            </View>
        );
    }

    if (!insights) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="alert-circle" size={48} color={AIStudioTheme.colors.textMuted} />
                <Text style={styles.emptyText}>Unable to load AI insights</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => loadInsights(true)}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>AI Financial Insights</Text>
                    <Text style={styles.subtitle}>
                        {insights.confidence}% confidence • Updated {new Date().toLocaleTimeString()} (v2)
                    </Text>
                </View>
                <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
                    <Icon name="refresh-cw" size={20} color={AIStudioTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
                {(['overview', 'predictions', 'anomalies', 'coaching', 'patterns', 'rebalancing', 'reduction', 'rules'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.activeTab]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                        {tab === 'anomalies' && insights.anomalies.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{insights.anomalies.length}</Text>
                            </View>
                        )}
                        {tab === 'rules' && insights.personalizedRules.filter(r => !r.approved).length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{insights.personalizedRules.filter(r => !r.approved).length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                    <View>
                        {/* Top Predictions - Prominent */}
                        {insights.predictions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Top Predictions</Text>
                                {insights.predictions.slice(0, 2).map((prediction, index) => (
                                    <PredictionCard key={index} prediction={prediction} />
                                ))}
                            </View>
                        )}

                        {/* Spending Trend Chart */}
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Spending Trend</Text>
                            <LineChart
                                data={{
                                    labels: ["W1", "W2", "W3", "W4"],
                                    datasets: [{
                                        data: [
                                            context.totalSpent * 0.2,
                                            context.totalSpent * 0.3,
                                            context.totalSpent * 0.25,
                                            context.totalSpent * 0.25
                                        ]
                                    }]
                                }}
                                width={Dimensions.get("window").width - 32}
                                height={220}
                                yAxisLabel="₹"
                                chartConfig={{
                                    backgroundColor: AIStudioTheme.colors.surface,
                                    backgroundGradientFrom: AIStudioTheme.colors.surface,
                                    backgroundGradientTo: AIStudioTheme.colors.surfaceVariant,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(232, 234, 237, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "6", strokeWidth: "2", stroke: AIStudioTheme.colors.primary }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        </View>

                        {/* Category Breakdown Chart */}
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>Category Breakdown</Text>
                            <PieChart
                                data={context.topCategories.map((c, i) => ({
                                    name: c.category,
                                    population: c.amount,
                                    color: [AIStudioTheme.colors.primary, AIStudioTheme.colors.accent, AIStudioTheme.colors.warning, AIStudioTheme.colors.success, '#9966FF'][i % 5],
                                    legendFontColor: AIStudioTheme.colors.textSecondary,
                                    legendFontSize: 12
                                }))}
                                width={Dimensions.get("window").width - 32}
                                height={220}
                                chartConfig={{
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        </View>

                        {/* Quick Stats */}
                        <View style={styles.statsGrid}>
                            {/* Gig Worker Specific Cards */}
                            {context.isGigWorker && (
                                <>
                                    <View style={[styles.statCard, styles.highlightCard]}>
                                        <Icon name="activity" size={24} color="#8B5CF6" />
                                        <Text style={styles.statValue}>
                                            {context.incomeVolatility ? 'High' : 'Stable'}
                                        </Text>
                                        <Text style={styles.statLabel}>Income Volatility</Text>
                                    </View>
                                    <View style={[styles.statCard, styles.highlightCard]}>
                                        <Icon name="shield" size={24} color="#10B981" />
                                        <Text style={styles.statValue}>
                                            ₹{context.safeToSpendDaily ? context.safeToSpendDaily.toFixed(0) : '0'}
                                        </Text>
                                        <Text style={styles.statLabel}>Safe to Spend/Day</Text>
                                    </View>
                                </>
                            )}

                            <View style={styles.statCard}>
                                <Icon name="trending-up" size={24} color="#10B981" />
                                <Text style={styles.statValue}>{insights.patterns.length}</Text>
                                <Text style={styles.statLabel}>Patterns</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Icon name="zap" size={24} color="#F59E0B" />
                                <Text style={styles.statValue}>{insights.predictions.length}</Text>
                                <Text style={styles.statLabel}>Predictions</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Icon name="alert-triangle" size={24} color="#EF4444" />
                                <Text style={styles.statValue}>{insights.anomalies.length}</Text>
                                <Text style={styles.statLabel}>Anomalies</Text>
                            </View>
                            <View style={styles.statCard}>
                                <Icon name="message-circle" size={24} color="#3B82F6" />
                                <Text style={styles.statValue}>{insights.coaching.length}</Text>
                                <Text style={styles.statLabel}>Tips</Text>
                            </View>
                        </View>

                        {/* Recent Anomalies */}
                        {insights.anomalies.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Recent Anomalies</Text>
                                {insights.anomalies.slice(0, 2).map((anomaly, index) => (
                                    <AnomalyAlert key={index} anomaly={anomaly} />
                                ))}
                            </View>
                        )}

                        {/* Spending Patterns */}
                        {insights.patterns.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Spending Patterns</Text>
                                {insights.patterns.slice(0, 3).map((pattern, index) => (
                                    <View key={index} style={styles.patternCard}>
                                        <View style={styles.patternHeader}>
                                            <Text style={styles.patternCategory}>{pattern.category}</Text>
                                            <View style={[
                                                styles.trendBadge,
                                                { backgroundColor: pattern.trend === 'rising' ? '#FEE2E2' : pattern.trend === 'falling' ? '#D1FAE5' : '#E5E7EB' }
                                            ]}>
                                                <Icon
                                                    name={pattern.trend === 'rising' ? 'trending-up' : pattern.trend === 'falling' ? 'trending-down' : 'minus'}
                                                    size={12}
                                                    color={pattern.trend === 'rising' ? '#DC2626' : pattern.trend === 'falling' ? '#10B981' : '#6B7280'}
                                                />
                                                <Text style={[
                                                    styles.trendText,
                                                    { color: pattern.trend === 'rising' ? '#DC2626' : pattern.trend === 'falling' ? '#10B981' : '#6B7280' }
                                                ]}>
                                                    {pattern.trend}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={styles.patternInsight}>{pattern.insight}</Text>
                                        <View style={styles.patternStats}>
                                            <Text style={styles.patternStat}>Current: ₹{pattern.currentAmount.toFixed(0)}</Text>
                                            <Text style={styles.patternStat}>7-day avg: ₹{pattern.avg7Days.toFixed(0)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Budget Rebalancing */}
                        {insights.rebalancing && insights.rebalancing.suggestions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Budget Rebalancing</Text>
                                <View style={styles.rebalanceCard}>
                                    <Text style={styles.rebalanceMessage}>{insights.rebalancing.message}</Text>
                                    {insights.rebalancing.suggestions.map((suggestion, index) => (
                                        <View key={index} style={styles.rebalanceItem}>
                                            <View style={styles.rebalanceFlow}>
                                                <Text style={styles.rebalanceCategory}>{suggestion.fromCategory}</Text>
                                                <Icon name="arrow-right" size={16} color="#6B7280" />
                                                <Text style={styles.rebalanceCategory}>{suggestion.toCategory}</Text>
                                            </View>
                                            <Text style={styles.rebalanceAmount}>₹{suggestion.amount.toLocaleString('en-IN')}</Text>
                                            <Text style={styles.rebalanceReason}>{suggestion.reason}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Predictions Tab */}
                {selectedTab === 'predictions' && (
                    <View>
                        {insights.predictions.length > 0 ? (
                            insights.predictions.map((prediction, index) => (
                                <PredictionCard key={index} prediction={prediction} />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="check-circle" size={48} color="#10B981" />
                                <Text style={styles.emptyStateText}>No predictions at this time</Text>
                                <Text style={styles.emptyStateSubtext}>Your spending is on track!</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Anomalies Tab */}
                {selectedTab === 'anomalies' && (
                    <View>
                        {insights.anomalies.length > 0 ? (
                            insights.anomalies.map((anomaly, index) => (
                                <AnomalyAlert key={index} anomaly={anomaly} />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="shield" size={48} color="#10B981" />
                                <Text style={styles.emptyStateText}>No anomalies detected</Text>
                                <Text style={styles.emptyStateSubtext}>All transactions look normal</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Coaching Tab */}
                {selectedTab === 'coaching' && (
                    <View>
                        {insights.coaching.length > 0 ? (
                            insights.coaching.map((advice, index) => (
                                <View key={index} style={styles.coachingCard}>
                                    <View style={styles.coachingHeader}>
                                        <Icon
                                            name={
                                                advice.type === 'kudos' ? 'award' :
                                                    advice.type === 'warning' ? 'alert-triangle' :
                                                        advice.type === 'action' ? 'zap' : 'info'
                                            }
                                            size={24}
                                            color={
                                                advice.type === 'kudos' ? '#10B981' :
                                                    advice.type === 'warning' ? '#F59E0B' :
                                                        advice.type === 'action' ? '#3B82F6' : '#6B7280'
                                            }
                                        />
                                        <Text style={styles.coachingTitle}>{advice.title}</Text>
                                    </View>
                                    <Text style={styles.coachingMessage}>{advice.message}</Text>
                                    {advice.actionLabel && (
                                        <TouchableOpacity style={styles.coachingAction}>
                                            <Text style={styles.coachingActionText}>{advice.actionLabel}</Text>
                                            <Icon name="chevron-right" size={16} color="#007AFF" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="message-circle" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>No coaching tips yet</Text>
                                <Text style={styles.emptyStateSubtext}>Keep tracking your spending</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Patterns Tab */}
                {selectedTab === 'patterns' && (
                    <View>
                        {insights.patterns.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>Spending Patterns</Text>
                                {insights.patterns.map((pattern, index) => (
                                    <SpendingPatternCard key={index} pattern={pattern} />
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="activity" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>No patterns detected yet</Text>
                                <Text style={styles.emptyStateSubtext}>More data needed for pattern analysis</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Rebalancing Tab */}
                {selectedTab === 'rebalancing' && (
                    <View>
                        {insights.rebalancing && insights.rebalancing.suggestions.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>Budget Rebalancing</Text>
                                <View style={styles.rebalanceSummary}>
                                    <Text style={styles.rebalanceMessage}>{insights.rebalancing.message}</Text>
                                    <View style={styles.rebalanceStats}>
                                        <View style={styles.rebalanceStat}>
                                            <Icon name="trending-up" size={16} color="#10B981" />
                                            <Text style={styles.rebalanceStatLabel}>Savings Increase</Text>
                                            <Text style={styles.rebalanceStatValue}>
                                                ₹{insights.rebalancing.totalSavingsIncrease.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                        <View style={styles.rebalanceStat}>
                                            <Icon name="trending-down" size={16} color="#DC2626" />
                                            <Text style={styles.rebalanceStatLabel}>Wants Decrease</Text>
                                            <Text style={styles.rebalanceStatValue}>
                                                ₹{insights.rebalancing.totalWantsDecrease.toLocaleString('en-IN')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                {insights.rebalancing.suggestions.map((suggestion, index) => (
                                    <BudgetRebalanceCard
                                        key={index}
                                        suggestion={suggestion}
                                        onApprove={(s) => console.log('Approved:', s)}
                                        onReject={(s) => console.log('Rejected:', s)}
                                    />
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="check-circle" size={48} color="#10B981" />
                                <Text style={styles.emptyStateText}>Budget looks balanced</Text>
                                <Text style={styles.emptyStateSubtext}>No rebalancing needed right now</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Reduction Tab */}
                {selectedTab === 'reduction' && (
                    <View>
                        {insights.reductionSuggestions.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>Spending Reduction Strategies</Text>
                                {insights.reductionSuggestions.map((reduction, index) => (
                                    <SpendingReductionCard
                                        key={index}
                                        reduction={reduction}
                                        onTrack={(r) => console.log('Tracking:', r)}
                                    />
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="check-circle" size={48} color="#10B981" />
                                <Text style={styles.emptyStateText}>Spending looks good</Text>
                                <Text style={styles.emptyStateSubtext}>No reduction suggestions at this time</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Rules Tab */}
                {selectedTab === 'rules' && (
                    <View>
                        {insights.personalizedRules.length > 0 ? (
                            <>
                                <Text style={styles.sectionTitle}>Personalized Financial Rules</Text>
                                <View style={styles.rulesInfo}>
                                    <Icon name="info" size={16} color="#6B7280" />
                                    <Text style={styles.rulesInfoText}>
                                        AI has learned these rules from your spending patterns. Approve to activate.
                                    </Text>
                                </View>
                                {insights.personalizedRules.map((rule, index) => (
                                    <PersonalizedRuleCard
                                        key={index}
                                        rule={rule}
                                        onApprove={(r) => console.log('Approved rule:', r)}
                                        onReject={(r) => console.log('Rejected rule:', r)}
                                        onToggle={(r, active) => console.log('Toggled rule:', r, active)}
                                    />
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="shield" size={48} color="#9CA3AF" />
                                <Text style={styles.emptyStateText}>No rules yet</Text>
                                <Text style={styles.emptyStateSubtext}>AI needs more data to learn your patterns</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AIStudioTheme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: AIStudioTheme.colors.text,
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: AIStudioTheme.colors.primary,
        borderRadius: AIStudioTheme.borderRadius.md,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: AIStudioTheme.spacing.md,
        backgroundColor: AIStudioTheme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: AIStudioTheme.colors.border,
    },
    title: {
        ...AIStudioTheme.typography.h3,
        color: AIStudioTheme.colors.text,
    },
    subtitle: {
        ...AIStudioTheme.typography.caption,
        color: AIStudioTheme.colors.textSecondary,
        marginTop: 2,
    },
    tabContainer: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: AIStudioTheme.colors.border,
        paddingHorizontal: AIStudioTheme.spacing.sm,
        height: 40,
        maxHeight: 40,
        flexGrow: 0,
    },
    tab: {
        paddingVertical: 0, // No vertical padding
        paddingHorizontal: 12,
        marginRight: 0,
        justifyContent: 'center',
        alignItems: 'center',
        height: 40, // Full height of container
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        backgroundColor: 'transparent',
        borderBottomColor: AIStudioTheme.colors.primary,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '500',
        color: AIStudioTheme.colors.textSecondary,
    },
    activeTabText: {
        color: AIStudioTheme.colors.primary,
        fontWeight: '600',
    },
    chartContainer: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
        alignItems: 'center',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    badge: {
        marginLeft: 6,
        backgroundColor: AIStudioTheme.colors.error,
        borderRadius: AIStudioTheme.borderRadius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.md,
        padding: AIStudioTheme.spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    highlightCard: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.primary,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 12,
    },
    patternCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    patternHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    patternCategory: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        textTransform: 'capitalize',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    patternInsight: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 8,
    },
    patternStats: {
        flexDirection: 'row',
        gap: 16,
    },
    patternStat: {
        fontSize: 12,
        color: '#6B7280',
    },
    rebalanceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rebalanceMessage: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 16,
    },
    rebalanceItem: {
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 12,
        marginTop: 12,
    },
    rebalanceFlow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    rebalanceCategory: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textTransform: 'capitalize',
    },
    rebalanceAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 4,
    },
    rebalanceReason: {
        fontSize: 13,
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 16,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    coachingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    coachingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    coachingTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    coachingMessage: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    coachingAction: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 8,
    },
    coachingActionText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginRight: 4,
    },
    rebalanceSummary: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    rebalanceStats: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    rebalanceStat: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
    },
    rebalanceStatLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 6,
        marginBottom: 4,
    },
    rebalanceStatValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    rulesInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        gap: 10,
    },
    rulesInfoText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
});
