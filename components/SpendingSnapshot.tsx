import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AIStudioTheme } from '../constants/aiStudioTheme';

interface SpendingSnapshotProps {
    last7Days: { date: string; amount: number }[];
    topCategories: { category: string; amount: number; percentage: number }[];
    weekOverWeekChange: number;
    transactions?: any[];
    currentUserId?: string;
}

export default function SpendingSnapshot({
    last7Days,
    topCategories,
    weekOverWeekChange,
    transactions = [],
    currentUserId
}: SpendingSnapshotProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const isIncrease = weekOverWeekChange > 0;
    const chartWidth = Dimensions.get('window').width - 90;

    // Category colors mapping
    const categoryColorMap: { [key: string]: string } = {
        food: 'rgba(239, 68, 68, 1)',
        transportation: 'rgba(59, 130, 246, 1)',
        shopping: 'rgba(245, 158, 11, 1)',
        entertainment: 'rgba(139, 92, 246, 1)',
        utilities: 'rgba(16, 185, 129, 1)',
        healthcare: 'rgba(236, 72, 153, 1)',
        other: 'rgba(156, 163, 175, 1)',
    };

    // Prepare category-wise data for last 7 days
    const categoryData: { [key: string]: number[] } = {};
    const top3Categories = topCategories.slice(0, 3).map(c => c.category);

    top3Categories.forEach(cat => {
        categoryData[cat] = [];
    });

    // Calculate spending per category per day
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        top3Categories.forEach(category => {
            const daySpending = transactions
                .filter((t: any) => {
                    const tDate = new Date(t.created_at);
                    return (
                        t.from_user_id === currentUserId &&
                        tDate >= dayStart &&
                        tDate <= dayEnd &&
                        (t.transaction_type || 'other') === category
                    );
                })
                .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

            categoryData[category].push(daySpending);
        });
    }

    // Prepare chart data with multiple datasets
    const chartData = {
        labels: last7Days.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 1);
        }),
        datasets: top3Categories.map((category) => {
            const isSelected = selectedCategory === null || selectedCategory === category;
            const baseColor = categoryColorMap[category] || 'rgba(138, 180, 248, 1)';

            return {
                data: categoryData[category].length > 0 ? categoryData[category] : [0, 0, 0, 0, 0, 0, 0],
                color: (opacity = 1) => isSelected ? baseColor : baseColor.replace('1)', '0.2)'),
                strokeWidth: isSelected ? 3 : 1,
            };
        }),
    };

    // Get category colors
    const categoryColors = top3Categories.map(cat => categoryColorMap[cat] || '#8B5CF6');

    const handleCategoryPress = (category: string) => {
        setSelectedCategory(selectedCategory === category ? null : category);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Icon name="trending-up" size={20} color={AIStudioTheme.colors.primary} />
                    <Text style={styles.title}>Category Spending Trends</Text>
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

            {/* Multi-Line Chart */}
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
                        color: (opacity = 1) => `rgba(138, 180, 248, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(232, 234, 237, ${opacity})`,
                        style: { borderRadius: 16 },
                        propsForDots: {
                            r: '3',
                            strokeWidth: '1',
                        },
                        propsForBackgroundLines: {
                            strokeDasharray: '5, 5',
                            stroke: AIStudioTheme.colors.border,
                            strokeWidth: 1
                        },
                    }}
                    bezier
                    style={{
                        ...styles.chart,
                        paddingBottom: 10,
                        paddingRight: 50,
                        paddingLeft: 10,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    withVerticalLines={false}
                    withHorizontalLines={true}
                    yAxisLabel="₹"
                    yAxisSuffix=""
                    yAxisInterval={1}
                    withDots={false}
                    segments={3}
                    fromZero={true}
                />
            </View>

            {/* Interactive Top Categories */}
            <View style={styles.categoriesSection}>
                <Text style={styles.categoriesTitle}>Tap to highlight category</Text>
                <View style={styles.categoriesList}>
                    {topCategories.slice(0, 3).map((cat, index) => {
                        const isActive = selectedCategory === null || selectedCategory === cat.category;
                        return (
                            <TouchableOpacity
                                key={cat.category}
                                style={[
                                    styles.categoryItem,
                                    selectedCategory === cat.category && styles.categoryItemSelected
                                ]}
                                onPress={() => handleCategoryPress(cat.category)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.categoryLeft}>
                                    <View style={[styles.categoryDot, {
                                        backgroundColor: categoryColors[index],
                                        opacity: isActive ? 1 : 0.3
                                    }]} />
                                    <Text style={[
                                        styles.categoryName,
                                        { opacity: isActive ? 1 : 0.5 }
                                    ]}>
                                        {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
                                    </Text>
                                </View>
                                <View style={styles.categoryRight}>
                                    <Text style={[
                                        styles.categoryAmount,
                                        { opacity: isActive ? 1 : 0.5 }
                                    ]}>
                                        ₹{cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </Text>
                                    <Text style={[
                                        styles.categoryPercentage,
                                        { opacity: isActive ? 1 : 0.5 }
                                    ]}>
                                        {cat.percentage.toFixed(0)}%
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
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
        marginHorizontal: 20,
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    categoryItemSelected: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
    },
    categoryLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
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
