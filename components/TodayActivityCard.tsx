import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface TodayActivityCardProps {
    income: number;
    spending: number;
}

export default function TodayActivityCard({ income, spending }: TodayActivityCardProps) {
    const net = income - spending;
    const isPositive = net >= 0;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Today's Activity</Text>

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Icon name="arrow-down-left" size={20} color="#4CAF50" />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Income</Text>
                        <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                            +₹{income.toFixed(0)}
                        </Text>
                    </View>
                </View>

                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: '#FFEBEE' }]}>
                        <Icon name="arrow-up-right" size={20} color="#F44336" />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Spending</Text>
                        <Text style={[styles.statValue, { color: '#F44336' }]}>
                            -₹{spending.toFixed(0)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.netContainer}>
                <Text style={styles.netLabel}>Net Change</Text>
                <View style={styles.netValueContainer}>
                    <Text style={[styles.netValue, { color: isPositive ? '#4CAF50' : '#F44336' }]}>
                        {isPositive ? '+' : ''}₹{net.toFixed(0)}
                    </Text>
                    <Text style={styles.netEmoji}>{isPositive ? '✅' : '⚠️'}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    netContainer: {
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e5e5',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    netLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    netValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    netValue: {
        fontSize: 20,
        fontWeight: '700',
        marginRight: 8,
    },
    netEmoji: {
        fontSize: 20,
    },
});
