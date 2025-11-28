import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SpendingPattern } from '../types/aiInsights';

interface WeekendWeekdayChartProps {
    patterns: SpendingPattern[];
}

export default function WeekendWeekdayChart({ patterns }: WeekendWeekdayChartProps) {
    // Find the overall weekend pattern
    const weekendPattern = patterns.find(p => p.category === 'Weekends');

    // Find category-specific weekend patterns
    const categoryWeekendPatterns = patterns.filter(p =>
        p.category.includes('(Weekends)') || p.category.includes('(Weekdays)')
    );

    if (!weekendPattern && categoryWeekendPatterns.length === 0) {
        return null; // No weekend patterns to display
    }

    // Prepare data for the chart
    const chartData = {
        labels: ['Weekdays', 'Weekends'],
        datasets: [{
            data: weekendPattern
                ? [weekendPattern.avgWeekday, weekendPattern.currentAmount]
                : [0, 0]
        }]
    };

    const percentDifference = weekendPattern
        ? weekendPattern.percentChangeWeekday
        : 0;

    // Get top 3 category-specific patterns
    const topCategoryPatterns = categoryWeekendPatterns
        .sort((a, b) => Math.abs(b.percentChangeWeekday) - Math.abs(a.percentChangeWeekday))
        .slice(0, 3);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Icon name="calendar" size={20} color={AIStudioTheme.colors.primary} />
                <Text style={styles.title}>Weekend vs Weekday Spending</Text>
            </View>

            {weekendPattern && (
                <>
                    {/* Main Chart */}
                    <View style={styles.chartWrapper}>
                        <BarChart
                            data={chartData}
                            width={Dimensions.get('window').width - 64}
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
                                propsForBackgroundLines: {
                                    strokeDasharray: '',
                                    stroke: AIStudioTheme.colors.border,
                                    strokeWidth: 1,
                                },
                            }}
                            style={styles.chart}
                            showValuesOnTopOfBars
                            fromZero
                        />
                    </View>

                    {/* Percentage Difference Badge */}
                    <View style={[
                        styles.percentageBadge,
                        { backgroundColor: percentDifference > 0 ? '#FEE2E2' : '#D1FAE5' }
                    ]}>
                        <Icon
                            name={percentDifference > 0 ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={percentDifference > 0 ? '#DC2626' : '#10B981'}
                        />
                        <Text style={[
                            styles.percentageText,
                            { color: percentDifference > 0 ? '#DC2626' : '#10B981' }
                        ]}>
                            {Math.abs(percentDifference).toFixed(0)}% {percentDifference > 0 ? 'more' : 'less'} on weekends
                        </Text>
                    </View>

                    {/* Insight */}
                    <View style={styles.insightBox}>
                        <Text style={styles.insightText}>{weekendPattern.insight}</Text>
                    </View>
                </>
            )}

            {/* Category Breakdown */}
            {topCategoryPatterns.length > 0 && (
                <View style={styles.categoryBreakdown}>
                    <Text style={styles.breakdownTitle}>Top Category Differences</Text>
                    {topCategoryPatterns.map((pattern, index) => {
                        const isWeekend = pattern.category.includes('(Weekends)');
                        const categoryName = pattern.category.replace(' (Weekends)', '').replace(' (Weekdays)', '');
                        const percent = pattern.percentChangeWeekday;

                        return (
                            <View key={index} style={styles.categoryItem}>
                                <View style={styles.categoryHeader}>
                                    <Text style={styles.categoryName}>{categoryName}</Text>
                                    <View style={[
                                        styles.categoryBadge,
                                        { backgroundColor: isWeekend ? '#FEE2E2' : '#E0F2FE' }
                                    ]}>
                                        <Text style={[
                                            styles.categoryBadgeText,
                                            { color: isWeekend ? '#DC2626' : '#0284C7' }
                                        ]}>
                                            {isWeekend ? 'Weekend' : 'Weekday'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.categoryStats}>
                                    <Text style={styles.categoryAmount}>
                                        ₹{pattern.currentAmount.toFixed(0)}
                                    </Text>
                                    <Text style={[
                                        styles.categoryPercent,
                                        { color: '#DC2626' }
                                    ]}>
                                        +{percent.toFixed(0)}%
                                    </Text>
                                </View>
                                <Text style={styles.categoryInsight} numberOfLines={2}>
                                    {pattern.insight}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    chartWrapper: {
        alignItems: 'center',
        marginBottom: 16,
    },
    chart: {
        borderRadius: 16,
    },
    percentageBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    percentageText: {
        fontSize: 15,
        fontWeight: '700',
    },
    insightBox: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    insightText: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 18,
    },
    categoryBreakdown: {
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
        paddingTop: 16,
    },
    breakdownTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 12,
    },
    categoryItem: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
        textTransform: 'capitalize',
    },
    categoryBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    categoryStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    categoryAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    categoryPercent: {
        fontSize: 14,
        fontWeight: '700',
    },
    categoryInsight: {
        fontSize: 12,
        color: AIStudioTheme.colors.textMuted,
        lineHeight: 16,
    },
});
