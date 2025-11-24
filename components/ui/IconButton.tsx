import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { AIStudioTheme } from '../../constants/aiStudioTheme';

interface IconButtonProps extends TouchableOpacityProps {
    name: keyof typeof Icon.glyphMap;
    size?: number;
    color?: string;
    variant?: 'default' | 'primary' | 'ghost';
}

export default function IconButton({
    name,
    size = 24,
    color = AIStudioTheme.colors.text,
    variant = 'default',
    style,
    ...props
}: IconButtonProps) {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'primary' && styles.primary,
                variant === 'ghost' && styles.ghost,
                style,
            ]}
            {...props}
        >
            <Icon
                name={name}
                size={size}
                color={variant === 'primary' ? AIStudioTheme.colors.background : color}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        borderRadius: AIStudioTheme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    primary: {
        backgroundColor: AIStudioTheme.colors.primary,
    },
    ghost: {
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
    },
});
