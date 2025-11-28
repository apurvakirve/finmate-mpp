import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CategoryType {
    value: string;
    label: string;
    icon: string;
}

interface QRCategorySelectorProps {
    categories: CategoryType[];
    selectedCategory: string;
    onSelectCategory: (value: string) => void;
    rememberedCategory?: string | null;
    recipientName?: string;
}

const QRCategorySelector: React.FC<QRCategorySelectorProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
    rememberedCategory,
    recipientName,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>What's this payment for?</Text>
            {rememberedCategory && (
                <View style={styles.hintBox}>
                    <Icon name="clock" size={14} color="#8B5CF6" />
                    <Text style={styles.hintText}>
                        Last time you sent money to {recipientName || 'this person'}, you selected "{categories.find(c => c.value === rememberedCategory)?.label.split(' ').slice(1).join(' ')}"
                    </Text>
                </View>
            )}
            <View style={styles.grid}>
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.value;
                    const isRemembered = rememberedCategory === category.value;
                    const emoji = category.label.split(' ')[0]; // Extract emoji
                    const label = category.label.split(' ').slice(1).join(' '); // Rest of label

                    return (
                        <TouchableOpacity
                            key={category.value}
                            style={[
                                styles.card,
                                isSelected && styles.cardActive
                            ]}
                            onPress={() => onSelectCategory(category.value)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                isSelected && styles.iconContainerActive
                            ]}>
                                <Text style={styles.emoji}>{emoji}</Text>
                            </View>
                            <Text style={[
                                styles.label,
                                isSelected && styles.labelActive
                            ]} numberOfLines={1}>
                                {label}
                            </Text>
                            {isSelected && (
                                <View style={styles.checkmark}>
                                    <Icon name="check" size={14} color="#fff" />
                                </View>
                            )}
                            {isRemembered && !isSelected && (
                                <View style={styles.rememberedBadge}>
                                    <Text style={styles.rememberedText}>Last used</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    hintBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    hintText: {
        flex: 1,
        fontSize: 13,
        color: '#6B21A8',
        lineHeight: 18,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    card: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    cardActive: {
        backgroundColor: '#007AFF' + '15',
        borderColor: '#007AFF',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    iconContainerActive: {
        backgroundColor: '#007AFF',
    },
    emoji: {
        fontSize: 28,
    },
    label: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        textAlign: 'center',
    },
    labelActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rememberedBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        right: 6,
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 6,
    },
    rememberedText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

export default QRCategorySelector;
