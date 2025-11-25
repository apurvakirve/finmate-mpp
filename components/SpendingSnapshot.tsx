import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AIStudioTheme } from '../constants/aiStudioTheme';

interface SpendingSnapshotProps {
    last7Days: { date: string; amount: number }[];
    topCategories: { category: string; amount: number; percentage: number }[];
    weekOverWeekChange: number;
}

export default function SpendingSnapshot({
    last7Days,
    topCategories,
    weekOverWeekChange
}: SpendingSnapshotProps) {
    const isIncrease = weekOverWeekChange > 0;
    const chartWidth = Dimensions.get('window').width - 56;

    // Prepare chart data
    const chartData = {
        labels: last7Days.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
        }),
        datasets: [{
            data: last7Days.length > 0
                ? last7Days.map(d => d.amount)
                : [0, 0, 0, 0, 0, 0, 0]
        }]
    };

    // Get category colors
    const categoryColors = ['#8B5CF6', '#F59E0B', '#10B981'];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Icon name="trending-up" size={20} color={AIStudioTheme.colors.primary} />
                    <Text style={styles.title}>7-Day Spending</Text>
                </View>
                <View style={[styles.changeBadge, {
                    backgroundColor: isIncrease ? '#FEE2E2' : '#D1FAE5'
                }]}>
                    <Icon
                        name={isIncrease ? 'arrow-up' : 'arrow-down'}
                        size={12}
                        color={isIncrease ? '#EF4444' : '#10B981'}
                    />
                    <Text style={[styles.changeText, {
                        color: isIncrease ? '#EF4444' : '#10B981'
                    }]}>
                        {Math.abs(weekOverWeekChange).toFixed(0)}%
                    </Text>
                </View>
            </View>

            {/* Mini Chart */}
            <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={chartWidth}
                    height={180}
                    chartConfig={{
                        backgroundColor: AIStudioTheme.colors.surface,
                        backgroundGradientFrom: AIStudioTheme.colors.surface,
                        backgroundGradientTo: AIStudioTheme.colors.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`, // Google Blue
                        labelColor: (opacity = 1) => `rgba(232, 234, 237, ${opacity})`, // Light text
                        style: { borderRadius: 16 },
                        propsForDots: {
                            r: '4',
                            strokeWidth: '2',
                            stroke: AIStudioTheme.colors.surface
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '5, 5',
                            stroke: AIStudioTheme.colors.border,
                            strokeWidth: 1
                        },
                        fillShadowGradient: AIStudioTheme.colors.primary,
                        fillShadowGradientOpacity: 0.2,
                        useShadowColorFromDataset: false,
                    }}
                    bezier
                    style={{
                        ...styles.chart,
                        paddingBottom: 20,
                        paddingRight: 16,
                        paddingLeft: 40,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    yAxisLabel=""
                    yAxisSuffix=""
                    yAxisInterval={1}
                    withDots={true}
                    segments={3}
                    fromZero={true}
                />
            </View>

            {/* Top Categories */}
            <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Top Spending Categories</Text>
                <View style={styles.categoriesList}>
                    {topCategories.slice(0, 3).map((cat, index) => (
                        <View key={cat.category} style={styles.categoryItem}>
                            <View style={styles.categoryLeft}>
                                <View style={[styles.categoryDot, {
                                    backgroundColor: categoryColors[index]
                                }]} />
                                <Text style={styles.categoryName}>
                                    {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                </Text>
                            </View>
                            <View style={styles.categoryRight}>
                                <Text style={styles.categoryAmount}>
                                    ₹{cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </Text>
                                <Text style={styles.categoryPercentage}>
                                    {cat.percentage.toFixed(0)}%
                                </Text>
                            </View>
                        </View>
                    ))}
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
        marginHorizontal: 8,
        marginBottom: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: AIStudioTheme.spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartContainer: {
        alignItems: 'center',
        marginVertical: AIStudioTheme.spacing.sm,
    },
    chart: {
        borderRadius: 8,
    },
    categoriesSection: {
        marginTop: AIStudioTheme.spacing.sm,
        paddingTop: AIStudioTheme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
    },
    categoriesTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    categoriesList: {
        gap: 8,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    categoryDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    categoryName: {
        fontSize: 13,
        color: AIStudioTheme.colors.text,
        fontWeight: '500',
    },
    categoryRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryAmount: {
        fontSize: 14,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    categoryPercentage: {
        fontSize: 12,
        color: AIStudioTheme.colors.textMuted,
        minWidth: 35,
        textAlign: 'right',
    },
});
