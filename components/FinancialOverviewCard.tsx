import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';

interface FinancialOverviewCardProps {
    walletBalance: number;
    cashBalance: number;
    todayIncome: number;
    todaySpending: number;
    showTotal: boolean;
    onToggle: () => void;
}

export default function FinancialOverviewCard({
    walletBalance,
    cashBalance,
    todayIncome,
    todaySpending,
    showTotal,
    onToggle
}: FinancialOverviewCardProps) {
    const totalBalance = walletBalance + cashBalance;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onToggle}
            activeOpacity={0.8}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Icon name="credit-card" size={16} color={AIStudioTheme.colors.primary} />
                    <Text style={styles.headerTitle}>
                        Wallet Balance
                    </Text>
                </View>
                <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>
                    <Icon
                        name={showTotal ? "eye" : "eye-off"}
                        size={18}
                        color={AIStudioTheme.colors.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Main Balance */}
            <Text style={styles.balanceAmount}>
                ₹{(showTotal ? totalBalance : walletBalance).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}
            </Text>

            {/* Today's Activity - Side by Side */}
            <View style={styles.activitySection}>
                <Text style={styles.activityTitle}>Today's Activity</Text>
                <View style={styles.activityRow}>
                    {/* Income */}
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#D1FAE5' }]}>
                            <Icon name="arrow-down-left" size={16} color="#10B981" />
                        </View>
                        <View>
                            <Text style={styles.activityLabel}>Income</Text>
                            <Text style={[styles.activityValue, { color: '#10B981' }]}>
                                +₹{todayIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>

                    {/* Spending */}
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Icon name="arrow-up-right" size={16} color="#EF4444" />
                        </View>
                        <View>
                            <Text style={styles.activityLabel}>Spending</Text>
                            <Text style={[styles.activityValue, { color: '#EF4444' }]}>
                                -₹{todaySpending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Tap to toggle hint */}
            <Text style={styles.tapHint}>Tap to toggle view</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.lg,
        marginHorizontal: 8,
        marginTop: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.sm,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: AIStudioTheme.colors.textSecondary,
    },
    toggleButton: {
        padding: 4,
    },
    balanceAmount: {
        fontSize: 32,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 16,
    },
    activitySection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
    },
    activityTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 12,
    },
    activityRow: {
        flexDirection: 'row',
        gap: 12,
    },
    activityItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    activityIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityLabel: {
        fontSize: 11,
        color: AIStudioTheme.colors.textMuted,
        marginBottom: 2,
    },
    activityValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    tapHint: {
        fontSize: 11,
        color: AIStudioTheme.colors.textMuted,
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
});
