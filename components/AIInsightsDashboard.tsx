import { Feather as Icon } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AIFinancialAnalyzer } from '../lib/aiFinancialAnalyzer';
import { AIInsights, FinancialContext } from '../types/aiInsights';
import AnomalyAlert from './AnomalyAlert';
import PredictionCard from './PredictionCard';

interface AIInsightsDashboardProps {
    context: FinancialContext;
    onRefresh?: () => void;
}

export default function AIInsightsDashboard({ context, onRefresh }: AIInsightsDashboardProps) {
    const [insights, setInsights] = useState<AIInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'predictions' | 'anomalies' | 'coaching'>('overview');

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
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Analyzing your finances with AI...</Text>
            </View>
        );
    }

    if (!insights) {
        return (
            <View style={styles.emptyContainer}>
                <Icon name="alert-circle" size={48} color="#9CA3AF" />
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
                        {insights.confidence}% confidence • Last updated {new Date(insights.lastUpdated).toLocaleTimeString()}
                    </Text>
                </View>
                <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
                    <Icon name="refresh-cw" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Tab Navigation */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
                {(['overview', 'predictions', 'anomalies', 'coaching'] as const).map(tab => (
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
                        {/* Quick Stats */}
                        <View style={styles.statsGrid}>
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

                        {/* Top Predictions */}
                        {insights.predictions.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Top Predictions</Text>
                                {insights.predictions.slice(0, 2).map((prediction, index) => (
                                    <PredictionCard key={index} prediction={prediction} />
                                ))}
                            </View>
                        )}

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
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
        color: '#6B7280',
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
        color: '#6B7280',
        fontWeight: '600',
    },
    retryButton: {
        marginTop: 16,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 10,
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
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    tabContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingHorizontal: 16,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#007AFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    activeTabText: {
        color: '#007AFF',
    },
    badge: {
        marginLeft: 6,
        backgroundColor: '#EF4444',
        borderRadius: 10,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
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
});
