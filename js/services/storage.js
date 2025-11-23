/**
 * Storage Service - V5S
 * Enhanced storage with IndexedDB support, data migration, and export/import
 */

const STORAGE_KEY = 'nutrimood_logs';
const DB_NAME = 'NutriMoodDB';
const DB_VERSION = 1;
const STORE_NAME = 'logs';

export class StorageService {
    constructor() {
        this.db = null;
        this.logs = [];
        this.useIndexedDB = this._checkIndexedDBSupport();

        this.init();
    }

    /**
     * Initialize storage
     */
    async init() {
        if (this.useIndexedDB) {
            await this._initIndexedDB();
            await this._migrateFromLocalStorage();
        } else {
            this.logs = this._loadFromLocalStorage();
        }
    }

    /**
     * Check IndexedDB support
     */
    _checkIndexedDBSupport() {
        return 'indexedDB' in window;
    }

    /**
     * Initialize IndexedDB
     */
    async _initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB failed to open');
                this.useIndexedDB = false;
                this.logs = this._loadFromLocalStorage();
                resolve();
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this._loadFromIndexedDB().then(resolve);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('foodName', 'food.name', { unique: false });
                    objectStore.createIndex('mood', 'mood.mood', { unique: false });
                }
            };
        });
    }

    /**
     * Load logs from IndexedDB
     */
    async _loadFromIndexedDB() {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                this.logs = request.result || [];
                // Sort by timestamp descending
                this.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                resolve();
            };

            request.onerror = () => {
                console.error('Failed to load from IndexedDB');
                reject();
            };
        });
    }

    /**
     * Save log to IndexedDB
     */
    async _saveToIndexedDB(log) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.put(log);

            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }

    /**
     * Delete log from IndexedDB
     */
    async _deleteFromIndexedDB(id) {
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject();
        });
    }

    /**
     * Migrate data from localStorage to IndexedDB
     */
    async _migrateFromLocalStorage() {
        const localData = this._loadFromLocalStorage();

        if (localData.length === 0) return;
        if (this.logs.length > 0) return; // Already migrated

        console.log(`Migrating ${localData.length} logs from localStorage to IndexedDB...`);

        for (const log of localData) {
            await this._saveToIndexedDB(log);
        }

        this.logs = localData;

        // Backup localStorage data before clearing
        localStorage.setItem('nutrimood_logs_backup', localStorage.getItem(STORAGE_KEY));

        console.log('Migration complete. localStorage backed up.');
    }

    /**
     * Load from localStorage (fallback)
     */
    _loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('LocalStorage Error:', e);
            return [];
        }
    }

    /**
     * Save to localStorage (fallback)
     */
    _saveToLocalStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded');
                // Remove oldest entries
                this.logs = this.logs.slice(0, Math.floor(this.logs.length * 0.8));
                this._saveToLocalStorage();
            }
        }
    }

    /**
     * Add a new log entry
     */
    async addLog(entry) {
        const newEntry = {
            id: Date.now() + Math.random(), // Ensure uniqueness
            timestamp: new Date().toISOString(),
            ...entry
        };

        this.logs.unshift(newEntry);

        if (this.useIndexedDB) {
            try {
                await this._saveToIndexedDB(newEntry);
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                this._saveToLocalStorage();
            }
        } else {
            this._saveToLocalStorage();
        }

        return newEntry;
    }

    /**
     * Delete a log entry
     */
    async deleteLog(id) {
        const index = this.logs.findIndex(log => log.id === id);
        if (index === -1) return false;

        this.logs.splice(index, 1);

        if (this.useIndexedDB) {
            await this._deleteFromIndexedDB(id);
        } else {
            this._saveToLocalStorage();
        }

        return true;
    }

    /**
     * Clear all logs
     */
    async clearLogs() {
        this.logs = [];

        if (this.useIndexedDB && this.db) {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            objectStore.clear();
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /**
     * Get all logs
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Get weekly summary
     */
    getWeeklySummary() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyLogs = this.logs.filter(log => new Date(log.timestamp) >= oneWeekAgo);

        const totalCalories = weeklyLogs.reduce((sum, log) => {
            return sum + (parseInt(log.food?.calories) || 0);
        }, 0);

        const avgDailyCalories = weeklyLogs.length ? Math.round(totalCalories / 7) : 0;

        const moodCounts = {};
        weeklyLogs.forEach(log => {
            const mood = log.mood?.mood;
            if (mood) {
                moodCounts[mood] = (moodCounts[mood] || 0) + 1;
            }
        });

        return {
            totalCalories,
            avgDailyCalories,
            moodCounts,
            totalEntries: weeklyLogs.length
        };
    }

    /**
     * Get sensitivity report (trigger and safe foods)
     */
    getSensitivityReport() {
        const triggerFoods = {};
        const safeFoods = {};

        this.logs.forEach(log => {
            const mood = log.mood?.mood;
            const foodName = log.food?.name;

            if (!mood || !foodName) return;

            // Negative moods
            if (['Very Bad', 'Bad', 'Uneasy', 'Bloated', 'Tired'].includes(mood)) {
                triggerFoods[foodName] = (triggerFoods[foodName] || 0) + 1;
            }
            // Positive moods
            else if (['Good', 'Energetic', 'Happy', 'Feel OK'].includes(mood)) {
                safeFoods[foodName] = (safeFoods[foodName] || 0) + 1;
            }
        });

        const sortedTriggers = Object.entries(triggerFoods)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        const sortedSafe = Object.entries(safeFoods)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        return { triggers: sortedTriggers, safe: sortedSafe };
    }

    /**
     * Get nutrient trends by mood
     */
    getNutrientTrends() {
        const moodData = {};

        this.logs.forEach(log => {
            const mood = log.mood?.mood;
            if (!mood) return;

            if (!moodData[mood]) {
                moodData[mood] = { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 };
            }

            const protein = parseInt(log.food?.protein) || 0;
            const carbs = parseInt(log.food?.carbs) || 0;
            const fats = parseInt(log.food?.fats) || 0;
            const calories = parseInt(log.food?.calories) || 0;

            moodData[mood].calories += calories;
            moodData[mood].protein += protein;
            moodData[mood].carbs += carbs;
            moodData[mood].fats += fats;
            moodData[mood].count++;
        });

        // Calculate averages
        Object.keys(moodData).forEach(mood => {
            const data = moodData[mood];
            if (data.count > 0) {
                data.avgCalories = Math.round(data.calories / data.count);
                data.avgProtein = Math.round(data.protein / data.count);
                data.avgCarbs = Math.round(data.carbs / data.count);
                data.avgFats = Math.round(data.fats / data.count);
            }
        });

        return moodData;
    }

    /**
     * Get current streak
     */
    getStreak() {
        if (this.logs.length === 0) return 0;

        const dates = [...new Set(this.logs.map(log =>
            new Date(log.timestamp).toDateString()
        ))];

        dates.sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (dates[0] === today) {
            streak = 1;
        } else if (dates[0] === yesterday) {
            streak = 1;
        } else {
            return 0;
        }

        for (let i = 0; i < dates.length - 1; i++) {
            const current = new Date(dates[i]);
            const prev = new Date(dates[i + 1]);

            const diffTime = Math.abs(current - prev);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Export data
     */
    async exportData(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.logs, null, 2);
        } else if (format === 'csv') {
            return this._exportToCSV();
        }
        throw new Error('Unsupported format');
    }

    /**
     * Export to CSV
     */
    _exportToCSV() {
        const headers = ['Date', 'Time', 'Food', 'Calories', 'Protein', 'Carbs', 'Fats', 'Mood'];
        const rows = this.logs.map(log => {
            const date = new Date(log.timestamp);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                log.food?.name || '',
                log.food?.calories || '',
                log.food?.protein || '',
                log.food?.carbs || '',
                log.food?.fats || '',
                log.mood?.mood || ''
            ];
        });

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csv;
    }

    /**
     * Import data
     */
    async importData(jsonData) {
        try {
            const imported = JSON.parse(jsonData);

            if (!Array.isArray(imported)) {
                throw new Error('Invalid data format');
            }

            for (const log of imported) {
                await this.addLog(log);
            }

            return imported.length;
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    /**
     * Get storage usage
     */
    async getStorageUsage() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage,
                quota: estimate.quota,
                percentage: (estimate.usage / estimate.quota) * 100
            };
        }
        return null;
    }

    /**
     * Cleanup old data
     */
    async cleanupOldData(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const logsToKeep = this.logs.filter(log =>
            new Date(log.timestamp) >= cutoffDate
        );

        const removedCount = this.logs.length - logsToKeep.length;

        if (removedCount > 0) {
            this.logs = logsToKeep;

            if (this.useIndexedDB) {
                await this.clearLogs();
                for (const log of logsToKeep) {
                    await this._saveToIndexedDB(log);
                }
            } else {
                this._saveToLocalStorage();
            }
        }

        return removedCount;
    }

    /**
     * Generate random test data
     */
    async generateRandomData(foodDB) {
        const moods = [
            { mood: 'Very Bad', color: '#ff4b4b' },
            { mood: 'Bad', color: '#ff9f43' },
            { mood: 'Neutral', color: '#feca57' },
            { mood: 'Good', color: '#54a0ff' },
            { mood: 'Feel OK', color: '#1dd1a1' }
        ];

        const now = new Date();

        for (let i = 0; i < 7; i++) {
            const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const entriesCount = Math.floor(Math.random() * 3) + 3;

            for (let j = 0; j < entriesCount; j++) {
                const food = foodDB[Math.floor(Math.random() * foodDB.length)];
                const mood = moods[Math.floor(Math.random() * moods.length)];

                day.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

                await this.addLog({
                    food: food,
                    mood: mood,
                    image: null
                });
            }
        }

        console.log('Generated random test data');
    }

    /**
     * V6: Goals & Achievements Methods
     */

    /**
     * Get all goals
     */
    async getGoals() {
        try {
            const stored = localStorage.getItem('nutrimood_goals');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load goals:', e);
            return [];
        }
    }

    /**
     * Save goals
     */
    async saveGoals(goals) {
        try {
            localStorage.setItem('nutrimood_goals', JSON.stringify(goals));
        } catch (e) {
            console.error('Failed to save goals:', e);
        }
    }

    /**
     * Get unlocked achievements
     */
    async getUnlockedAchievements() {
        try {
            const stored = localStorage.getItem('nutrimood_achievements');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load achievements:', e);
            return [];
        }
    }

    /**
     * Save unlocked achievements
     */
    async saveUnlockedAchievements(achievements) {
        try {
            localStorage.setItem('nutrimood_achievements', JSON.stringify(achievements));
        } catch (e) {
            console.error('Failed to save achievements:', e);
        }
    }

    /**
     * Get user stats for achievements
     */
    getUserStats() {
        const logs = this.getLogs();
        const goals = JSON.parse(localStorage.getItem('nutrimood_goals') || '[]');

        // Calculate good mood streak
        let goodMoodStreak = 0;
        const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        for (const log of sortedLogs) {
            if (log.mood?.mood === 'Feel OK' || log.mood?.mood === 'Good') {
                goodMoodStreak++;
            } else {
                break;
            }
        }

        // Get unique moods and foods
        const uniqueMoods = new Set(logs.map(l => l.mood?.mood).filter(Boolean));
        const uniqueFoods = new Set(logs.map(l => l.food?.name).filter(Boolean));

        return {
            currentStreak: this.getStreak(),
            totalLogs: logs.length,
            totalMoods: logs.length,
            goodMoodStreak,
            uniqueMoods: uniqueMoods.size,
            uniqueFoods: uniqueFoods.size,
            goalsSet: goals.length,
            goalsCompleted: goals.filter(g => g.status === 'completed').length
        };
    }
}
