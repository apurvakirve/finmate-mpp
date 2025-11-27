
import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SpiritAnimalType } from '../types/spiritAnimal';

// Map spirit animal types to local images
const SPIRIT_ANIMAL_IMAGES: Record<SpiritAnimalType, any> = {
    eagle: require('../assets/spiritanimalsimg/eagle.png'),
    squirrel: require('../assets/spiritanimalsimg/squirral.png'), // Note: User's filename has typo
    butterfly: require('../assets/spiritanimalsimg/butterfly.png'),
    lion: require('../assets/spiritanimalsimg/lion.png'),
    capybara: require('../assets/spiritanimalsimg/capybara.png'),
    fox: require('../assets/spiritanimalsimg/fox.png'),
};

interface FinancialOverviewCardProps {
    walletBalance: number;
    cashBalance: number;
    todayIncome: number;
    todaySpending: number;
    showTotal: boolean;
    onToggle: () => void;
    spiritAnimal?: SpiritAnimalType;
}

export default function FinancialOverviewCard({
    walletBalance,
    cashBalance,
    todayIncome,
    todaySpending,
    showTotal,
    onToggle,
    spiritAnimal
}: FinancialOverviewCardProps) {
    const totalBalance = walletBalance + cashBalance;
    const spiritAnimalImage = spiritAnimal ? SPIRIT_ANIMAL_IMAGES[spiritAnimal] : null;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onToggle}
            activeOpacity={0.8}
        >
            {/* Separator Line - zIndex 0 (Bottom) */}
            <View style={styles.separatorLine} />

            {/* Spirit Animal Image - zIndex 1 (Middle) */}
            {spiritAnimalImage && (
                <View style={styles.spiritAnimalContainer}>
                    <Image
                        source={spiritAnimalImage}
                        style={styles.spiritAnimalImage}
                        resizeMode="contain"
                    />
                </View>
            )}

            {/* Content - zIndex 2 (Top) */}
            <View style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Icon name="credit-card" size={16} color={AIStudioTheme.colors.primary} />
                        <Text style={styles.headerTitle}>
                            Wallet Balance
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onToggle} style={styles.toggleButton}>

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

            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.lg,
        marginHorizontal: 20,
        marginTop: AIStudioTheme.spacing.md,
        marginBottom: AIStudioTheme.spacing.sm,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.md,
        overflow: 'visible', // Allow image to pop out
        minHeight: 220,
        position: 'relative',
    },
    separatorLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 120, // Approximate position between balance and activity
        height: 1,
        backgroundColor: AIStudioTheme.colors.border,
        zIndex: 0,
    },
    spiritAnimalContainer: {
        position: 'absolute',
        right: -40,
        top: -20, // Center vertically on the card
        width: 200,
        height: 200,
        zIndex: 1,
        opacity: 1,
    },
    spiritAnimalImage: {
        width: '100%',
        height: '100%',
    },
    contentContainer: {
        zIndex: 2,
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
        marginBottom: 24,
        zIndex: 1,
    },
    activitySection: {
        paddingTop: 20,
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

