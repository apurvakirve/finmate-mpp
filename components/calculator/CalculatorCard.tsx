import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface CalculatorCardProps {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    color?: string;
}

export function CalculatorCard({
    title,
    description,
    icon,
    onPress,
    color,
}: CalculatorCardProps) {
    const theme = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}>
            <AnimatedCard style={[styles.card, animatedStyle]} elevation={2}>
                <Card.Content style={styles.content}>
                    <MaterialCommunityIcons
                        name={icon as any}
                        size={32}
                        color={color || theme.colors.primary}
                    />
                    <Text variant="titleMedium" style={styles.title}>
                        {title}
                    </Text>
                    <Text variant="bodySmall" style={styles.description}>
                        {description}
                    </Text>
                </Card.Content>
            </AnimatedCard>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 8,
        borderRadius: 16,
    },
    content: {
        padding: 16,
        alignItems: 'center',
        minHeight: 140,
    },
    title: {
        marginTop: 12,
        marginBottom: 4,
        fontWeight: '600',
        textAlign: 'center',
    },
    description: {
        textAlign: 'center',
        opacity: 0.7,
    },
});
