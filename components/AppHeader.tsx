import { Feather as Icon } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AIStudioTheme } from '../constants/aiStudioTheme';
import { t } from '../lib/i18n';

interface AppHeaderProps {
    userName: string;
    spiritAnimal?: { type: string; profile: any } | null;
    onRefresh?: () => void;
    onLogout?: () => void;
}

export default function AppHeader({ userName, spiritAnimal, onRefresh, onLogout }: AppHeaderProps) {
    return (
        <View style={styles.container}>
            <View style={styles.leftSection}>
                {/* Spirit Animal Avatar */}
                {spiritAnimal && (
                    <View style={styles.avatarContainer}>
                        <Image
                            source={spiritAnimal.profile.avatar}
                            style={styles.avatar}
                        />
                    </View>
                )}

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={styles.greeting}>{t('hey')} {userName}! {t('greetingEmoji')}</Text>
                    {spiritAnimal && (
                        <Text style={styles.spiritType}>{spiritAnimal.profile.name}</Text>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
                {onRefresh && (
                    <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
                        <Icon name="refresh-cw" size={20} color={AIStudioTheme.colors.primary} />
                    </TouchableOpacity>
                )}
                {onLogout && (
                    <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
                        <Icon name="log-out" size={20} color={AIStudioTheme.colors.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: AIStudioTheme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: AIStudioTheme.colors.border,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: AIStudioTheme.colors.primary,
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    userInfo: {
        flex: 1,
    },
    greeting: {
        fontSize: 16,
        fontWeight: '600',
        color: AIStudioTheme.colors.text,
        marginBottom: 2,
    },
    spiritType: {
        fontSize: 12,
        color: AIStudioTheme.colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: AIStudioTheme.colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
