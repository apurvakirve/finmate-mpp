import { Feather as Icon } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getSpiritAnimalProfile } from '../constants/spiritAnimals';
import { SpiritAnimalType } from '../types/spiritAnimal';

const { width } = Dimensions.get('window');

interface SpiritAnimalRevealProps {
    animalType: SpiritAnimalType;
    onContinue: () => void;
}

export default function SpiritAnimalReveal({ animalType, onContinue }: SpiritAnimalRevealProps) {
    const profile = getSpiritAnimalProfile(animalType);
    const [scaleAnim] = useState(new Animated.Value(0));
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        // Animate emoji scale
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 20,
            friction: 7,
            useNativeDriver: true
        }).start();

        // Fade in content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            delay: 300,
            useNativeDriver: true
        }).start();
    }, []);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Your Financial Spirit Animal</Text>
                    <Text style={styles.headerSubtitle}>Based on your answers</Text>
                </View>

                {/* Animal Emoji - Animated */}
                <Animated.View
                    style={[
                        styles.emojiContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: profile.color + '20'
                        }
                    ]}
                >
                    <Text style={styles.emoji}>{profile.emoji}</Text>
                </Animated.View>

                {/* Animal Name */}
                <Animated.View style={[styles.nameContainer, { opacity: fadeAnim }]}>
                    <Text style={[styles.animalName, { color: profile.color }]}>
                        {profile.name}
                    </Text>
                    <Text style={styles.philosophy}>"{profile.philosophy}"</Text>
                </Animated.View>

                {/* Description */}
                <Animated.View style={[styles.descriptionCard, { opacity: fadeAnim }]}>
                    <Text style={styles.descriptionText}>{profile.description}</Text>
                </Animated.View>

                {/* Traits */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Icon name="star" size={20} color={profile.color} />
                        <Text style={styles.sectionTitle}>Your Traits</Text>
                    </View>
                    <View style={styles.traitsContainer}>
                        {profile.traits.map((trait, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.traitBadge,
                                    { backgroundColor: profile.color + '15', borderColor: profile.color }
                                ]}
                            >
                                <Text style={[styles.traitText, { color: profile.color }]}>
                                    {trait}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Strengths */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Icon name="thumbs-up" size={20} color="#4CAF50" />
                        <Text style={styles.sectionTitle}>Your Strengths</Text>
                    </View>
                    {profile.strengths.map((strength, index) => (
                        <View key={index} style={styles.listItem}>
                            <Icon name="check-circle" size={16} color="#4CAF50" />
                            <Text style={styles.listItemText}>{strength}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Tips */}
                <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Icon name="zap" size={20} color="#FFA000" />
                        <Text style={styles.sectionTitle}>Tips for You</Text>
                    </View>
                    {profile.tips.slice(0, 3).map((tip, index) => (
                        <View key={index} style={styles.tipItem}>
                            <View style={styles.tipNumber}>
                                <Text style={styles.tipNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Continue Button */}
                <TouchableOpacity
                    style={[styles.continueButton, { backgroundColor: profile.color }]}
                    onPress={onContinue}
                    activeOpacity={0.8}
                >
                    <Text style={styles.continueButtonText}>Continue to App</Text>
                    <Icon name="arrow-right" size={20} color="white" />
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    emojiContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    emoji: {
        fontSize: 80,
    },
    nameContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    animalName: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    philosophy: {
        fontSize: 18,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    descriptionCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    descriptionText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginLeft: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        paddingLeft: 8,
    },
    listItemText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 12,
        flex: 1,
        lineHeight: 22,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tipNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFA000',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    tipNumberText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'white',
    },
    tipText: {
        fontSize: 15,
        color: '#333',
        flex: 1,
        lineHeight: 22,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    continueButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginRight: 8,
    },
    bottomPadding: {
        height: 40,
    },
});
