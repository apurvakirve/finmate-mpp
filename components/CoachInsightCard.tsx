import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CoachInsight } from '../lib/financialCoach';

interface CoachInsightCardProps {
    insight: CoachInsight;
    onPress?: () => void;
    onAction?: () => void;
}

export default function CoachInsightCard({ insight, onPress, onAction }: CoachInsightCardProps) {
    const getIconName = () => {
        switch (insight.type) {
            case 'warning': return 'alert-triangle';
            case 'kudos': return 'award';
            case 'action': return 'zap';
            default: return 'info';
        }
    };

    const getColors = () => {
        switch (insight.type) {
            case 'warning': return { bg: '#FFF3E0', border: '#FFB74D', icon: '#F57C00', text: '#E65100' };
            case 'kudos': return { bg: '#E8F5E9', border: '#81C784', icon: '#43A047', text: '#1B5E20' };
            case 'action': return { bg: '#E3F2FD', border: '#64B5F6', icon: '#1E88E5', text: '#0D47A1' };
            default: return { bg: '#F5F5F5', border: '#E0E0E0', icon: '#757575', text: '#424242' };
        }
    };

    const colors = getColors();

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.6)' }]}>
                    <Icon name={getIconName()} size={20} color={colors.icon} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>{insight.title}</Text>
                {insight.priority === 'high' && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Important</Text>
                    </View>
                )}
            </View>

            <Text style={[styles.message, { color: colors.text }]}>{insight.message}</Text>

            {insight.actionLabel && (
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.icon }]}
                    onPress={onAction}
                >
                    <Text style={styles.actionButtonText}>{insight.actionLabel}</Text>
                    <Icon name="arrow-right" size={14} color="white" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    message: {
        fontSize: 14,
        lineHeight: 20,
        opacity: 0.9,
        marginBottom: 4,
    },
    badge: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        marginRight: 4,
    },
});
