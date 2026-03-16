import React, { useEffect } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    style?: any;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function AnimatedNumber({
    value,
    duration = 1000,
    prefix = '',
    suffix = '',
    decimals = 0,
    style,
}: AnimatedNumberProps) {
    const animatedValue = useSharedValue(0);

    useEffect(() => {
        animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.out(Easing.cubic),
        });
    }, [value]);

    const animatedProps = useAnimatedProps(() => {
        const formattedValue = animatedValue.value.toFixed(decimals);
        const numberWithCommas = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return {
            text: `${prefix}${numberWithCommas}${suffix}`,
            defaultValue: `${prefix}${numberWithCommas}${suffix}`,
        } as any;
    });

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            value={`${prefix}${value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${suffix}`}
            animatedProps={animatedProps}
            style={[styles.text, style]}
        />
    );
}


const styles = StyleSheet.create({
    text: {
        fontSize: 32,
        fontWeight: 'bold',
    },
});
