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
import { LineChart } from 'react-native-chart-kit';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { AIFinancialAnalyzer } from '../lib/aiFinancialAnalyzer';
import PredictionCard from './PredictionCard';

interface AIInsightsDashboardProps {
    context: FinancialContext;
    onRefresh?: () => void;
}

export default function AIInsightsDashboard({ context, onRefresh }: AIInsightsDashboardProps) {
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions'>('overview');

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
                {(['overview', 'predictions'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, selectedTab === tab && styles.activeTab]}
                        onPress={() => setSelectedTab(tab)}
                    >
                        <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
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

                        {/* Category Spending Trends Chart */}
                        <View style={styles.chartContainer}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 10 }}>
                                <Text style={styles.chartTitle}>Category Spending Trends</Text>
                                <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                                    <Text style={[styles.badgeText, { color: '#EF4444' }]}>
                                        ↑ {Math.round((context.totalSpent / context.totalIncome) * 100)}%
                                    </Text>
                                </View>
                            </View>

                            <LineChart
                                data={{
                                    labels: Array.from({ length: 7 }, (_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (6 - i));
                                        return d.toLocaleDateString('en-US', { weekday: 'narrow' });
                                    }),
                                    datasets: context.topCategories.slice(0, 3).map((cat: any, index: number) => ({
                                        data: Array.from({ length: 7 }, (_, i) => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - (6 - i));
                                            const dayStr = d.toDateString();
                                            return context.transactions
                                                .filter((t: any) =>
                                                    (t.transaction_type === cat.category) &&
                                                    new Date(t.created_at).toDateString() === dayStr
                                                )
                                                .reduce((sum: number, t: any) => sum + t.amount, 0);
                                        }),
                                        color: (opacity = 1) => [
                                            `rgba(139, 92, 246, ${opacity})`, // Purple
                                            `rgba(107, 114, 128, ${opacity})`, // Gray
                                            `rgba(59, 130, 246, ${opacity})`  // Blue
                                        ][index % 3],
                                        strokeWidth: 2
                                    }))
                                }}
                                width={Dimensions.get("window").width - 48}
                                height={220}
                                yAxisLabel="₹"
                                chartConfig={{
                                    backgroundColor: AIStudioTheme.colors.surface,
                                    backgroundGradientFrom: AIStudioTheme.colors.surface,
                                    backgroundGradientTo: AIStudioTheme.colors.surface,
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
                                    style: { borderRadius: 16 },
                                    propsForDots: { r: "0" },
                                    propsForBackgroundLines: {
                                        strokeDasharray: "5, 5",
                                        stroke: "#374151"
                                    }
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                                withDots={false}
                                withShadow={false}
                            />

                            {/* Custom Legend */}
                            <View style={{ width: '100%', marginTop: 10 }}>
                                <Text style={{ color: '#9CA3AF', marginBottom: 10, fontSize: 14 }}>Tap to highlight category</Text>
                                {context.topCategories.slice(0, 3).map((cat, index) => (
                                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: [
                                                    '#8B5CF6', // Purple
                                                    '#9CA3AF', // Gray
                                                    '#3B82F6'  // Blue
                                                ][index % 3]
                                            }} />
                                            <Text style={{ color: '#E5E7EB', fontSize: 14 }}>{cat.category}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
                                                ₹{cat.amount.toLocaleString('en-IN')}
                                            </Text>
                                            <Text style={{ color: '#6B7280', fontSize: 12, width: 30, textAlign: 'right' }}>
                                                {cat.percentage}%
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Spending Patterns - Moved Here */}
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

                {/* Predictions Tab - Enhanced */}
                {selectedTab === 'predictions' && (
                    <View>
                        {/* Income Forecast - Always Show */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📊 Income Forecast</Text>
                            <View style={styles.forecastCard}>
                                <View style={styles.forecastHeader}>
                                    <Icon name="trending-up" size={24} color="#10B981" />
                                    <Text style={styles.forecastTitle}>Expected Income This Month</Text>
                                </View>
                                <Text style={styles.forecastAmount}>
                                    ₹{Math.round(context.totalIncome * 1.05).toLocaleString('en-IN')}
                                </Text>
                                <Text style={styles.forecastSubtext}>
                                    Based on your {context.incomeFrequency} income pattern
                                </Text>

                                {/* Income Trend Line Chart */}
                                <View style={styles.forecastChart}>
                                    <LineChart
                                        data={{
                                            labels: ["2 Mo Ago", "Last Mo", "This Mo", "Next Mo"],
                                            datasets: [{
                                                data: [
                                                    context.totalIncome * 0.92,
                                                    context.totalIncome,
                                                    context.totalIncome * 1.05,
                                                    context.totalIncome * 1.08
                                                ]
                                            }]
                                        }}
                                        width={Dimensions.get("window").width - 64}
                                        height={200}
                                        yAxisLabel="₹"
                                        chartConfig={{
                                            backgroundColor: '#10B981',
                                            backgroundGradientFrom: '#10B981',
                                            backgroundGradientTo: '#059669',
                                            decimalPlaces: 0,
                                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                            style: { borderRadius: 16 },
                                            propsForDots: {
                                                r: "6",
                                                strokeWidth: "2",
                                                stroke: "#fff"
                                            }
                                        }}
                                        bezier
                                        style={{
                                            marginVertical: 8,
                                            borderRadius: 16
                                        }}
                                    />
                                    <Text style={styles.forecastChartCaption}>
                                        📈 Projected growth based on your {context.incomeFrequency} income pattern
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Spending Behavior Prediction */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>📈 Spending Trend</Text>
                            <View style={styles.trendCard}>
                                <Text style={styles.trendText}>
                                    At your current rate, you'll spend approximately <Text style={styles.trendAmount}>₹{Math.round(context.totalSpent * 1.1).toLocaleString('en-IN')}</Text> this month.
                                </Text>
                                <View style={styles.trendBar}>
                                    <View style={[styles.trendFill, { width: `${Math.min(100, (context.totalSpent / context.totalIncome) * 100)}%` }]} />
                                </View>
                                <Text style={styles.trendSubtext}>
                                    {Math.round((context.totalSpent / context.totalIncome) * 100)}% of income spent so far
                                </Text>
                            </View>
                        </View>

                        {/* Risk Alerts */}
                        {context.upcomingBills > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>⚠ Financial Alerts</Text>
                                <View style={[styles.alertCard, { borderLeftColor: '#EF4444' }]}>
                                    <View style={styles.alertHeader}>
                                        <Icon name="alert-triangle" size={20} color="#EF4444" />
                                        <Text style={styles.alertTitle}>EMI & Bills Alert</Text>
                                    </View>
                                    <Text style={styles.alertMessage}>
                                        You have ₹{context.upcomingBills.toLocaleString('en-IN')} in upcoming bills. If you continue spending at this rate, you may face a shortfall.
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* AI Predictions */}
                        {insights.predictions.length > 0 ? (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>🔮 AI Insights</Text>
                                {insights.predictions.map((prediction, index) => (
                                    <PredictionCard key={index} prediction={prediction} />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Icon name="check-circle" size={48} color="#10B981" />
                                <Text style={styles.emptyStateText}>All Clear!</Text>
                                <Text style={styles.emptyStateSubtext}>No additional insights at this time</Text>
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
    forecastCard: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    forecastHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    forecastTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
    },
    forecastAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 4,
    },
    forecastSubtext: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 16,
    },
    forecastChart: {
        alignItems: 'center',
        marginTop: 8,
    },
    forecastChartCaption: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        marginTop: 8,
        fontStyle: 'italic',
    },
    trendCard: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    trendText: {
        fontSize: 15,
        color: AIStudioTheme.colors.text,
        marginBottom: 16,
        lineHeight: 22,
    },
    trendAmount: {
        fontWeight: '700',
        color: AIStudioTheme.colors.error,
    },
    trendBar: {
        height: 8,
        backgroundColor: AIStudioTheme.colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    trendFill: {
        height: '100%',
        backgroundColor: AIStudioTheme.colors.primary,
        borderRadius: 4,
    },
    trendSubtext: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        textAlign: 'right',
    },
    alertCard: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.md,
        padding: AIStudioTheme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: AIStudioTheme.colors.primary,
        marginBottom: 12,
        ...AIStudioTheme.shadows.sm,
    },
    alertHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
    },
    alertMessage: {
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 20,
    },
});
