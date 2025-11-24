import { Feather as Icon } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SpendingReduction } from '../types/aiInsights';

interface SpendingReductionCardProps {
    reduction: SpendingReduction;
    onTrack?: (reduction: SpendingReduction) => void;
}

export default function SpendingReductionCard({ reduction, onTrack }: SpendingReductionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
        switch (difficulty) {
            case 'easy': return '#10B981';
            case 'medium': return '#F59E0B';
            case 'hard': return '#DC2626';
        }
    };

    const getDifficultyBgColor = (difficulty: 'easy' | 'medium' | 'hard') => {
        switch (difficulty) {
            case 'easy': return '#D1FAE5';
            case 'medium': return '#FEF3C7';
            case 'hard': return '#FEE2E2';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    const reductionPercentage = reduction.currentSpending > 0
        ? ((reduction.suggestedReduction / reduction.currentSpending) * 100).toFixed(0)
        : 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.category}>{reduction.category}</Text>
                    <View style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyBgColor(reduction.difficulty) }
                    ]}>
                        <Text style={[
                            styles.difficultyText,
                            { color: getDifficultyColor(reduction.difficulty) }
                        ]}>
                            {reduction.difficulty}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Current Spending */}
            <View style={styles.spendingSection}>
                <View style={styles.spendingRow}>
                    <View style={styles.spendingItem}>
                        <Text style={styles.spendingLabel}>Current</Text>
                        <Text style={styles.currentAmount}>{formatCurrency(reduction.currentSpending)}</Text>
                    </View>
                    <Icon name="arrow-right" size={20} color="#9CA3AF" />
                    <View style={styles.spendingItem}>
                        <Text style={styles.spendingLabel}>Target</Text>
                        <Text style={styles.targetAmount}>
                            {formatCurrency(reduction.currentSpending - reduction.suggestedReduction)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Savings Highlight */}
            <View style={styles.savingsSection}>
                <View style={styles.savingsIcon}>
                    <Icon name="trending-down" size={20} color="#10B981" />
                </View>
                <View style={styles.savingsContent}>
                    <Text style={styles.savingsLabel}>Potential Savings</Text>
                    <Text style={styles.savingsAmount}>{formatCurrency(reduction.potentialSavings)}</Text>
                    <Text style={styles.savingsPercentage}>({reductionPercentage}% reduction)</Text>
                </View>
            </View>

            {/* Strategies */}
            <TouchableOpacity
                style={styles.strategiesHeader}
                onPress={() => setIsExpanded(!isExpanded)}
                activeOpacity={0.7}
            >
                <View style={styles.strategiesHeaderLeft}>
                    <Icon name="list" size={16} color="#6B7280" />
                    <Text style={styles.strategiesTitle}>
                        {reduction.strategies.length} Strategies
                    </Text>
                </View>
                <Icon
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#6B7280"
                />
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.strategiesList}>
                    {reduction.strategies.map((strategy, index) => (
                        <View key={index} style={styles.strategyItem}>
                            <View style={styles.strategyBullet}>
                                <Icon name="check" size={12} color="#10B981" />
                            </View>
                            <Text style={styles.strategyText}>{strategy}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Track Button */}
            {onTrack && (
                <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => onTrack(reduction)}
                    activeOpacity={0.7}
                >
                    <Icon name="target" size={16} color="#007AFF" />
                    <Text style={styles.trackButtonText}>Track Progress</Text>
                </TouchableOpacity>
            )}
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
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    category: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        textTransform: 'capitalize',
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    spendingSection: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    spendingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    spendingItem: {
        flex: 1,
    },
    spendingLabel: {
        fontSize: 11,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 4,
    },
    currentAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626',
    },
    targetAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    savingsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        gap: 12,
    },
    savingsIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    savingsContent: {
        flex: 1,
    },
    savingsLabel: {
        fontSize: 11,
        color: '#065F46',
        marginBottom: 2,
    },
    savingsAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#047857',
    },
    savingsPercentage: {
        fontSize: 12,
        color: '#059669',
        marginTop: 2,
    },
    strategiesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
    },
    strategiesHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    strategiesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: AIStudioTheme.colors.textSecondary,
    },
    strategiesList: {
        paddingTop: 8,
        gap: 10,
    },
    strategyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    strategyBullet: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#D1FAE5',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    strategyText: {
        flex: 1,
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 20,
    },
    trackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
        marginTop: 12,
        gap: 6,
    },
    trackButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: AIStudioTheme.colors.primary,
    },
});
