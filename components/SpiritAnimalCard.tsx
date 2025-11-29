import { Feather as Icon } from '@expo/vector-icons';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { getSpiritAnimalProfile } from '../constants/spiritAnimals';
import { SpiritAnimalType } from '../types/spiritAnimal';

interface SpiritAnimalCardProps {
    animalType: SpiritAnimalType;
    onPress?: () => void;
    showRetake?: boolean;
    compact?: boolean;
}

export default function SpiritAnimalCard({
    animalType,
    onPress,
    showRetake = false,
    compact = false
}: SpiritAnimalCardProps) {
    const profile = getSpiritAnimalProfile(animalType);

    if (compact) {
        return (
            <TouchableOpacity
                style={[styles.compactCard, { borderColor: profile.color }]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.compactEmoji, { backgroundColor: profile.color + '20' }]}>
                    <Text style={styles.compactEmojiText}>{profile.emoji}</Text>
                </View>
                <View style={styles.compactInfo}>
                    <Text style={styles.compactName}>{profile.name}</Text>
                    <Text style={styles.compactPhilosophy} numberOfLines={1}>
                        {profile.philosophy}
                    </Text>
                </View>
                {onPress && (
                    <Icon name="chevron-right" size={20} color="#999" />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[styles.card, { borderColor: profile.color }]}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            disabled={!onPress}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.emojiContainer, { backgroundColor: profile.color + '20' }]}>
                    <Text style={styles.emoji}>{profile.emoji}</Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.label}>Your Spirit Animal</Text>
                    <Text style={[styles.name, { color: profile.color }]}>{profile.name}</Text>
                </View>
            </View>

            {/* Philosophy */}
            <View style={styles.philosophyContainer}>
                <Icon name="message-circle" size={16} color={profile.color} />
                <Text style={styles.philosophy}>{profile.philosophy}</Text>
            </View>

            {/* Key Traits */}
            <View style={styles.traitsContainer}>
                {profile.traits.slice(0, 3).map((trait, index) => (
                    <View
                        key={index}
                        style={[styles.traitBadge, { backgroundColor: profile.color + '15' }]}
                    >
                        <Text style={[styles.traitText, { color: profile.color }]}>
                            {trait}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Actions */}
            {showRetake && (
                <TouchableOpacity
                    style={[styles.retakeButton, { borderColor: profile.color }]}
                    onPress={onPress}
                >
                    <Icon name="refresh-cw" size={16} color={profile.color} />
                    <Text style={[styles.retakeText, { color: profile.color }]}>
                        Retake Quiz
                    </Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: AIStudioTheme.colors.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    emojiContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    emoji: {
        fontSize: 32,
    },
    headerText: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: AIStudioTheme.colors.text,
    },
    philosophyContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    philosophy: {
        fontSize: 14,
        color: AIStudioTheme.colors.textSecondary,
        fontStyle: 'italic',
        marginLeft: 8,
        flex: 1,
    },
    traitsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    traitBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    traitText: {
        fontSize: 12,
        fontWeight: '600',
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    retakeText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: AIStudioTheme.colors.surface,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AIStudioTheme.colors.border,
        ...AIStudioTheme.shadows.sm,
    },
    compactEmoji: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    compactEmojiText: {
        fontSize: 24,
    },
    compactInfo: {
        flex: 1,
    },
    compactName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: AIStudioTheme.colors.text,
        marginBottom: 2,
    },
    compactPhilosophy: {
        fontSize: 13,
        color: AIStudioTheme.colors.textSecondary,
        fontStyle: 'italic',
    },
});
