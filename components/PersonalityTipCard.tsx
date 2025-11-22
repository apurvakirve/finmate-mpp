import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
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
        color: '#1a1a1a',
    },
    tip: {
        fontSize: 14,
        color: '#333',
        lineHeight: 20,
        marginBottom: 12,
    },
    philosophy: {
        fontSize: 12,
        fontStyle: 'italic',
        color: '#666',
    },
});
