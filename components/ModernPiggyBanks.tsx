/**
 * Modern Piggy Bank UI
 * Matches reference design with allocation plans and goals
 */

import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/designTokens';

interface Goal {
    id: string;
    name: string;
    current: number;
    target: number;
}

interface Allocation {
    id: string;
    name: string;
    amount: number;
    color: string;
}

interface ModernPiggyBanksProps {
    userId: string;
    todayIncome: number;
    todayNetIncome: number;
    cashBalance: number;
    transactions: any[];
}

const ModernPiggyBanks: React.FC<ModernPiggyBanksProps> = ({
    todayNetIncome,
}) => {
    const [netEarned, setNetEarned] = useState(todayNetIncome || 2000);
    const [goals, setGoals] = useState<Goal[]>([
        { id: '1', name: 'Phone', current: 30000, target: 30000 },
        { id: '2', name: 'Phone', current: 25000, target: 30000 },
        { id: '3', name: 'Car', current: 20000, target: 30000 },
        { id: '4', name: 'Car', current: 15000, target: 30000 },
    ]);

    const [allocations, setAllocations] = useState<Allocation[]>([
        { id: '1', name: 'EMIs & Loans', amount: 2000, color: '#EC4899' },
        { id: '2', name: 'EMIs & Loans', amount: 2000, color: '#EC4899' },
        { id: '3', name: 'EMIs & Loans', amount: 2000, color: '#F97316' },
        { id: '4', name: 'EMIs & Loans', amount: 2000, color: '#10B981' },
        { id: '5', name: 'EMIs & Loans', amount: 2000, color: '#A855F7' },
        { id: '6', name: 'EMIs & Loans', amount: 2000, color: '#EC4899' },
    ]);

    const [fixedNeeds, setFixedNeeds] = useState([
        { id: '1', name: 'EMIs & Loans', amount: 1200, target: 2000, color: '#EC4899' },
        { id: '2', name: 'EMIs & Loans', amount: 1200, target: 2000, color: '#A855F7' },
    ]);

    // State for confirmed allocation
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [confirmedAllocations, setConfirmedAllocations] = useState<Allocation[]>([]);
    const [confirmedTotal, setConfirmedTotal] = useState(0);
    const [confirmedNetEarned, setConfirmedNetEarned] = useState(0);

    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

    const updateAllocation = (id: string, newAmount: number) => {
        setAllocations(prev =>
            prev.map(a => (a.id === id ? { ...a, amount: newAmount } : a))
        );
    };

    const handleConfirmAllocation = () => {
        // Save the current allocation plan
        setConfirmedAllocations([...allocations]);
        setConfirmedTotal(totalAllocated);
        setConfirmedNetEarned(netEarned);
        setIsConfirmed(true);
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Net Earned Today */}
            <View style={styles.card}>
                <Text style={styles.cardLabel}>Net earned today</Text>
                <View style={styles.row}>
                    <Text style={styles.largeAmount}>${netEarned}</Text>
                    <TouchableOpacity style={styles.editButton}>
                        <Feather name="edit-2" size={20} color={Colors.primary.solid} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Goals Section */}
            <View style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Goals</Text>
                    <TouchableOpacity>
                        <Feather name="edit-2" size={18} color={Colors.primary.solid} />
                    </TouchableOpacity>
                </View>

                {goals.map((goal) => (
                    <View key={goal.id} style={styles.goalItem}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.goalAmount}>
                            {goal.current}/{goal.target}
                        </Text>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: `${(goal.current / goal.target) * 100}%`,
                                        backgroundColor: Colors.primary.solid,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </View>

            {/* Reminder */}
            <View style={styles.reminderCard}>
                <View style={styles.row}>
                    <View style={styles.flex1}>
                        <Text style={styles.reminderTitle}>Reminder</Text>
                        <Text style={styles.reminderText}>Investment day coming in 10 days</Text>
                    </View>
                    <TouchableOpacity>
                        <Feather name="bell" size={20} color={Colors.primary.solid} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Allocation Plan */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Allocation Plan</Text>

                <View style={styles.totalAllocated}>
                    <Text style={styles.totalLabel}>Total Allocated</Text>
                    <Text style={[styles.totalAmount, { color: Colors.primary.solid }]}>
                        ${totalAllocated}/${netEarned}
                    </Text>
                </View>

                {allocations.map((allocation) => (
                    <View key={allocation.id} style={styles.allocationItem}>
                        <View style={styles.allocationHeader}>
                            <View style={styles.row}>
                                <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                                <Text style={styles.allocationName}>{allocation.name}</Text>
                            </View>
                            <Text style={[styles.allocationAmount, { color: allocation.color }]}>
                                ${allocation.amount}
                            </Text>
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={netEarned}
                            value={allocation.amount}
                            onValueChange={(value) => updateAllocation(allocation.id, Math.round(value))}
                            minimumTrackTintColor={allocation.color}
                            maximumTrackTintColor={Colors.gray[200]}
                            thumbTintColor={allocation.color}
                        />
                    </View>
                ))}

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAllocation}>
                    <Text style={styles.confirmButtonText}>Confirm Allocation for Today</Text>
                </TouchableOpacity>
            </View>

            {/* Confirmed Allocation Display */}
            {isConfirmed && (
                <View style={styles.confirmedCard}>
                    <View style={styles.confirmedHeader}>
                        <Feather name="check-circle" size={24} color="#10B981" />
                        <Text style={styles.confirmedTitle}>Allocation Confirmed!</Text>
                    </View>

                    <View style={styles.confirmedSummary}>
                        <Text style={styles.confirmedLabel}>Total Allocated</Text>
                        <Text style={styles.confirmedAmount}>
                            ${confirmedTotal} / ${confirmedNetEarned}
                        </Text>
                        <Text style={styles.confirmedPercentage}>
                            {Math.round((confirmedTotal / confirmedNetEarned) * 100)}% of today's earnings
                        </Text>
                    </View>

                    <View style={styles.confirmedDivider} />

                    <Text style={styles.confirmedBreakdownTitle}>Allocation Breakdown</Text>

                    {confirmedAllocations.map((allocation) => (
                        <View key={allocation.id} style={styles.confirmedAllocationItem}>
                            <View style={styles.confirmedAllocationLeft}>
                                <View style={[styles.colorDot, { backgroundColor: allocation.color }]} />
                                <Text style={styles.confirmedAllocationName}>{allocation.name}</Text>
                            </View>
                            <View style={styles.confirmedAllocationRight}>
                                <Text style={[styles.confirmedAllocationAmount, { color: allocation.color }]}>
                                    ${allocation.amount}
                                </Text>
                                <Text style={styles.confirmedAllocationPercent}>
                                    {Math.round((allocation.amount / confirmedNetEarned) * 100)}%
                                </Text>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={styles.editConfirmedButton}
                        onPress={() => setIsConfirmed(false)}
                    >
                        <Feather name="edit-2" size={16} color={Colors.primary.solid} />
                        <Text style={styles.editConfirmedButtonText}>Edit Allocation</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Fixed Needs */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Fixed Needs</Text>

                <View style={styles.fixedNeedsGrid}>
                    {fixedNeeds.map((need) => (
                        <View key={need.id} style={styles.fixedNeedCard}>
                            <View style={styles.fixedNeedHeader}>
                                <View style={[styles.colorDot, { backgroundColor: need.color }]} />
                                <Text style={styles.fixedNeedName}>{need.name}</Text>
                            </View>

                            <Text style={styles.fixedNeedAmount}>${need.amount}</Text>
                            <Text style={styles.fixedNeedTarget}>Target: ${need.target}</Text>

                            <View style={styles.progressBarContainer}>
                                <View
                                    style={[
                                        styles.progressBar,
                                        {
                                            width: `${(need.amount / need.target) * 100}%`,
                                            backgroundColor: need.color,
                                        },
                                    ]}
                                />
                            </View>

                            <Text style={styles.fixedNeedPercent}>
                                {Math.round((need.amount / need.target) * 100)}%
                            </Text>

                            <View style={styles.fixedNeedActions}>
                                <TouchableOpacity style={styles.actionButton}>
                                    <Text style={styles.actionButtonText}>Move Money</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.actionButtonOutline]}>
                                    <Text style={[styles.actionButtonText, styles.actionButtonTextOutline]}>
                                        Set Target
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.light,
        padding: Spacing.md,
    },
    card: {
        backgroundColor: Colors.card.light,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.md,
    },
    reminderCard: {
        backgroundColor: Colors.card.light,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    flex1: {
        flex: 1,
    },
    cardLabel: {
        ...Typography.caption,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    largeAmount: {
        ...Typography.display,
        color: Colors.text.primary,
    },
    editButton: {
        padding: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        ...Typography.title,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    goalItem: {
        marginBottom: Spacing.md,
    },
    goalName: {
        ...Typography.body,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    goalAmount: {
        ...Typography.caption,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: Colors.gray[200],
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: BorderRadius.full,
    },
    reminderTitle: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    reminderText: {
        ...Typography.caption,
        color: Colors.text.secondary,
    },
    totalAllocated: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    totalLabel: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    totalAmount: {
        ...Typography.body,
        fontWeight: '700',
    },
    allocationItem: {
        marginBottom: Spacing.lg,
        backgroundColor: Colors.gray[50],
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    allocationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: Spacing.sm,
    },
    allocationName: {
        ...Typography.body,
        color: Colors.text.primary,
    },
    allocationAmount: {
        ...Typography.body,
        fontWeight: '700',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    confirmButton: {
        backgroundColor: Colors.primary.solid,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    confirmButtonText: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.text.inverse,
    },
    fixedNeedsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    fixedNeedCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: Colors.gray[50],
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    fixedNeedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    fixedNeedName: {
        ...Typography.caption,
        color: Colors.text.primary,
    },
    fixedNeedAmount: {
        ...Typography.title,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    fixedNeedTarget: {
        ...Typography.small,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
    },
    fixedNeedPercent: {
        ...Typography.small,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    fixedNeedActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        backgroundColor: Colors.primary.solid,
        borderRadius: BorderRadius.sm,
        padding: Spacing.sm,
        alignItems: 'center',
    },
    actionButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary.solid,
    },
    actionButtonText: {
        ...Typography.small,
        fontWeight: '600',
        color: Colors.text.inverse,
    },
    actionButtonTextOutline: {
        color: Colors.primary.solid,
    },
    // Confirmed Allocation Styles
    confirmedCard: {
        backgroundColor: '#F0FDF4', // Light green background
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 2,
        borderColor: '#10B981',
        ...Shadows.md,
    },
    confirmedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    confirmedTitle: {
        ...Typography.title,
        color: '#10B981',
        fontWeight: '700',
    },
    confirmedSummary: {
        alignItems: 'center',
        paddingVertical: Spacing.md,
        marginBottom: Spacing.sm,
    },
    confirmedLabel: {
        ...Typography.caption,
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
    },
    confirmedAmount: {
        ...Typography.display,
        color: '#10B981',
        fontWeight: '700',
        marginBottom: 4,
    },
    confirmedPercentage: {
        ...Typography.body,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    confirmedDivider: {
        height: 1,
        backgroundColor: '#10B981',
        opacity: 0.3,
        marginVertical: Spacing.md,
    },
    confirmedBreakdownTitle: {
        ...Typography.body,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    confirmedAllocationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card.light,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.border.light,
    },
    confirmedAllocationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    confirmedAllocationName: {
        ...Typography.body,
        color: Colors.text.primary,
        fontWeight: '600',
    },
    confirmedAllocationRight: {
        alignItems: 'flex-end',
    },
    confirmedAllocationAmount: {
        ...Typography.body,
        fontWeight: '700',
        marginBottom: 2,
    },
    confirmedAllocationPercent: {
        ...Typography.small,
        color: Colors.text.secondary,
    },
    editConfirmedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.card.light,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary.solid,
        gap: Spacing.sm,
    },
    editConfirmedButtonText: {
        ...Typography.body,
        fontWeight: '600',
        color: Colors.primary.solid,
    },
});

export default ModernPiggyBanks;
