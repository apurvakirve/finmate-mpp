import { Colors } from '@/constants/theme';
import { TouchableOpacity, TouchableOpacityProps, useColorScheme, View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
    variant?: 'default' | 'outlined' | 'elevated';
    onPress?: TouchableOpacityProps['onPress'];
}

export function Card({ style, variant = 'default', onPress, ...otherProps }: CardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const cardStyle = {
        backgroundColor: theme.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        ...(variant === 'elevated' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
        }),
        ...(variant === 'outlined' && {
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: 'transparent',
        }),
    };

    if (onPress) {
        return (
            <TouchableOpacity style={[cardStyle, style]} onPress={onPress} activeOpacity={0.7} {...(otherProps as any)}>
                {otherProps.children}
            </TouchableOpacity>
        );
    }

    return <View style={[cardStyle, style]} {...otherProps} />;
}
