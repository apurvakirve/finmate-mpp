import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CoachingAdvice } from '../types/aiInsights';

interface QuickCoachingTipProps {
    advice: CoachingAdvice;
}

export default function QuickCoachingTip({ advice }: QuickCoachingTipProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'kudos': return { name: 'award', color: '#10B981' };
            case 'warning': return { name: 'alert-triangle', color: '#F59E0B' };
            case 'action': return { name: 'zap', color: '#3B82F6' };
            default: return { name: 'info', color: '#6B7280' };
        }
    };

    const icon = getIcon(advice.type);

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                <Icon name={icon.name as any} size={14} color={icon.color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={1}>{advice.title}</Text>
                <Text style={styles.message} numberOfLines={2}>{advice.message}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 10,
        marginBottom: 8,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 3,
    },
    message: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 16,
    },
});
