/**
 * AnimatedCard - Reusable card component with press animations
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SpringConfigs } from '../../constants/animations';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/designTokens';

interface AnimatedCardProps {
    children: React.ReactNode;
    onPress?: () => void;
    style?: ViewStyle;
    disabled?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    onPress,
    style,
    disabled = false,
}) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(Shadows.md.shadowOpacity);

    const tap = Gesture.Tap()
        .enabled(!disabled)
        .onBegin(() => {
            scale.value = withSpring(0.98, SpringConfigs.stiff);
            shadowOpacity.value = withSpring(Shadows.sm.shadowOpacity);
        })
        .onFinalize(() => {
            scale.value = withSpring(1, SpringConfigs.gentle);
            shadowOpacity.value = withSpring(Shadows.md.shadowOpacity);
        })
        .onEnd(() => {
            if (onPress) {
                onPress();
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        shadowOpacity: shadowOpacity.value,
    }));

    return (
        <GestureDetector gesture={tap}>
            <Animated.View style={[styles.card, animatedStyle, style]}>
                {children}
            </Animated.View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card.light,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.md,
    },
});
