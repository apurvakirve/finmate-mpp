import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Prediction } from '../types/aiInsights';

interface CompactPredictionCardProps {
    prediction: Prediction;
}

export default function CompactPredictionCard({ prediction }: CompactPredictionCardProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return '#EF4444';
            case 'warning': return '#F59E0B';
            default: return '#3B82F6';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return 'alert-circle';
            case 'warning': return 'alert-triangle';
            default: return 'info';
        }
    };

    return (
        <View style={[styles.container, { borderLeftColor: getSeverityColor(prediction.severity) }]}>
            <View style={styles.header}>
                <Icon
                    name={getSeverityIcon(prediction.severity) as any}
                    size={16}
                    color={getSeverityColor(prediction.severity)}
                />
                <Text style={styles.title} numberOfLines={1}>{prediction.title}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{prediction.message}</Text>
            {prediction.daysUntil !== undefined && (
                <Text style={styles.days}>{prediction.daysUntil} days</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    message: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 4,
    },
    days: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
});
