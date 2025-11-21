import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Anomaly } from '../types/aiInsights';

interface AnomalyAlertProps {
    anomaly: Anomaly;
    onConfirm?: () => void;
    onFlag?: () => void;
    onDismiss?: () => void;
}

export default function AnomalyAlert({ anomaly, onConfirm, onFlag, onDismiss }: AnomalyAlertProps) {
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return '#DC2626';
            case 'medium':
                return '#F59E0B';
            default:
                return '#3B82F6';
        }
    };

    const getSeverityBg = (severity: string) => {
        switch (severity) {
            case 'high':
                return '#FEE2E2';
            case 'medium':
                return '#FEF3C7';
            default:
                return '#DBEAFE';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: getSeverityBg(anomaly.severity) }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: getSeverityColor(anomaly.severity) }]}>
                    <Icon name="alert-triangle" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Unusual Spending Detected</Text>
                    <Text style={styles.category}>{anomaly.category}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.message}>{anomaly.message}</Text>

                <View style={styles.comparisonContainer}>
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>This Transaction</Text>
                        <Text style={[styles.comparisonValue, { color: getSeverityColor(anomaly.severity) }]}>
                            ₹{anomaly.amount.toLocaleString('en-IN')}
                        </Text>
                    </View>
                    <Icon name="arrow-right" size={20} color="#9CA3AF" />
                    <View style={styles.comparisonItem}>
                        <Text style={styles.comparisonLabel}>Normal Amount</Text>
                        <Text style={styles.comparisonValue}>
                            ₹{anomaly.normalAmount.toLocaleString('en-IN')}
                        </Text>
                    </View>
                </View>

                <View style={styles.deviationBadge}>
                    <Text style={styles.deviationText}>
                        {anomaly.deviationMultiple}× higher than usual
                    </Text>
                </View>
            </View>

            <View style={styles.actions}>
                {onConfirm && !anomaly.confirmed && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.confirmButton]}
                        onPress={onConfirm}
                    >
                        <Icon name="check" size={16} color="#FFFFFF" />
                        <Text style={styles.confirmButtonText}>This is Expected</Text>
                    </TouchableOpacity>
                )}

                {onFlag && !anomaly.flagged && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.flagButton]}
                        onPress={onFlag}
                    >
                        <Icon name="flag" size={16} color="#DC2626" />
                        <Text style={styles.flagButtonText}>Flag as Error</Text>
                    </TouchableOpacity>
                )}

                {onDismiss && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.dismissButton]}
                        onPress={onDismiss}
                    >
                        <Text style={styles.dismissButtonText}>Dismiss</Text>
                    </TouchableOpacity>
                )}
            </View>

            {anomaly.confirmed && (
                <View style={styles.statusBadge}>
                    <Icon name="check-circle" size={14} color="#10B981" />
                    <Text style={styles.statusText}>Confirmed</Text>
                </View>
            )}

            {anomaly.flagged && (
                <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Icon name="flag" size={14} color="#DC2626" />
                    <Text style={[styles.statusText, { color: '#DC2626' }]}>Flagged</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
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
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    category: {
        fontSize: 13,
        color: '#6B7280',
        textTransform: 'capitalize',
    },
    content: {
        marginBottom: 16,
    },
    message: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 16,
    },
    comparisonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    comparisonItem: {
        flex: 1,
        alignItems: 'center',
    },
    comparisonLabel: {
        fontSize: 11,
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    comparisonValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    deviationBadge: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
    },
    deviationText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        flex: 1,
        minWidth: '45%',
    },
    confirmButton: {
        backgroundColor: '#10B981',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    flagButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DC2626',
    },
    flagButtonText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
    },
    dismissButton: {
        backgroundColor: '#F3F4F6',
    },
    dismissButtonText: {
        color: '#6B7280',
        fontSize: 13,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#D1FAE5',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10B981',
        marginLeft: 6,
    },
});
