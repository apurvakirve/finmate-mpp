/**
 * Upcoming Bills Card Component
 * Displays upcoming bills on the dashboard with urgency indicators
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { Bill, getDaysUntilDue } from '../lib/BillTracker';

interface UpcomingBillsCardProps {
    bills: Bill[];
    onViewAll?: () => void;
    onBillPress?: (bill: Bill) => void;
}

const UpcomingBillsCard: React.FC<UpcomingBillsCardProps> = ({
    bills,
    onViewAll,
    onBillPress,
}) => {
    // Show only the next 3 upcoming bills
    const upcomingBills = bills.slice(0, 3);

    if (upcomingBills.length === 0) {
        return null;
    }

    const getUrgencyColor = (daysUntil: number): string => {
        if (daysUntil < 0) return '#EF4444'; // Red - Overdue
        if (daysUntil <= 3) return '#F59E0B'; // Orange - Due soon
        if (daysUntil <= 7) return '#3B82F6'; // Blue - Upcoming
        return '#10B981'; // Green - Future
    };

    const getUrgencyLabel = (daysUntil: number): string => {
        if (daysUntil < 0) return 'Overdue';
        if (daysUntil === 0) return 'Due today';
        if (daysUntil === 1) return 'Due tomorrow';
        return `${daysUntil} days`;
    };

    const getCategoryIcon = (category: string): string => {
        switch (category.toLowerCase()) {
            case 'rent': return 'home';
            case 'utilities': return 'zap';
            case 'insurance': return 'shield';
            case 'subscriptions': return 'repeat';
            case 'loans': return 'credit-card';
            default: return 'file-text';
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Feather name="calendar" size={20} color={AIStudioTheme.colors.primary} />
                    <Text style={styles.title}>Upcoming Bills</Text>
                </View>
                {onViewAll && (
                    <TouchableOpacity onPress={onViewAll}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.billsList}>
                {upcomingBills.map((bill) => {
                    const daysUntil = getDaysUntilDue(bill);
                    const urgencyColor = getUrgencyColor(daysUntil);
                    const urgencyLabel = getUrgencyLabel(daysUntil);

                    return (
                        <TouchableOpacity
                            key={bill.id}
                            style={styles.billItem}
                            onPress={() => onBillPress?.(bill)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.billLeft}>
                                <View style={[styles.iconContainer, { backgroundColor: urgencyColor + '20' }]}>
                                    <Feather
                                        name={getCategoryIcon(bill.category) as any}
                                        size={18}
                                        color={urgencyColor}
                                    />
                                </View>
                                <View style={styles.billInfo}>
                                    <Text style={styles.billName} numberOfLines={1}>
                                        {bill.name}
                                    </Text>
                                    <Text style={styles.billCategory}>
                                        {bill.category.charAt(0).toUpperCase() + bill.category.slice(1)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.billRight}>
                                <Text style={styles.billAmount}>${bill.amount}</Text>
                                <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
                                    <Text style={styles.urgencyText}>{urgencyLabel}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {bills.length > 3 && (
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        +{bills.length - 3} more bill{bills.length - 3 !== 1 ? 's' : ''} upcoming
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.lg,
        marginHorizontal: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: AIStudioTheme.spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: AIStudioTheme.spacing.sm,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: AIStudioTheme.colors.primary,
    },
    billsList: {
        gap: AIStudioTheme.spacing.sm,
    },
    billItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: AIStudioTheme.borderRadius.md,
        padding: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
    },
    billLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: AIStudioTheme.spacing.sm,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    billInfo: {
        flex: 1,
    },
    billName: {
        fontSize: 14,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
        marginBottom: 2,
    },
    billCategory: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
    },
    billRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    billAmount: {
        fontSize: 15,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    urgencyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    urgencyText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    footer: {
        marginTop: AIStudioTheme.spacing.sm,
        paddingTop: AIStudioTheme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        fontWeight: '500',
    },
});

export default UpcomingBillsCard;
