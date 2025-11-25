import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';

export interface MetricCardProps {
    icon: string;
    iconColor: string;
    iconBgColor: string;
    label: string;
    value: string;
    trend?: {
        direction: 'up' | 'down' | 'neutral';
        value: string;
    };
    onPress?: () => void;
}

export default function MetricCard({
    icon,
    iconColor,
    iconBgColor,
    label,
    value,
    trend,
    onPress
}: MetricCardProps) {
    const getTrendIcon = () => {
        if (!trend) return null;
        switch (trend.direction) {
            case 'up':
                return 'trending-up';
            case 'down':
                return 'trending-down';
            default:
                return 'minus';
        }
    };

    const getTrendColor = () => {
        if (!trend) return AIStudioTheme.colors.textMuted;
        switch (trend.direction) {
            case 'up':
                return '#10B981';
            case 'down':
                return '#EF4444';
            default:
                return AIStudioTheme.colors.textMuted;
        }
    };

    const CardContent = (
        <View style={styles.container}>
            {/* Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Icon name={icon as any} size={24} color={iconColor} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>

                {/* Trend Indicator */}
                {trend && (
                    <View style={styles.trendContainer}>
                        <Icon
                            name={getTrendIcon() as any}
                            size={14}
                            color={getTrendColor()}
                        />
                        <Text style={[styles.trendText, { color: getTrendColor() }]}>
                            {trend.value}
                        </Text>
                    </View>
                )}
            </View>

            {/* Arrow indicator if pressable */}
            {onPress && (
                <View style={styles.arrowContainer}>
                    <Icon name="chevron-right" size={18} color={AIStudioTheme.colors.textMuted} />
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                style={styles.wrapper}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {CardContent}
            </TouchableOpacity>
        );
    }

    return <View style={styles.wrapper}>{CardContent}</View>;
}

const styles = StyleSheet.create({
    wrapper: {
        width: '48%',
        marginBottom: 12,
    },
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
        minHeight: 170,
        height: 170,
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    label: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        marginBottom: 4,
        fontWeight: '500',
        lineHeight: 18,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
        marginBottom: 4,
        lineHeight: 28,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    arrowContainer: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
});
