/**
 * Personality Insight Card
 * Displays spirit animal-based investment strategy and insights
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SPIRIT_ANIMAL_PROFILES } from '../constants/spiritAnimals';
import { PersonalityInvestmentStrategy } from '../lib/AgenticInvestmentCoach';
import { SpiritAnimalType } from '../types/spiritAnimal';

interface PersonalityInsightCardProps {
    spiritAnimal: SpiritAnimalType;
    strategy: PersonalityInvestmentStrategy;
}

const PersonalityInsightCard: React.FC<PersonalityInsightCardProps> = ({
    spiritAnimal,
    strategy,
}) => {
    const profile = SPIRIT_ANIMAL_PROFILES[spiritAnimal];

    return (
        <View style={[styles.container, { borderLeftColor: profile.color }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.emoji}>{profile.emoji}</Text>
                    <View>
                        <Text style={styles.title}>{profile.name}</Text>
                        <Text style={styles.subtitle}>{profile.philosophy}</Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: profile.color + '20' }]}>
                    <Text style={[styles.badgeText, { color: profile.color }]}>
                        Your Style
                    </Text>
                </View>
            </View>

            <Text style={styles.description}>{strategy.communicationStyle}</Text>

            {/* Asset Allocation */}
            <View style={styles.allocationSection}>
                <Text style={styles.sectionTitle}>Recommended Asset Mix</Text>
                <View style={styles.allocationBars}>
                    {Object.entries(strategy.preferredAssetMix)
                        .filter(([_, percentage]) => percentage > 0)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, percentage]) => (
                            <View key={type} style={styles.allocationRow}>
                                <View style={styles.allocationLabel}>
                                    <View style={[styles.allocationDot, { backgroundColor: getAssetColor(type) }]} />
                                    <Text style={styles.allocationText}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </View>
                                <View style={styles.allocationBarContainer}>
                                    <View
                                        style={[
                                            styles.allocationBar,
                                            {
                                                width: `${percentage}%`,
                                                backgroundColor: getAssetColor(type)
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.allocationPercentage}>{percentage}%</Text>
                            </View>
                        ))}
                </View>
            </View>

            {/* Key Advice */}
            <View style={styles.adviceSection}>
                <Text style={styles.sectionTitle}>Perfect For You</Text>
                {strategy.specificAdvice.slice(0, 3).map((advice, index) => (
                    <View key={index} style={styles.adviceRow}>
                        <Feather name="check-circle" size={16} color={profile.color} />
                        <Text style={styles.adviceText}>{advice}</Text>
                    </View>
                ))}
            </View>

            {/* Risk Appetite */}
            <View style={styles.riskSection}>
                <Feather name="activity" size={16} color={AIStudioTheme.colors.textSecondary} />
                <Text style={styles.riskText}>{strategy.riskAppetite}</Text>
            </View>
        </View>
    );
};

function getAssetColor(type: string): string {
    const colors: Record<string, string> = {
        equity: '#3B82F6',
        debt: '#10B981',
        gold: '#F59E0B',
        hybrid: '#8B5CF6',
        liquid: '#06B6D4'
    };
    return colors[type] || '#6B7280';
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.lg,
        marginHorizontal: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.md,
        borderLeftWidth: 4,
        ...AIStudioTheme.shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: AIStudioTheme.spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: AIStudioTheme.spacing.sm,
    },
    emoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    subtitle: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: AIStudioTheme.spacing.md,
    },
    allocationSection: {
        marginBottom: AIStudioTheme.spacing.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    allocationBars: {
        gap: AIStudioTheme.spacing.sm,
    },
    allocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: AIStudioTheme.spacing.sm,
    },
    allocationLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
        gap: 6,
    },
    allocationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    allocationText: {
        fontSize: 12,
        color: AIStudioTheme.colors.text,
        fontWeight: '500',
    },
    allocationBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: 4,
        overflow: 'hidden',
    },
    allocationBar: {
        height: '100%',
        borderRadius: 4,
    },
    allocationPercentage: {
        fontSize: 12,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
        width: 40,
        textAlign: 'right',
    },
    adviceSection: {
        marginBottom: AIStudioTheme.spacing.md,
    },
    adviceRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: AIStudioTheme.spacing.sm,
        marginBottom: AIStudioTheme.spacing.xs,
    },
    adviceText: {
        flex: 1,
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 18,
    },
    riskSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: AIStudioTheme.spacing.sm,
        paddingTop: AIStudioTheme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: AIStudioTheme.colors.border,
    },
    riskText: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        fontStyle: 'italic',
    },
});

export default PersonalityInsightCard;
