/**
 * Insurance Recommendations Card
 * Displays personalized insurance suggestions based on financial profile
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { InsuranceRecommendation } from '../lib/InsuranceRecommendation';

interface InsuranceRecommendationsCardProps {
    recommendations: InsuranceRecommendation[];
    onLearnMore?: (insurance: InsuranceRecommendation) => void;
}

const InsuranceRecommendationsCard: React.FC<InsuranceRecommendationsCardProps> = ({
    recommendations,
    onLearnMore,
}) => {
    if (recommendations.length === 0) return null;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#EF4444';
            case 'high': return '#F59E0B';
            case 'medium': return '#3B82F6';
            default: return '#6B7280';
        }
    };

    const getInsuranceIcon = (type: string) => {
        switch (type) {
            case 'health': return 'heart';
            case 'term-life': return 'shield';
            case 'critical-illness': return 'alert-circle';
            case 'accident': return 'activity';
            default: return 'file-text';
        }
    };

    const formatInsuranceType = (type: string) => {
        return type.split('-').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Feather name="shield" size={20} color="#10B981" />
                    <Text style={styles.title}>Insurance Recommendations</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>AI Powered</Text>
                </View>
            </View>

            <Text style={styles.subtitle}>
                Protect your wealth and family with smart insurance coverage
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsContainer}>
                {recommendations.slice(0, 3).map((insurance, index) => (
                    <View key={index} style={styles.insuranceCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, { backgroundColor: getPriorityColor(insurance.priority) + '20' }]}>
                                <Feather
                                    name={getInsuranceIcon(insurance.type) as any}
                                    size={24}
                                    color={getPriorityColor(insurance.priority)}
                                />
                            </View>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insurance.priority) }]}>
                                <Text style={styles.priorityText}>{insurance.priority.toUpperCase()}</Text>
                            </View>
                        </View>

                        <Text style={styles.insuranceType}>{formatInsuranceType(insurance.type)}</Text>

                        <View style={styles.coverageSection}>
                            <Text style={styles.coverageLabel}>Suggested Coverage</Text>
                            <Text style={styles.coverageAmount}>
                                ₹{(insurance.suggestedCoverage / 100000).toFixed(0)} L
                            </Text>
                        </View>

                        <View style={styles.premiumSection}>
                            <Text style={styles.premiumLabel}>Monthly Premium</Text>
                            <Text style={styles.premiumAmount}>₹{insurance.monthlyPremium}</Text>
                        </View>

                        {insurance.savingsPotential > 0 && (
                            <View style={styles.savingsSection}>
                                <Feather name="trending-up" size={14} color="#10B981" />
                                <Text style={styles.savingsText}>
                                    Saves up to ₹{(insurance.savingsPotential / 100000).toFixed(1)}L
                                </Text>
                            </View>
                        )}

                        <View style={styles.reasoningSection}>
                            {insurance.reasoning.slice(0, 2).map((reason, idx) => (
                                <View key={idx} style={styles.reasonRow}>
                                    <Feather name="check" size={12} color="#10B981" />
                                    <Text style={styles.reasonText} numberOfLines={2}>{reason}</Text>
                                </View>
                            ))}
                        </View>

                        {onLearnMore && (
                            <TouchableOpacity
                                style={styles.learnMoreButton}
                                onPress={() => onLearnMore(insurance)}
                            >
                                <Text style={styles.learnMoreText}>Learn More</Text>
                                <Feather name="arrow-right" size={14} color="#3B82F6" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>

            {recommendations.length > 3 && (
                <Text style={styles.moreText}>
                    +{recommendations.length - 3} more recommendation{recommendations.length - 3 > 1 ? 's' : ''}
                </Text>
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
        ...AIStudioTheme.shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: AIStudioTheme.spacing.xs,
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
    badge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#3B82F6',
    },
    subtitle: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: AIStudioTheme.spacing.md,
    },
    cardsContainer: {
        marginHorizontal: -AIStudioTheme.spacing.lg,
        paddingHorizontal: AIStudioTheme.spacing.lg,
    },
    insuranceCard: {
        width: 280,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        borderRadius: AIStudioTheme.borderRadius.md,
        padding: AIStudioTheme.spacing.md,
        marginRight: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: AIStudioTheme.spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    insuranceType: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    coverageSection: {
        marginBottom: AIStudioTheme.spacing.sm,
    },
    coverageLabel: {
        fontSize: 11,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 2,
    },
    coverageAmount: {
        fontSize: 20,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    premiumSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: AIStudioTheme.spacing.sm,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    premiumLabel: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
    },
    premiumAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#10B981',
    },
    savingsSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: AIStudioTheme.spacing.sm,
    },
    savingsText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '600',
    },
    reasoningSection: {
        marginBottom: AIStudioTheme.spacing.sm,
        gap: 4,
    },
    reasonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    reasonText: {
        flex: 1,
        fontSize: 11,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 16,
    },
    learnMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: AIStudioTheme.spacing.sm,
        borderTopWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        marginTop: AIStudioTheme.spacing.xs,
    },
    learnMoreText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
    },
    moreText: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        textAlign: 'center',
        marginTop: AIStudioTheme.spacing.sm,
    },
});

export default InsuranceRecommendationsCard;
