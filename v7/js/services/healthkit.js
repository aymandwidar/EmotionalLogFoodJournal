/**
 * HealthKit Service - V7
 * Integrates with Apple HealthKit via Capacitor plugin
 * 
 * NOTE: This requires a Capacitor wrapper to access native HealthKit APIs.
 * For PWA usage, this service will simulate data until Capacitor is set up.
 */

export class HealthKitService {
    constructor() {
        this.isCapacitorAvailable = this._checkCapacitor();
        this.biometricsData = this._loadBiometrics();
    }

    /**
     * Check if Capacitor is available
     */
    _checkCapacitor() {
        return typeof window.Capacitor !== 'undefined';
    }

    /**
     * Request HealthKit permissions
     */
    async requestPermissions() {
        if (!this.isCapacitorAvailable) {
            console.warn('Capacitor not available. Using simulated data.');
            return { granted: false, simulated: true };
        }

        try {
            // When Capacitor is integrated, use:
            // const { HealthKit } = window.Capacitor.Plugins;
            // const result = await HealthKit.requestAuthorization({
            //     read: ['sleep', 'steps', 'heartRate', 'activeEnergy']
            // });
            // return result;

            return { granted: false, simulated: true };
        } catch (error) {
            console.error('HealthKit permission error:', error);
            return { granted: false, error: error.message };
        }
    }

    /**
     * Fetch today's biometric data
     */
    async fetchTodayData() {
        if (!this.isCapacitorAvailable) {
            // Return simulated data for testing
            return this._getSimulatedData();
        }

        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // When Capacitor is integrated:
            // const { HealthKit } = window.Capacitor.Plugins;

            // const sleepData = await HealthKit.querySleep({ startDate: today });
            // const stepsData = await HealthKit.querySteps({ startDate: today });
            // const heartRateData = await HealthKit.queryHeartRate({ startDate: today });

            // return {
            //     sleep: sleepData,
            //     steps: stepsData,
            //     heartRate: heartRateData,
            //     fetched: new Date().toISOString()
            // };

            return this._getSimulatedData();
        } catch (error) {
            console.error('HealthKit fetch error:', error);
            return null;
        }
    }

    /**
     * Get simulated data (for PWA testing until Capacitor is integrated)
     */
    _getSimulatedData() {
        return {
            sleep: {
                duration: 7.2 + (Math.random() - 0.5),
                quality: 0.75 + Math.random() * 0.2,
                deep: 1.8,
                rem: 1.5,
                awake: 0.3
            },
            steps: Math.floor(5000 + Math.random() * 8000),
            heartRate: {
                avg: 70 + Math.floor(Math.random() * 15),
                resting: 58 + Math.floor(Math.random() * 8),
                max: 145 + Math.floor(Math.random() * 20)
            },
            activeEnergy: Math.floor(300 + Math.random() * 400),
            fetched: new Date().toISOString(),
            simulated: true
        };
    }

    /**
     * Get historical biometrics (last 7 days)
     */
    async getHistoricalData(days = 7) {
        const data = [];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            // If Capacitor: fetch real data for each day
            // For now: simulated data
            data.push({
                date: date.toISOString(),
                ...this._getSimulatedData()
            });
        }

        return data.reverse();
    }

    /**
     * Check correlations between biometrics and food/mood
     */
    analyzeCorrelations(logs) {
        const correlations = {
            sleep: { goodMood: [], badMood: [] },
            steps: { goodMood: [], badMood: [] }
        };

        // Simple correlation: Good mood days vs bad mood days
        logs.forEach(log => {
            const logDate = new Date(log.timestamp).toDateString();
            const biometrics = this.biometricsData.find(b =>
                new Date(b.date).toDateString() === logDate
            );

            if (!biometrics) return;

            const isGoodMood = ['Good', 'Feel OK', 'Energetic'].includes(log.mood?.mood);

            if (isGoodMood) {
                correlations.sleep.goodMood.push(biometrics.sleep.duration);
                correlations.steps.goodMood.push(biometrics.steps);
            } else {
                correlations.sleep.badMood.push(biometrics.sleep.duration);
                correlations.steps.badMood.push(biometrics.steps);
            }
        });

        // Calculate averages
        const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

        return {
            sleep: {
                goodMoodAvg: avg(correlations.sleep.goodMood),
                badMoodAvg: avg(correlations.sleep.badMood)
            },
            steps: {
                goodMoodAvg: avg(correlations.steps.goodMood),
                badMoodAvg: avg(correlations.steps.badMood)
            }
        };
    }

    /**
     * Save biometrics data
     */
    saveBiometrics(data) {
        this.biometricsData.push(data);

        // Keep last 30 days only
        if (this.biometricsData.length > 30) {
            this.biometricsData = this.biometricsData.slice(-30);
        }

        this._saveToDisk();
    }

    /**
     * Storage helpers
     */
    _loadBiometrics() {
        try {
            const stored = localStorage.getItem('nutrimood_v7_biometrics');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    _saveToDisk() {
        try {
            localStorage.setItem('nutrimood_v7_biometrics', JSON.stringify(this.biometricsData));
        } catch (e) {
            console.error('Failed to save biometrics:', e);
        }
    }
}
