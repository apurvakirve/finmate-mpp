import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service to manage category memory for QR payments
 * Remembers which category a user selects when sending money to specific recipients
 */
export class CategoryMemoryService {
    private static readonly STORAGE_PREFIX = 'category_memory_';

    /**
     * Generate storage key for a sender-recipient pair
     */
    private static getKey(senderId: string | number, recipientId: string | number): string {
        return `${this.STORAGE_PREFIX}${senderId}_${recipientId}`;
    }

    /**
     * Save category preference for a recipient
     * @param senderId - ID of the sender
     * @param recipientId - ID of the recipient
     * @param category - Category to remember (e.g., 'food', 'transportation')
     */
    static async saveCategory(
        senderId: string | number,
        recipientId: string | number,
        category: string
    ): Promise<void> {
        try {
            const key = this.getKey(senderId, recipientId);
            await AsyncStorage.setItem(key, category);
            console.log(`Category memory saved: ${senderId} → ${recipientId} = ${category}`);
        } catch (error) {
            console.error('Error saving category memory:', error);
        }
    }

    /**
     * Get remembered category for a recipient
     * @param senderId - ID of the sender
     * @param recipientId - ID of the recipient
     * @returns The remembered category or null if none exists
     */
    static async getCategory(
        senderId: string | number,
        recipientId: string | number
    ): Promise<string | null> {
        try {
            const key = this.getKey(senderId, recipientId);
            const category = await AsyncStorage.getItem(key);
            console.log(`Category memory retrieved: ${senderId} → ${recipientId} = ${category || 'none'}`);
            return category;
        } catch (error) {
            console.error('Error getting category memory:', error);
            return null;
        }
    }

    /**
     * Get all category memories for a sender
     * Useful for analytics and debugging
     * @param senderId - ID of the sender
     * @returns Map of recipient IDs to categories
     */
    static async getAllMemories(senderId: string | number): Promise<Map<string, string>> {
        try {
            const memories = new Map<string, string>();
            const allKeys = await AsyncStorage.getAllKeys();
            const prefix = `${this.STORAGE_PREFIX}${senderId}_`;

            const relevantKeys = allKeys.filter(key => key.startsWith(prefix));

            for (const key of relevantKeys) {
                const category = await AsyncStorage.getItem(key);
                if (category) {
                    // Extract recipient ID from key
                    const recipientId = key.replace(prefix, '');
                    memories.set(recipientId, category);
                }
            }

            return memories;
        } catch (error) {
            console.error('Error getting all category memories:', error);
            return new Map();
        }
    }

    /**
     * Clear category memory for a specific recipient
     * @param senderId - ID of the sender
     * @param recipientId - ID of the recipient
     */
    static async clearCategory(
        senderId: string | number,
        recipientId: string | number
    ): Promise<void> {
        try {
            const key = this.getKey(senderId, recipientId);
            await AsyncStorage.removeItem(key);
            console.log(`Category memory cleared: ${senderId} → ${recipientId}`);
        } catch (error) {
            console.error('Error clearing category memory:', error);
        }
    }

    /**
     * Clear all category memories for a sender
     * Useful for logout or data reset
     * @param senderId - ID of the sender
     */
    static async clearAllMemories(senderId: string | number): Promise<void> {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const prefix = `${this.STORAGE_PREFIX}${senderId}_`;
            const keysToRemove = allKeys.filter(key => key.startsWith(prefix));

            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
                console.log(`Cleared ${keysToRemove.length} category memories for sender ${senderId}`);
            }
        } catch (error) {
            console.error('Error clearing all category memories:', error);
        }
    }

    /**
     * Get statistics about category usage
     * @param senderId - ID of the sender
     * @returns Object with category usage statistics
     */
    static async getCategoryStats(senderId: string | number): Promise<{
        totalRecipients: number;
        categoryCounts: Record<string, number>;
        mostUsedCategory: string | null;
    }> {
        try {
            const memories = await this.getAllMemories(senderId);
            const categoryCounts: Record<string, number> = {};

            memories.forEach(category => {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            const mostUsedCategory = Object.entries(categoryCounts)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

            return {
                totalRecipients: memories.size,
                categoryCounts,
                mostUsedCategory
            };
        } catch (error) {
            console.error('Error getting category stats:', error);
            return {
                totalRecipients: 0,
                categoryCounts: {},
                mostUsedCategory: null
            };
        }
    }
}
