/**
 * Coach Service - V6
 * AI-powered meal coach that provides proactive insights and recommendations
 */

export class CoachService {
    constructor(analysisService, storageService) {
        this.analysisService = analysisService;
        this.storageService = storageService;
        this.insights = [];
        this.patterns = {};
    }

    /**
     * Analyze user patterns and generate insights
     */
    async analyzePatterns() {
        const logs = this.storageService.getLogs();
        if (logs.length < 5) {
            return { message: 'Keep logging to unlock personalized insights! (Need at least 5 entries)' };
        }

        // Detect food-mood correlations
        const foodMoodPatterns = this.detectFoodMoodPatterns(logs);

        // Detect time-based patterns
        const timePatterns = this.detectTimePatterns(logs);

        // Detect nutrient deficiencies
        const deficiencies = this.detectDeficiencies(logs);

        this.patterns = {
            foodMood: foodMoodPatterns,
            time: timePatterns,
            deficiencies
        };

        return this.patterns;
    }

    /**
     * Detect food-mood correlations
     */
    detectFoodMoodPatterns(logs) {
        const foodMoodMap = {};

        logs.forEach(log => {
            const foodName = log.food?.name;
            const mood = log.mood?.mood;

            if (!foodName || !mood) return;

            if (!foodMoodMap[foodName]) {
                foodMoodMap[foodName] = {
                    total: 0,
                    good: 0,
                    bad: 0,
                    moods: []
                };
            }

            foodMoodMap[foodName].total++;
            foodMoodMap[foodName].moods.push(mood);

            if (mood === 'Feel OK' || mood === 'Good') {
                foodMoodMap[foodName].good++;
            } else if (mood === 'Very Bad' || mood === 'Bad') {
                foodMoodMap[foodName].bad++;
            }
        });

        // Find trigger foods (mostly bad moods)
        const triggers = Object.entries(foodMoodMap)
            .filter(([_, data]) => data.total >= 3 && data.bad / data.total > 0.6)
            .map(([food, data]) => ({
                food,
                badPercentage: Math.round((data.bad / data.total) * 100),
                count: data.total
            }));

        // Find safe foods (mostly good moods)
        const safe = Object.entries(foodMoodMap)
            .filter(([_, data]) => data.total >= 3 && data.good / data.total > 0.7)
            .map(([food, data]) => ({
                food,
                goodPercentage: Math.round((data.good / data.total) * 100),
                count: data.total
            }));

        return { triggers, safe };
    }

    /**
     * Detect time-based patterns
     */
    detectTimePatterns(logs) {
        const dayOfWeekMap = {};
        const hourMap = {};

        logs.forEach(log => {
            const date = new Date(log.timestamp);
            const day = date.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = date.getHours();
            const mood = log.mood?.mood;

            if (!mood) return;

            // Day of week patterns
            if (!dayOfWeekMap[day]) {
                dayOfWeekMap[day] = { good: 0, bad: 0, total: 0 };
            }
            dayOfWeekMap[day].total++;
            if (mood === 'Feel OK' || mood === 'Good') dayOfWeekMap[day].good++;
            if (mood === 'Very Bad' || mood === 'Bad') dayOfWeekMap[day].bad++;

            // Hour patterns
            if (!hourMap[hour]) {
                hourMap[hour] = { good: 0, bad: 0, total: 0 };
            }
            hourMap[hour].total++;
            if (mood === 'Feel OK' || mood === 'Good') hourMap[hour].good++;
            if (mood === 'Very Bad' || mood === 'Bad') hourMap[hour].bad++;
        });

        // Find worst days
        const worstDays = Object.entries(dayOfWeekMap)
            .filter(([_, data]) => data.total >= 2)
            .sort((a, b) => (b[1].bad / b[1].total) - (a[1].bad / a[1].total))
            .slice(0, 2)
            .map(([day, data]) => ({ day, badPercentage: Math.round((data.bad / data.total) * 100) }));

        return { worstDays };
    }

    /**
     * Detect nutrient deficiencies
     */
    detectDeficiencies(logs) {
        const recentLogs = logs.slice(-7); // Last 7 days
        let totalProtein = 0;
        let totalCalories = 0;
        let count = 0;

        recentLogs.forEach(log => {
            if (log.food) {
                totalProtein += parseInt(log.food.protein) || 0;
                totalCalories += parseInt(log.food.calories) || 0;
                count++;
            }
        });

        const avgProtein = count > 0 ? totalProtein / count : 0;
        const avgCalories = count > 0 ? totalCalories / count : 0;

        const deficiencies = [];

        if (avgProtein < 20) {
            deficiencies.push({
                nutrient: 'Protein',
                current: Math.round(avgProtein),
                target: 50,
                severity: 'high'
            });
        }

        if (avgCalories < 1200) {
            deficiencies.push({
                nutrient: 'Calories',
                current: Math.round(avgCalories),
                target: 2000,
                severity: 'medium'
            });
        }

        return deficiencies;
    }

    /**
     * Generate proactive insights
     */
    async generateInsights() {
        await this.analyzePatterns();
        const insights = [];

        // Food-mood insights
        if (this.patterns.foodMood?.triggers?.length > 0) {
            const trigger = this.patterns.foodMood.triggers[0];
            insights.push({
                type: 'warning',
                title: '⚠️ Trigger Food Detected',
                message: `You've logged "${trigger.food}" ${trigger.count} times, and ${trigger.badPercentage}% of the time you felt bad after. Consider trying alternatives!`,
                actionable: true,
                actions: ['Find alternatives', 'Learn more']
            });
        }

        if (this.patterns.foodMood?.safe?.length > 0) {
            const safe = this.patterns.foodMood.safe[0];
            insights.push({
                type: 'suggestion',
                title: '✅ Safe Food Found',
                message: `"${safe.food}" makes you feel good ${safe.goodPercentage}% of the time! Add it to your meal plan.`,
                actionable: true,
                actions: ['Add to plan']
            });
        }

        // Time-based insights
        if (this.patterns.time?.worstDays?.length > 0) {
            const worstDay = this.patterns.time.worstDays[0];
            insights.push({
                type: 'pattern',
                title: '📅 Weekly Pattern',
                message: `Your mood tends to be lower on ${worstDay.day}s. Try a protein-rich breakfast to boost energy!`,
                actionable: false
            });
        }

        // Deficiency insights
        if (this.patterns.deficiencies?.length > 0) {
            const deficiency = this.patterns.deficiencies[0];
            insights.push({
                type: 'warning',
                title: `⚠️ Low ${deficiency.nutrient}`,
                message: `You're averaging ${deficiency.current}g ${deficiency.nutrient.toLowerCase()}/day (target: ${deficiency.target}g). Add more protein-rich foods!`,
                actionable: true,
                actions: ['See recommendations']
            });
        }

        this.insights = insights;
        return insights;
    }

    /**
     * Predict mood for a planned meal
     */
    async predictMood(foodName) {
        const logs = this.storageService.getLogs();
        const similarLogs = logs.filter(log =>
            log.food?.name.toLowerCase().includes(foodName.toLowerCase())
        );

        if (similarLogs.length === 0) {
            return {
                prediction: 'unknown',
                confidence: 0,
                message: `No data for "${foodName}" yet. Try it and see how you feel!`
            };
        }

        let goodCount = 0;
        let badCount = 0;

        similarLogs.forEach(log => {
            const mood = log.mood?.mood;
            if (mood === 'Feel OK' || mood === 'Good') goodCount++;
            if (mood === 'Very Bad' || mood === 'Bad') badCount++;
        });

        const total = goodCount + badCount;
        const goodPercentage = (goodCount / total) * 100;

        let prediction, emoji;
        if (goodPercentage > 70) {
            prediction = 'good';
            emoji = '😊';
        } else if (goodPercentage < 30) {
            prediction = 'bad';
            emoji = '😕';
        } else {
            prediction = 'neutral';
            emoji = '😐';
        }

        return {
            prediction,
            confidence: Math.round(goodPercentage),
            message: `${emoji} Based on ${total} previous logs, you feel ${prediction} after "${foodName}" ${Math.round(goodPercentage)}% of the time.`
        };
    }

    /**
     * Suggest food substitutions
     */
    async suggestSubstitutions(foodName) {
        // Use AI to suggest alternatives
        const prompt = `The user often feels bad after eating "${foodName}". Suggest 3 healthier alternatives that are similar but might be better tolerated. Return ONLY a JSON array of strings: ["Alternative 1", "Alternative 2", "Alternative 3"]`;

        try {
            const result = await this.analysisService.analyze('text', { prompt });
            return result;
        } catch (error) {
            // Fallback to common substitutions
            const commonSubs = {
                'dairy': ['Almond milk', 'Oat milk', 'Coconut yogurt'],
                'bread': ['Rice cakes', 'Gluten-free bread', 'Lettuce wraps'],
                'pasta': ['Zucchini noodles', 'Rice noodles', 'Quinoa'],
                'sugar': ['Honey', 'Maple syrup', 'Stevia']
            };

            for (const [key, subs] of Object.entries(commonSubs)) {
                if (foodName.toLowerCase().includes(key)) {
                    return subs;
                }
            }

            return ['Consult a nutritionist', 'Try elimination diet', 'Keep tracking'];
        }
    }

    /**
     * Get daily tip
     */
    getDailyTip() {
        const tips = [
            '💧 Drink water before meals to aid digestion',
            '🥗 Eat the rainbow - variety is key to nutrition',
            '🏃 Light exercise after meals can improve mood',
            '😴 Poor sleep affects food choices - aim for 7-8 hours',
            '🧘 Stress eating? Try 5 deep breaths first',
            '📝 Consistency is key - log every day for best insights',
            '🍎 Keep healthy snacks visible and junk food hidden',
            '⏰ Eat at regular times to regulate hunger hormones'
        ];

        const today = new Date().getDate();
        return tips[today % tips.length];
    }
}
