import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CategoryAnalysis } from '../types/aiInsights';

interface CategoryAnalysisCardProps {
    analysis: CategoryAnalysis;
    onAction?: () => void;
}

export default function CategoryAnalysisCard({ analysis, onAction }: CategoryAnalysisCardProps) {
    const getStatusColor = (status: 'rising' | 'stable' | 'reducible') => {
        switch (status) {
            case 'rising': return '#DC2626';
            case 'reducible': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getStatusIcon = (status: 'rising' | 'stable' | 'reducible') => {
        switch (status) {
            case 'rising': return 'arrow-up-circle';
            case 'reducible': return 'arrow-down-circle';
            default: return 'circle';
        }
    };

    const getStatusBgColor = (status: 'rising' | 'stable' | 'reducible') => {
        switch (status) {
            case 'rising': return '#FEE2E2';
            case 'reducible': return '#D1FAE5';
            default: return '#E5E7EB';
        }
    };

    const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return '#DC2626';
            case 'medium': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const formatPercentage = (value: number) => {
        const abs = Math.abs(value);
        const sign = value > 0 ? '+' : value < 0 ? '-' : '';
        return `${sign}${abs.toFixed(1)}%`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusBgColor(analysis.status) }]}>
                        <Icon
                            name={getStatusIcon(analysis.status)}
                            size={20}
                            color={getStatusColor(analysis.status)}
                        />
                    </View>
                    <View>
                        <Text style={styles.category}>{analysis.category}</Text>
                        <Text style={[styles.status, { color: getStatusColor(analysis.status) }]}>
                            {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                        </Text>
                    </View>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(analysis.priority) + '20' }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(analysis.priority) }]}>
                        {analysis.priority.toUpperCase()}
                    </Text>
                </View>
            </View>

            {/* Spending Comparison */}
            <View style={styles.spendingSection}>
                <View style={styles.spendingRow}>
                    <View style={styles.spendingItem}>
                        <Text style={styles.spendingLabel}>Current</Text>
                        <Text style={styles.spendingValue}>{formatCurrency(analysis.currentSpending)}</Text>
                    </View>
                    <Icon name="arrow-right" size={16} color="#9CA3AF" />
                    <View style={styles.spendingItem}>
                        <Text style={styles.spendingLabel}>Previous</Text>
                        <Text style={styles.spendingValue}>{formatCurrency(analysis.previousSpending)}</Text>
                    </View>
                </View>
                <View style={styles.changeIndicator}>
                    <Text style={[
                        styles.changeText,
                        { color: analysis.percentChange > 0 ? '#DC2626' : '#10B981' }
                    ]}>
                        {formatPercentage(analysis.percentChange)} change
                    </Text>
                </View>
            </View>

            {/* Recommendation */}
            <View style={styles.recommendationSection}>
                <View style={styles.recommendationHeader}>
                    <Icon name="sun" size={16} color="#F59E0B" />
                    <Text style={styles.recommendationTitle}>Recommendation</Text>
                </View>
                <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
            </View>

            {/* Action Button */}
            {onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.7}>
                    <Text style={styles.actionButtonText}>Take Action</Text>
                    <Icon name="chevron-right" size={16} color="#007AFF" />
                </TouchableOpacity>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    statusIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    category: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        textTransform: 'capitalize',
    },
    status: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
    },
    spendingSection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    spendingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    spendingItem: {
        flex: 1,
    },
    spendingLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
    },
    spendingValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    changeIndicator: {
        alignItems: 'center',
    },
    changeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    recommendationSection: {
        backgroundColor: '#FFFBEB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    recommendationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    recommendationTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    recommendationText: {
        fontSize: 13,
        color: '#78350F',
        lineHeight: 18,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 4,
        gap: 4,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
});
