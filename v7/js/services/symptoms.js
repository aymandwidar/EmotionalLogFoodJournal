/**
 * Symptoms Service - V7
 * Tracks user symptoms (bloating, headaches, energy levels, etc.) and links them to meals
 */

export class SymptomsService {
    constructor(storageService) {
        this.storageService = storageService;
        this.symptoms = this._loadSymptoms();
    }

    /**
     * Predefined symptom types
     */
    getSymptomTypes() {
        return [
            { id: 'bloating', name: 'Bloating', emoji: '😫', color: '#ef4444' },
            { id: 'headache', name: 'Headache', emoji: '🤕', color: '#f59e0b' },
            { id: 'energyCrash', name: 'Energy Crash', emoji: '😴', color: '#8b5cf6' },
            { id: 'energized', name: 'Energized', emoji: '🏃', color: '#10b981' },
            { id: 'tired', name: 'Tired', emoji: '😩', color: '#64748b' },
            { id: 'heartburn', name: 'Heartburn', emoji: '🔥', color: '#dc2626' },
            { id: 'nausea', name: 'Nausea', emoji: '🤢', color: '#84cc16' },
            { id: 'digestive', name: 'Digestive Issues', emoji: '💩', color: '#a16207' }
        ];
    }

    /**
     * Log a new symptom
     */
    async logSymptom(symptomData) {
        const newSymptom = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            symptomType: symptomData.symptomType,
            intensity: symptomData.intensity || 3, // 1-5 scale
            hoursAfterMeal: symptomData.hoursAfterMeal || 0,
            linkedMealId: symptomData.linkedMealId || null,
            notes: symptomData.notes || ''
        };

        this.symptoms.unshift(newSymptom);
        this._saveSymptoms();
        return newSymptom;
    }

    /**
     * Get all symptoms
     */
    getSymptoms() {
        return this.symptoms;
    }

    /**
     * Get symptoms for a specific meal
     */
    getSymptomsForMeal(mealId) {
        return this.symptoms.filter(s => s.linkedMealId === mealId);
    }

    /**
     * Get symptom correlations with foods
     */
    getSymptomCorrelations() {
        const logs = this.storageService.getLogs();
        const correlations = {};

        // For each symptom, find the associated meal
        this.symptoms.forEach(symptom => {
            if (!symptom.linkedMealId) return;

            const meal = logs.find(log => log.id === symptom.linkedMealId);
            if (!meal) return;

            const foodName = meal.food.name;
            const symptomType = symptom.symptomType;

            if (!correlations[symptomType]) {
                correlations[symptomType] = {};
            }

            if (!correlations[symptomType][foodName]) {
                correlations[symptomType][foodName] = {
                    count: 0,
                    avgIntensity: 0,
                    avgDelay: 0,
                    intensities: []
                };
            }

            const data = correlations[symptomType][foodName];
            data.count++;
            data.intensities.push(symptom.intensity);
            data.avgIntensity = data.intensities.reduce((a, b) => a + b, 0) / data.intensities.length;
            data.avgDelay = (data.avgDelay * (data.count - 1) + symptom.hoursAfterMeal) / data.count;
        });

        // Sort by frequency
        Object.keys(correlations).forEach(symptomType => {
            correlations[symptomType] = Object.entries(correlations[symptomType])
                .map(([food, data]) => ({ food, ...data }))
                .sort((a, b) => b.count - a.count);
        });

        return correlations;
    }

    /**
     * Get symptom timeline
     */
    getSymptomTimeline(days = 7) {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return this.symptoms.filter(s => new Date(s.timestamp) >= startDate)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Delete a symptom
     */
    async deleteSymptom(symptomId) {
        const index = this.symptoms.findIndex(s => s.id === symptomId);
        if (index === -1) return false;

        this.symptoms.splice(index, 1);
        this._saveSymptoms();
        return true;
    }

    /**
     * Storage helpers
     */
    _loadSymptoms() {
        try {
            const stored = localStorage.getItem('nutrimood_v7_symptoms');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load symptoms:', e);
            return [];
        }
    }

    _saveSymptoms() {
        try {
            localStorage.setItem('nutrimood_v7_symptoms', JSON.stringify(this.symptoms));
        } catch (e) {
            console.error('Failed to save symptoms:', e);
        }
    }
}
