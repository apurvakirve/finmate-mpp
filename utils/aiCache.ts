import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIInsights } from '../types/aiInsights';

const CACHE_PREFIX = 'ai_insights_';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
    insights: AIInsights;
    timestamp: number;
    userId: string;
}

/**
 * AI Cache Manager
 * Reduces API calls by caching AI analysis results
 */
export class AICache {
    /**
     * Get cached insights for a user
     */
    static async get(userId: string): Promise<AIInsights | null> {
        try {
            const key = `${CACHE_PREFIX}${userId}`;
            const cached = await AsyncStorage.getItem(key);

            if (!cached) {
                return null;
            }

            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is still valid
            if (now - entry.timestamp > CACHE_DURATION) {
                // Cache expired, remove it
                await this.remove(userId);
                return null;
            }

            return entry.insights;
        } catch (error) {
            console.error('Error reading AI cache:', error);
            return null;
        }
    }

    /**
     * Store insights in cache
     */
    static async set(userId: string, insights: AIInsights): Promise<void> {
        try {
            const key = `${CACHE_PREFIX}${userId}`;
            const entry: CacheEntry = {
                insights,
                timestamp: Date.now(),
                userId,
            };

            await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch (error) {
            console.error('Error writing AI cache:', error);
        }
    }

    /**
     * Remove cached insights for a user
     */
    static async remove(userId: string): Promise<void> {
        try {
            const key = `${CACHE_PREFIX}${userId}`;
            await AsyncStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing AI cache:', error);
        }
    }

    /**
     * Invalidate cache (call after new transaction)
     */
    static async invalidate(userId: string): Promise<void> {
        await this.remove(userId);
    }

    /**
     * Clear all AI caches
     */
    static async clearAll(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const aiKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
            await AsyncStorage.multiRemove(aiKeys);
        } catch (error) {
            console.error('Error clearing AI caches:', error);
        }
    }

    /**
     * Check if cache exists and is valid
     */
    static async isValid(userId: string): Promise<boolean> {
        const cached = await this.get(userId);
        return cached !== null;
    }
}
