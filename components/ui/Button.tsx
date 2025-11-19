import { Colors } from '@/constants/theme';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, useColorScheme } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

export function Button({ title, variant = 'primary', size = 'md', loading, style, disabled, ...props }: ButtonProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (disabled) return theme.icon;
        switch (variant) {
            case 'primary': return theme.primary;
            case 'secondary': return theme.accent;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            default: return theme.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return theme.background;
        switch (variant) {
            case 'primary': return theme.background; // Inverted for primary
            case 'secondary': return theme.primary;
            case 'outline': return theme.primary;
            case 'ghost': return theme.primary;
            default: return theme.background;
        }
    };

    const styles = StyleSheet.create({
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 100,
            backgroundColor: getBackgroundColor(),
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor: theme.primary,
            paddingHorizontal: size === 'sm' ? 16 : size === 'lg' ? 32 : 24,
            paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
            opacity: disabled ? 0.7 : 1,
        },
        text: {
            color: getTextColor(),
            fontSize: size === 'sm' ? 14 : size === 'lg' ? 18 : 16,
            fontWeight: '600',
        },
    });

    return (
        <TouchableOpacity
            style={[styles.button, style]}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={styles.text}>{title}</Text>
            )}
        </TouchableOpacity>
    );
}
