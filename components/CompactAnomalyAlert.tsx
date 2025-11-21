import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Anomaly } from '../types/aiInsights';

interface CompactAnomalyAlertProps {
    anomaly: Anomaly;
    onPress?: () => void;
}

export default function CompactAnomalyAlert({ anomaly, onPress }: CompactAnomalyAlertProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return '#DC2626';
            case 'medium': return '#F59E0B';
            default: return '#3B82F6';
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: getSeverityColor(anomaly.severity) + '15' }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Icon name="alert-triangle" size={16} color={getSeverityColor(anomaly.severity)} />
                <Text style={[styles.category, { color: getSeverityColor(anomaly.severity) }]}>
                    {anomaly.category.toUpperCase()}
                </Text>
                <Text style={styles.badge}>{anomaly.deviationMultiple}×</Text>
            </View>
            <Text style={styles.amount}>₹{anomaly.amount.toLocaleString('en-IN')}</Text>
            <Text style={styles.normal}>Normal: ₹{anomaly.normalAmount.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 6,
    },
    category: {
        fontSize: 11,
        fontWeight: '700',
        flex: 1,
    },
    badge: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    normal: {
        fontSize: 11,
        color: '#6B7280',
    },
});
