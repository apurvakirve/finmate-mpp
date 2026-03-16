import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { AnimatedNumber } from './AnimatedNumber';

interface ResultCardProps {
    title: string;
    value: number;
    subtitle?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    gradientColors?: string[];
}

export function ResultCard({
    title,
    value,
    subtitle,
    prefix = '₹ ',
    suffix = '',
    decimals = 0,
    gradientColors,
}: ResultCardProps) {
    const theme = useTheme();

    const defaultGradient = theme.dark
        ? ['#1a237e', '#283593']
        : ['#667eea', '#764ba2'];

    return (
        <Card style={styles.card} elevation={4}>
            <LinearGradient
                colors={gradientColors || defaultGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}>
                <Card.Content>
                    <Text variant="titleMedium" style={styles.title}>
                        {title}
                    </Text>
                    <AnimatedNumber
                        value={value}
                        prefix={prefix}
                        suffix={suffix}
                        decimals={decimals}
                        style={styles.value}
                    />
                    {subtitle && (
                        <Text variant="bodyMedium" style={styles.subtitle}>
                            {subtitle}
                        </Text>
                    )}
                </Card.Content>
            </LinearGradient>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginVertical: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradient: {
        borderRadius: 16,
    },
    title: {
        color: '#fff',
        opacity: 0.9,
        marginBottom: 8,
    },
    value: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff',
        marginVertical: 8,
    },
    subtitle: {
        color: '#fff',
        opacity: 0.8,
        marginTop: 4,
    },
});
