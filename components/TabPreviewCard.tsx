import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';

interface TabPreviewCardProps {
    icon: string;
    iconColor: string;
    iconBgColor: string;
    title: string;
    subtitle: string;
    badge?: number;
    onPress: () => void;
}

export default function TabPreviewCard({
    icon,
    iconColor,
    iconBgColor,
    title,
    subtitle,
    badge,
    onPress
}: TabPreviewCardProps) {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                {/* Icon */}
                <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                    <Icon name={icon as any} size={24} color={iconColor} />
                </View>

                {/* Text Content */}
                <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>{title}</Text>
                        {badge !== undefined && badge > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{badge}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
                </View>

                {/* Arrow */}
                <Icon name="chevron-right" size={20} color={AIStudioTheme.colors.textMuted} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        marginHorizontal: 8,
        marginBottom: AIStudioTheme.spacing.sm,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    badge: {
        backgroundColor: AIStudioTheme.colors.error,
        borderRadius: AIStudioTheme.borderRadius.full,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
    },
});
