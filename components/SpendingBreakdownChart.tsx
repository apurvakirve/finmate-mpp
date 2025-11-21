import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Transaction {
    amount: number;
    transaction_type: string;
    created_at: string;
    from_user_id: string;
}

interface SpendingBreakdownChartProps {
    transactions: Transaction[];
    currentUserId: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
    food: '#FF6B6B',
    transportation: '#FFD93D',
    shopping: '#6BCF7F',
    utilities: '#4ECDC4',
    entertainment: '#A78BFA',
    healthcare: '#FB923C',
    transfer: '#94A3B8',
    other: '#CBD5E1',
};

const CATEGORY_LABELS: { [key: string]: string } = {
    food: 'Food',
    transportation: 'Transport',
    shopping: 'Shopping',
    utilities: 'Utilities',
    entertainment: 'Fun',
    healthcare: 'Health',
    transfer: 'Transfer',
    other: 'Other',
};

const SpendingBreakdownChart: React.FC<SpendingBreakdownChartProps> = ({
    transactions,
    currentUserId,
}) => {
    const [period, setPeriod] = useState<'day' | 'week'>('week');

    const chartData = useMemo(() => {
        const now = new Date();

        if (period === 'day') {
            // Today's data - show as single bar
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            const userTransactions = transactions.filter(
                (t) => t.from_user_id === currentUserId && new Date(t.created_at) >= startOfDay
            );

            const categoryTotals: { [key: string]: number } = {};
            let total = 0;

            userTransactions.forEach((t) => {
                const category = t.transaction_type || 'other';
                const amount = parseFloat(String(t.amount)) || 0;
                categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                total += amount;
            });

            // Return single bar for today
            return {
                bars: [{
                    label: 'Today',
                    categories: categoryTotals,
                    total
                }],
                maxTotal: Math.max(total, 1)
            };
        } else {
            // Last 7 days data
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                date.setHours(0, 0, 0, 0);

                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);

                const dayTransactions = transactions.filter(
                    (t) => {
                        const tDate = new Date(t.created_at);
                        return t.from_user_id === currentUserId &&
                            tDate >= date &&
                            tDate < nextDate;
                    }
                );

                const categoryTotals: { [key: string]: number } = {};
                let total = 0;

                dayTransactions.forEach((t) => {
                    const category = t.transaction_type || 'other';
                    const amount = parseFloat(String(t.amount)) || 0;
                    categoryTotals[category] = (categoryTotals[category] || 0) + amount;
                    total += amount;
                });

                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                last7Days.push({
                    label: dayNames[date.getDay()],
                    categories: categoryTotals,
                    total
                });
            }

            const maxTotal = Math.max(...last7Days.map(d => d.total), 1);

            return {
                bars: last7Days,
                maxTotal
            };
        }
    }, [transactions, currentUserId, period]);

    // Find highest spending category across all bars
    const allCategories: { [key: string]: number } = {};
    chartData.bars.forEach(bar => {
        Object.entries(bar.categories).forEach(([cat, amount]) => {
            allCategories[cat] = (allCategories[cat] || 0) + amount;
        });
    });

    const highestCategory = Object.entries(allCategories).reduce(
        (max, [cat, amount]) => (amount > max.amount ? { category: cat, amount } : max),
        { category: '', amount: 0 }
    );

    const totalSpending = Object.values(allCategories).reduce((sum, amt) => sum + amt, 0);
    const shouldShowAlert = highestCategory.amount > totalSpending * 0.4;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Spending Breakdown</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, period === 'day' && styles.toggleButtonActive]}
                        onPress={() => setPeriod('day')}
                    >
                        <Text style={[styles.toggleText, period === 'day' && styles.toggleTextActive]}>
                            Day
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, period === 'week' && styles.toggleButtonActive]}
                        onPress={() => setPeriod('week')}
                    >
                        <Text style={[styles.toggleText, period === 'week' && styles.toggleTextActive]}>
                            Week
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {totalSpending > 0 ? (
                <>
                    {/* Chart */}
                    <View style={styles.chartContainer}>
                        <View style={styles.barsContainer}>
                            {chartData.bars.map((bar, index) => {
                                const barHeight = chartData.maxTotal > 0 ? (bar.total / chartData.maxTotal) * 100 : 0;
                                const categorySegments = Object.entries(bar.categories)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([category, amount]) => ({
                                        category,
                                        amount,
                                        percentage: bar.total > 0 ? (amount / bar.total) * 100 : 0,
                                        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.other,
                                    }));

                                return (
                                    <View key={index} style={styles.barWrapper}>
                                        <View style={styles.barContainer}>
                                            {bar.total > 0 ? (
                                                <View style={[styles.bar, { height: `${Math.max(barHeight, 5)}%` }]}>
                                                    {categorySegments.map((segment, i) => (
                                                        <View
                                                            key={segment.category}
                                                            style={[
                                                                styles.barSegment,
                                                                {
                                                                    flex: segment.percentage,
                                                                    backgroundColor: segment.color,
                                                                    borderTopLeftRadius: i === 0 ? 8 : 0,
                                                                    borderTopRightRadius: i === 0 ? 8 : 0,
                                                                    borderBottomLeftRadius: i === categorySegments.length - 1 ? 8 : 0,
                                                                    borderBottomRightRadius: i === categorySegments.length - 1 ? 8 : 0,
                                                                },
                                                            ]}
                                                        />
                                                    ))}
                                                </View>
                                            ) : (
                                                <View style={styles.emptyBar} />
                                            )}
                                        </View>
                                        <Text style={styles.barLabel}>{bar.label}</Text>
                                        {bar.total > 0 && (
                                            <Text style={styles.barAmount}>₹{bar.total.toFixed(0)}</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Legend */}
                    {Object.keys(allCategories).length > 0 && (
                        <View style={styles.legend}>
                            {Object.entries(allCategories)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 4)
                                .map(([category, amount]) => (
                                    <View key={category} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[category] }]} />
                                        <Text style={styles.legendText}>
                                            {CATEGORY_LABELS[category]} ₹{amount.toFixed(0)}
                                        </Text>
                                    </View>
                                ))}
                        </View>
                    )}

                    {/* Alert Banner */}
                    {shouldShowAlert && (
                        <View style={styles.alertBanner}>
                            <Text style={styles.alertText}>
                                ⚠️ You spend {((highestCategory.amount / totalSpending) * 100).toFixed(0)}% on {CATEGORY_LABELS[highestCategory.category]}
                            </Text>
                        </View>
                    )}
                </>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No spending data for this period</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginVertical: 16,
        marginHorizontal: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        padding: 4,
    },
    toggleButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#fff',
    },
    chartContainer: {
        marginBottom: 24,
        overflow: 'hidden',
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-evenly',
        height: 200,
        paddingHorizontal: 8,
        gap: 8,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
        maxWidth: 60,
    },
    barContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: '100%',
        maxWidth: 40,
        flexDirection: 'column-reverse',
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    barSegment: {
        width: '100%',
    },
    emptyBar: {
        width: '100%',
        maxWidth: 40,
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
    },
    barLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        marginTop: 8,
        textAlign: 'center',
        width: '100%',
    },
    barAmount: {
        fontSize: 10,
        fontWeight: '600',
        color: '#9CA3AF',
        marginTop: 3,
        textAlign: 'center',
        width: '100%',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    alertBanner: {
        backgroundColor: '#FEF2F2',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        borderRadius: 12,
        padding: 16,
        marginTop: 20,
    },
    alertText: {
        color: '#991B1B',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});

export default SpendingBreakdownChart;
