import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { SpiritAnimalProfile } from '../types/spiritAnimal';

interface PersonalityTipCardProps {
    profile: SpiritAnimalProfile;
}

export default function PersonalityTipCard({ profile }: PersonalityTipCardProps) {
    // Get a random tip from the profile
    const tip = profile.tips[Math.floor(Math.random() * profile.tips.length)];

    return (
        <View style={[styles.container, { borderLeftColor: profile.color }]}>
            <View style={styles.header}>
                <Text style={styles.emoji}>{profile.emoji}</Text>
                <Text style={styles.title}>Tip for {profile.name}</Text>
            </View>
            <Text style={styles.tip}>{tip}</Text>
            <Text style={styles.philosophy}>"{profile.philosophy}"</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 8,
        borderLeftWidth: 4,
        ...AIStudioTheme.shadows.sm,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    emoji: {
        fontSize: 24,
        marginRight: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: AIStudioTheme.colors.text,
    },
    tip: {
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
        lineHeight: 20,
        marginBottom: 12,
    },
    philosophy: {
        fontSize: 12,
        fontStyle: 'italic',
        color: AIStudioTheme.colors.textMuted,
    },
});
