/**
 * Animation Presets - FinMate App
 * Reusable animation configurations using Reanimated 3
 */

import { Easing, withSpring, withTiming } from 'react-native-reanimated';

// Spring Configurations
export const SpringConfigs = {
    gentle: {
        damping: 20,
        stiffness: 90,
        mass: 1,
    },
    bouncy: {
        damping: 10,
        stiffness: 100,
        mass: 0.8,
    },
    stiff: {
        damping: 15,
        stiffness: 150,
        mass: 0.5,
    },
};

// Timing Configurations
export const TimingConfigs = {
    fast: {
        duration: 200,
        easing: Easing.out(Easing.cubic),
    },
    normal: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
    },
    slow: {
        duration: 500,
        easing: Easing.out(Easing.cubic),
    },
    easeInOut: {
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
    },
};

// Common Animation Helpers
export const Animations = {
    // Fade animations
    fadeIn: (duration = 300) => ({
        opacity: withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
    }),
    fadeOut: (duration = 300) => ({
        opacity: withTiming(0, { duration, easing: Easing.in(Easing.cubic) }),
    }),

    // Scale animations
    scaleIn: () => ({
        transform: [{ scale: withSpring(1, SpringConfigs.bouncy) }],
    }),
    scaleOut: () => ({
        transform: [{ scale: withTiming(0, TimingConfigs.fast) }],
    }),
    press: () => ({
        transform: [{ scale: withSpring(0.98, SpringConfigs.stiff) }],
    }),
    release: () => ({
        transform: [{ scale: withSpring(1, SpringConfigs.gentle) }],
    }),

    // Slide animations
    slideUp: (distance = 50) => ({
        transform: [
            {
                translateY: withSpring(0, {
                    ...SpringConfigs.gentle,
                    initialVelocity: -distance,
                }),
            },
        ],
    }),
    slideDown: (distance = 50) => ({
        transform: [
            {
                translateY: withSpring(distance, SpringConfigs.gentle),
            },
        ],
    }),
    slideLeft: (distance = 50) => ({
        transform: [
            {
                translateX: withSpring(-distance, SpringConfigs.gentle),
            },
        ],
    }),
    slideRight: (distance = 50) => ({
        transform: [
            {
                translateX: withSpring(distance, SpringConfigs.gentle),
            },
        ],
    }),

    // Shake animation
    shake: () => ({
        transform: [
            {
                translateX: withSpring(0, {
                    damping: 5,
                    stiffness: 300,
                    mass: 0.5,
                }),
            },
        ],
    }),
};

// Stagger delay helper
export const getStaggerDelay = (index: number, baseDelay = 50) => {
    return index * baseDelay;
};

// Duration constants
export const Duration = {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 800,
};
