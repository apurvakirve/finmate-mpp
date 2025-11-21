import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BudgetRebalance } from '../types/aiInsights';

interface BudgetRebalanceCardProps {
    suggestion: BudgetRebalance;
    onApprove?: (suggestion: BudgetRebalance) => void;
    onReject?: (suggestion: BudgetRebalance) => void;
}

export default function BudgetRebalanceCard({ suggestion, onApprove, onReject }: BudgetRebalanceCardProps) {
    const [isApproved, setIsApproved] = useState(suggestion.approved);

    const handleApprove = () => {
        setIsApproved(true);
        onApprove?.({ ...suggestion, approved: true });
    };

    const handleReject = () => {
        onReject?.(suggestion);
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    return (
        <View style={[styles.container, isApproved && styles.containerApproved]}>
            {/* Header with Amount */}
            <View style={styles.header}>
                <View style={styles.amountBadge}>
                    <Text style={styles.amountText}>{formatCurrency(suggestion.amount)}</Text>
                </View>
                {isApproved && (
                    <View style={styles.approvedBadge}>
                        <Icon name="check-circle" size={16} color="#10B981" />
                        <Text style={styles.approvedText}>Approved</Text>
                    </View>
                )}
            </View>

            {/* Category Flow */}
            <View style={styles.flowSection}>
                <View style={styles.categoryBox}>
                    <Icon name="minus-circle" size={16} color="#DC2626" />
                    <Text style={styles.categoryText}>{suggestion.fromCategory}</Text>
                </View>
                <View style={styles.arrowContainer}>
                    <Icon name="arrow-right" size={20} color="#6B7280" />
                </View>
                <View style={styles.categoryBox}>
                    <Icon name="plus-circle" size={16} color="#10B981" />
                    <Text style={styles.categoryText}>{suggestion.toCategory}</Text>
                </View>
            </View>

            {/* Reason */}
            <View style={styles.reasonSection}>
                <View style={styles.reasonHeader}>
                    <Icon name="info" size={14} color="#6B7280" />
                    <Text style={styles.reasonLabel}>Reason</Text>
                </View>
                <Text style={styles.reasonText}>{suggestion.reason}</Text>
            </View>

            {/* Impact */}
            <View style={styles.impactSection}>
                <View style={styles.impactHeader}>
                    <Icon name="trending-up" size={14} color="#10B981" />
                    <Text style={styles.impactLabel}>Impact</Text>
                </View>
                <Text style={styles.impactText}>{suggestion.impact}</Text>
            </View>

            {/* Action Buttons */}
            {!isApproved && (onApprove || onReject) && (
                <View style={styles.actions}>
                    {onReject && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={handleReject}
                            activeOpacity={0.7}
                        >
                            <Icon name="x" size={16} color="#DC2626" />
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>
                    )}
                    {onApprove && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={handleApprove}
                            activeOpacity={0.7}
                        >
                            <Icon name="check" size={16} color="#FFFFFF" />
                            <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    containerApproved: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    amountBadge: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    amountText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4F46E5',
    },
    approvedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    approvedText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
    },
    flowSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
    },
    categoryBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    categoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textTransform: 'capitalize',
        flexShrink: 1,
    },
    arrowContainer: {
        paddingHorizontal: 8,
    },
    reasonSection: {
        marginBottom: 12,
    },
    reasonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    reasonLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    reasonText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
    },
    impactSection: {
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
    },
    impactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    impactLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
        textTransform: 'uppercase',
    },
    impactText: {
        fontSize: 13,
        color: '#047857',
        lineHeight: 18,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    rejectButton: {
        backgroundColor: '#FEE2E2',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    approveButton: {
        backgroundColor: '#10B981',
    },
    approveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
