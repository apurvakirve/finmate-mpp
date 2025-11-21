import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Prediction } from '../types/aiInsights';

interface PredictionCardProps {
    prediction: Prediction;
    onAction?: () => void;
}

export default function PredictionCard({ prediction, onAction }: PredictionCardProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return '#EF4444';
            case 'warning':
                return '#F59E0B';
            default:
                return '#3B82F6';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'alert-circle';
            case 'warning':
                return 'alert-triangle';
            default:
                return 'info';
        }
    };

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case 'critical':
                return '#FEE2E2';
            case 'warning':
                return '#FEF3C7';
            default:
                return '#DBEAFE';
        }
    };

    return (
        <View style={[styles.container, { borderLeftColor: getSeverityColor(prediction.severity) }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getSeverityBg(prediction.severity) }]}>
                    <Icon
                        name={getSeverityIcon(prediction.severity) as any}
                        size={20}
                        color={getSeverityColor(prediction.severity)}
                    />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{prediction.title}</Text>
                    {prediction.confidence && (
                        <Text style={styles.confidence}>{prediction.confidence}% confidence</Text>
                    )}
                </View>
            </View>

            <Text style={styles.message}>{prediction.message}</Text>

            {prediction.daysUntil !== undefined && (
                <View style={styles.daysContainer}>
                    <Icon name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.daysText}>
                        {prediction.daysUntil} days {prediction.daysUntil === 1 ? 'remaining' : 'remaining'}
                    </Text>
                </View>
            )}

            {prediction.amount !== undefined && (
                <View style={styles.amountContainer}>
                    <Text style={styles.amountLabel}>Amount:</Text>
                    <Text style={styles.amountValue}>₹{prediction.amount.toLocaleString('en-IN')}</Text>
                </View>
            )}

            {onAction && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction}>
                    <Text style={styles.actionText}>View Details</Text>
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
        marginVertical: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    confidence: {
        fontSize: 12,
        color: '#6B7280',
    },
    message: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    daysContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    daysText: {
        fontSize: 13,
        color: '#374151',
        marginLeft: 8,
        fontWeight: '600',
    },
    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    amountLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    amountValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '700',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginTop: 8,
    },
    actionText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginRight: 4,
    },
});
