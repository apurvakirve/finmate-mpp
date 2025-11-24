import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SpendingPattern } from '../types/aiInsights';

interface SpendingPatternCardProps {
    pattern: SpendingPattern;
}

export default function SpendingPatternCard({ pattern }: SpendingPatternCardProps) {
    const getTrendColor = (trend: 'rising' | 'stable' | 'falling') => {
        switch (trend) {
            case 'rising': return '#DC2626';
            case 'falling': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getTrendIcon = (trend: 'rising' | 'stable' | 'falling') => {
        switch (trend) {
            case 'rising': return 'trending-up';
            case 'falling': return 'trending-down';
            default: return 'minus';
        }
    };

    const getTrendBgColor = (trend: 'rising' | 'stable' | 'falling') => {
        switch (trend) {
            case 'rising': return '#FEE2E2';
            case 'falling': return '#D1FAE5';
            default: return '#E5E7EB';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const formatPercentage = (value: number) => {
        const abs = Math.abs(value);
        const sign = value > 0 ? '+' : value < 0 ? '-' : '';
        return `${sign}${abs.toFixed(0)}%`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.category}>{pattern.category}</Text>
                <View style={[styles.trendBadge, { backgroundColor: getTrendBgColor(pattern.trend) }]}>
                    <Icon
                        name={getTrendIcon(pattern.trend)}
                        size={12}
                        color={getTrendColor(pattern.trend)}
                    />
                    <Text style={[styles.trendText, { color: getTrendColor(pattern.trend) }]}>
                        {pattern.trend}
                    </Text>
                </View>
            </View>

            {/* Insight */}
            <Text style={styles.insight}>{pattern.insight}</Text>

            {/* Current Amount */}
            <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Current Spending</Text>
                <Text style={styles.amountValue}>{formatCurrency(pattern.currentAmount)}</Text>
            </View>

            {/* Comparisons */}
            <View style={styles.comparisons}>
                {/* 7-Day Comparison */}
                <View style={styles.comparisonItem}>
                    <View style={styles.comparisonHeader}>
                        <Text style={styles.comparisonLabel}>vs 7-day avg</Text>
                        <Text style={[
                            styles.comparisonPercentage,
                            { color: pattern.percentChange7Days > 0 ? '#DC2626' : '#10B981' }
                        ]}>
                            {formatPercentage(pattern.percentChange7Days)}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(Math.abs(pattern.percentChange7Days), 100)}%`,
                                    backgroundColor: pattern.percentChange7Days > 0 ? '#DC2626' : '#10B981'
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.comparisonAmount}>{formatCurrency(pattern.avg7Days)}</Text>
                </View>

                {/* 30-Day Comparison */}
                <View style={styles.comparisonItem}>
                    <View style={styles.comparisonHeader}>
                        <Text style={styles.comparisonLabel}>vs 30-day avg</Text>
                        <Text style={[
                            styles.comparisonPercentage,
                            { color: pattern.percentChange30Days > 0 ? '#DC2626' : '#10B981' }
                        ]}>
                            {formatPercentage(pattern.percentChange30Days)}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(Math.abs(pattern.percentChange30Days), 100)}%`,
                                    backgroundColor: pattern.percentChange30Days > 0 ? '#DC2626' : '#10B981'
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.comparisonAmount}>{formatCurrency(pattern.avg30Days)}</Text>
                </View>

                {/* Weekday Comparison */}
                <View style={styles.comparisonItem}>
                    <View style={styles.comparisonHeader}>
                        <Text style={styles.comparisonLabel}>vs weekday avg</Text>
                        <Text style={[
                            styles.comparisonPercentage,
                            { color: pattern.percentChangeWeekday > 0 ? '#DC2626' : '#10B981' }
                        ]}>
                            {formatPercentage(pattern.percentChangeWeekday)}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${Math.min(Math.abs(pattern.percentChangeWeekday), 100)}%`,
                                    backgroundColor: pattern.percentChangeWeekday > 0 ? '#DC2626' : '#10B981'
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.comparisonAmount}>{formatCurrency(pattern.avgWeekday)}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    category: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        textTransform: 'capitalize',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    insight: {
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 16,
    },
    amountSection: {
        marginBottom: 16,
    },
    amountLabel: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 24,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    comparisons: {
        gap: 12,
    },
    comparisonItem: {
        gap: 6,
    },
    comparisonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    comparisonLabel: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        fontWeight: '500',
    },
    comparisonPercentage: {
        fontSize: 13,
        fontWeight: '700',
    },
    progressBar: {
        height: 6,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    comparisonAmount: {
        fontSize: 12,
        color: AIStudioTheme.colors.textMuted,
    },
});
