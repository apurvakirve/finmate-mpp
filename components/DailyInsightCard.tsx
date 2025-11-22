import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DailyInsightCardProps {
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    gradientColors: [string, string];
    onPress?: () => void;
    actionText?: string;
}

export default function DailyInsightCard({
    title,
    description,
    icon,
    iconColor,
    gradientColors,
    onPress,
    actionText = 'Learn more',
}: DailyInsightCardProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
                        <Icon name={icon as any} size={24} color={iconColor} />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.description}>{description}</Text>
                    </View>
                </View>
                {onPress && (
                    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                        <Text style={styles.actionText}>{actionText}</Text>
                        <Icon name="arrow-right" size={16} color="#007AFF" />
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 8,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    gradient: {
        padding: 16,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        marginRight: 4,
    },
});
