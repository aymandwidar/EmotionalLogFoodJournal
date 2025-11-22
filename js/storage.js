/**
 * Storage Service
 * Handles persistence of food logs using LocalStorage.
 */

const STORAGE_KEY = 'nutrimood_logs';

export class StorageService {
    constructor() {
        this.logs = this._loadLogs();
    }

    _loadLogs() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    _saveLogs() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    }

    /**
     * Adds a new log entry.
     * @param {Object} entry 
     */
    addLog(entry) {
        // Add timestamp and ID
        const newEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            ...entry
        };
        this.logs.unshift(newEntry); // Add to beginning

        try {
            this._saveLogs();
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                // Storage full, remove last 5 entries and try again
                console.warn("Storage full, removing old entries...");
                this.logs.splice(-5);
                this.logs.shift(); // Remove the one we just added to try again clean
                this.logs.unshift(newEntry);

                try {
                    this._saveLogs();
                    alert("Storage was full. Oldest logs were removed.");
                } catch (retryErr) {
                    alert("Storage is critically full. Please clear history.");
                    this.logs.shift(); // Undo add
                }
            }
        }
        return newEntry;
    }

    clearLogs() {
        this.logs = [];
        this._saveLogs();
    }

    /**
     * Retrieves all logs.
     * @returns {Array}
     */
    getLogs() {
        return this.logs;
    }

    /**
     * Generates a weekly summary of calories and mood.
     * @returns {Object} { totalCalories, avgCalories, moodCounts, dayCounts }
     */
    getWeeklySummary() {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyLogs = this.logs.filter(log => new Date(log.timestamp) >= oneWeekAgo);

        const totalCalories = weeklyLogs.reduce((sum, log) => sum + (log.food.calories || 0), 0);
        const avgCalories = weeklyLogs.length ? Math.round(totalCalories / 7) : 0; // Avg per day over 7 days

        const moodCounts = {};
        weeklyLogs.forEach(log => {
            const mood = log.mood.mood;
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });

        return {
            totalCalories,
            avgCalories,
            moodCounts,
            totalEntries: weeklyLogs.length
        };
    }

    /**
     * DEBUG: Generates random data for the past week.
     * @param {Array} foodDB 
     */
    generateRandomData(foodDB) {
        const moods = [
            { mood: "Very Bad", color: "#ff4b4b" },
            { mood: "Bad", color: "#ff9f43" },
            { mood: "Neutral", color: "#feca57" },
            { mood: "Good", color: "#54a0ff" },
            { mood: "Feel OK", color: "#1dd1a1" }
        ];

        const newLogs = [];
        const now = new Date();

        // Generate 3-5 entries per day for the last 7 days
        for (let i = 0; i < 7; i++) {
            const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const entriesCount = Math.floor(Math.random() * 3) + 3; // 3 to 5

            for (let j = 0; j < entriesCount; j++) {
                const food = foodDB[Math.floor(Math.random() * foodDB.length)];
                const mood = moods[Math.floor(Math.random() * moods.length)];

                // Random time during the day
                day.setHours(8 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

                newLogs.push({
                    id: Date.now() + Math.random(),
                    timestamp: day.toISOString(),
                    food: food,
                    mood: mood,
                    image: 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=' // Placeholder
                });
            }
        }

        this.logs = [...newLogs, ...this.logs];
        this._saveLogs();
        console.log("Generated " + newLogs.length + " random logs.");
    }
}
