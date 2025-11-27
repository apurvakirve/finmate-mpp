import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { RiskScore } from '../lib/PersonalizedRiskProfile';
import { SpiritAnimalType } from '../types/spiritAnimal';

interface ProfileSummaryCardProps {
    spiritAnimal?: SpiritAnimalType;
    riskScore: RiskScore | null;
    age: number;
    dependents: number;
    monthlyIncome: number;
    onEdit: () => void;
}

const spiritAnimalNames: Record<SpiritAnimalType, string> = {
    eagle: 'Eagle Investor',
    squirrel: 'Squirrel Saver',
    butterfly: 'Butterfly Spender',
    lion: 'Lion Achiever',
    capybara: 'Capybara Balancer',
    fox: 'Fox Optimizer'
};

const spiritAnimalEmojis: Record<SpiritAnimalType, string> = {
    eagle: '🦅',
    squirrel: '🐿️',
    butterfly: '🦋',
    lion: '🦁',
    capybara: '🦫',
    fox: '🦊'
};

export default function ProfileSummaryCard({
    spiritAnimal,
    riskScore,
    age,
    dependents,
    monthlyIncome,
    onEdit
}: ProfileSummaryCardProps) {
    if (!riskScore) return null;

    const getRiskColor = (category: string) => {
        switch (category) {
            case 'conservative': return AIStudioTheme.colors.success;
            case 'moderate': return AIStudioTheme.colors.warning;
            case 'aggressive': return AIStudioTheme.colors.error;
            default: return AIStudioTheme.colors.primary;
        }
    };

    const hasAdjustments = Math.abs(riskScore.score - riskScore.baseScore) > 10;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {spiritAnimal && (
                        <Text style={styles.emoji}>{spiritAnimalEmojis[spiritAnimal]}</Text>
                    )}
                    <View>
                        <Text style={styles.title}>
                            {spiritAnimal ? spiritAnimalNames[spiritAnimal] : 'Your Profile'}
                        </Text>
                        <Text style={[styles.riskLabel, { color: getRiskColor(riskScore.category) }]}>
                            {riskScore.category.toUpperCase()} RISK
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                    <Icon name="edit-2" size={18} color={AIStudioTheme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.metricsRow}>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Age</Text>
                    <Text style={styles.metricValue}>{age}</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Dependents</Text>
                    <Text style={styles.metricValue}>{dependents}</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Income</Text>
                    <Text style={styles.metricValue}>₹{(monthlyIncome / 1000).toFixed(0)}k</Text>
                </View>
                <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Risk Score</Text>
                    <Text style={[styles.metricValue, { color: getRiskColor(riskScore.category) }]}>
                        {riskScore.score}/100
                    </Text>
                </View>
            </View>

            {hasAdjustments && (
                <View style={styles.adjustmentCard}>
                    <View style={styles.adjustmentHeader}>
                        <Icon name="info" size={16} color={AIStudioTheme.colors.primary} />
                        <Text style={styles.adjustmentTitle}>Personalized for You</Text>
                    </View>
                    {riskScore.reasoning.map((reason, idx) => (
                        <Text key={idx} style={styles.reasoningText}>
                            {reason}
                        </Text>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.lg,
        marginBottom: AIStudioTheme.spacing.md,
        ...AIStudioTheme.shadows.md,
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
    emoji: {
        fontSize: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 2,
    },
    riskLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    editButton: {
        padding: AIStudioTheme.spacing.sm,
        borderRadius: AIStudioTheme.borderRadius.sm,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: AIStudioTheme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.surfaceVariant,
    },
    metric: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 11,
        color: AIStudioTheme.colors.textMuted,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    adjustmentCard: {
        marginTop: AIStudioTheme.spacing.md,
        padding: AIStudioTheme.spacing.md,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: AIStudioTheme.borderRadius.md,
        borderLeftWidth: 3,
        borderLeftColor: AIStudioTheme.colors.primary,
    },
    adjustmentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: AIStudioTheme.spacing.xs,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    adjustmentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
    },
    reasoningText: {
        fontSize: 13,
        color: AIStudioTheme.colors.textMuted,
        lineHeight: 20,
        marginBottom: 4,
    },
});
