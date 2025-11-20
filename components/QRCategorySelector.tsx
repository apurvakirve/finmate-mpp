import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

interface CategoryType {
    value: string;
    label: string;
    icon: string;
}

interface QRCategorySelectorProps {
    categories: CategoryType[];
    selectedCategory: string;
    onSelectCategory: (value: string) => void;
}

const QRCategorySelector: React.FC<QRCategorySelectorProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>What's this payment for?</Text>
            <View style={styles.grid}>
                {categories.map((category) => {
                    const isSelected = selectedCategory === category.value;
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
        backgroundColor: Colors.primary + '15',
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
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
        backgroundColor: Colors.primary,
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
        color: Colors.primary,
        fontWeight: '600',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default QRCategorySelector;
