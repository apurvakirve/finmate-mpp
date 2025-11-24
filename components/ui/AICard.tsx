import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { AIStudioTheme } from '../../constants/aiStudioTheme';

interface AICardProps extends ViewProps {
    variant?: 'default' | 'elevated' | 'outlined';
    glow?: boolean;
    children: React.ReactNode;
}

export default function AICard({ variant = 'default', glow = false, children, style, ...props }: AICardProps) {
    return (
        <View
            style={[
                styles.card,
                variant === 'elevated' && styles.elevated,
                variant === 'outlined' && styles.outlined,
                glow && styles.glow,
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: AIStudioTheme.borderRadius.lg,
        padding: AIStudioTheme.spacing.md,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
    },
    elevated: {
        ...AIStudioTheme.shadows.md,
    },
    outlined: {
        borderColor: AIStudioTheme.colors.borderLight,
    },
    glow: {
        shadowColor: AIStudioTheme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
});
