import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { SpiritAnimalType } from '../types/spiritAnimal';

interface SpiritAnimalAvatarProps {
    animalType: SpiritAnimalType;
    emoji: string;
    size?: 'small' | 'medium' | 'large';
    showPulse?: boolean;
}

const ANIMAL_GRADIENTS: Record<SpiritAnimalType, string[]> = {
    eagle: ['#8B4513', '#D4A574'],
    squirrel: ['#8B6914', '#D4AF37'],
    butterfly: ['#9B59B6', '#E8DAEF'],
    lion: ['#E67E22', '#F8C471'],
    capybara: ['#3498DB', '#AED6F1'],
    fox: ['#E74C3C', '#F5B7B1'],
};

const SIZE_CONFIG = {
    small: { container: 40, emoji: 20, borderWidth: 2 },
    medium: { container: 60, emoji: 30, borderWidth: 3 },
    large: { container: 100, emoji: 50, borderWidth: 4 },
};

export default function SpiritAnimalAvatar({
    animalType,
    emoji,
    size = 'medium',
    showPulse = true,
}: SpiritAnimalAvatarProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const config = SIZE_CONFIG[size];

    useEffect(() => {
        if (showPulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.02,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [showPulse]);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width: config.container,
                    height: config.container,
                    transform: [{ scale: pulseAnim }],
                },
            ]}
        >
            <LinearGradient
                colors={ANIMAL_GRADIENTS[animalType]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradient,
                    {
                        borderRadius: config.container / 2,
                        borderWidth: config.borderWidth,
                    },
                ]}
            >
                <Text style={[styles.emoji, { fontSize: config.emoji }]}>{emoji}</Text>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    emoji: {
        textAlign: 'center',
    },
});
