/**
 * Achievements Service - V6
 * Manages achievement badges and unlocking logic
 */

export class AchievementsService {
    constructor(storageService) {
        this.storageService = storageService;
        this.achievements = this.defineAchievements();
        this.unlockedAchievements = [];
        // Load unlocked achievements
        this.loadUnlocked();
    }

    async loadUnlocked() {
        // Load unlocked achievements from storage
        this.unlockedAchievements = await this.storageService.getUnlockedAchievements() || [];
    }

    /**
     * Define all available achievements
     */
    defineAchievements() {
        return [
            // Streak Badges
            { id: 'first_step', name: 'First Step', description: 'Log your first day', icon: '🔥', requirement: { type: 'streak', value: 1 }, rarity: 'common' },
            { id: 'getting_started', name: 'Getting Started', description: '3-day streak', icon: '🔥', requirement: { type: 'streak', value: 3 }, rarity: 'common' },
            { id: 'week_warrior', name: 'Week Warrior', description: '7-day streak', icon: '🔥', requirement: { type: 'streak', value: 7 }, rarity: 'rare' },
            { id: 'month_master', name: 'Month Master', description: '30-day streak', icon: '🔥', requirement: { type: 'streak', value: 30 }, rarity: 'epic' },
            { id: 'unstoppable', name: 'Unstoppable', description: '100-day streak', icon: '🔥', requirement: { type: 'streak', value: 100 }, rarity: 'legendary' },

            // Volume Badges
            { id: 'beginner', name: 'Beginner', description: 'Log 10 meals', icon: '📝', requirement: { type: 'logs', value: 10 }, rarity: 'common' },
            { id: 'dedicated', name: 'Dedicated', description: 'Log 50 meals', icon: '📝', requirement: { type: 'logs', value: 50 }, rarity: 'rare' },
            { id: 'expert', name: 'Expert', description: 'Log 100 meals', icon: '📝', requirement: { type: 'logs', value: 100 }, rarity: 'epic' },
            { id: 'master', name: 'Master', description: 'Log 500 meals', icon: '📝', requirement: { type: 'logs', value: 500 }, rarity: 'legendary' },

            // Mood Badges
            { id: 'mood_tracker', name: 'Mood Tracker', description: 'Track 10 moods', icon: '😊', requirement: { type: 'moods', value: 10 }, rarity: 'common' },
            { id: 'happiness_hunter', name: 'Happiness Hunter', description: '7 consecutive good days', icon: '😊', requirement: { type: 'good_streak', value: 7 }, rarity: 'rare' },
            { id: 'mood_master', name: 'Mood Master', description: 'Track all mood types', icon: '😊', requirement: { type: 'all_moods', value: 5 }, rarity: 'epic' },

            // Discovery Badges
            { id: 'food_explorer', name: 'Food Explorer', description: 'Try 20 different foods', icon: '🍽️', requirement: { type: 'unique_foods', value: 20 }, rarity: 'common' },
            { id: 'variety_seeker', name: 'Variety Seeker', description: 'Log 50 unique foods', icon: '🍽️', requirement: { type: 'unique_foods', value: 50 }, rarity: 'rare' },
            { id: 'culinary_master', name: 'Culinary Master', description: 'Log 100 unique foods', icon: '🍽️', requirement: { type: 'unique_foods', value: 100 }, rarity: 'epic' },

            // Goal Badges
            { id: 'goal_setter', name: 'Goal Setter', description: 'Set your first goal', icon: '🎯', requirement: { type: 'goals_set', value: 1 }, rarity: 'common' },
            { id: 'achiever', name: 'Achiever', description: 'Complete 1 goal', icon: '🎯', requirement: { type: 'goals_completed', value: 1 }, rarity: 'rare' },
            { id: 'overachiever', name: 'Overachiever', description: 'Complete 5 goals', icon: '🎯', requirement: { type: 'goals_completed', value: 5 }, rarity: 'epic' },
            { id: 'goal_master', name: 'Goal Master', description: 'Complete 20 goals', icon: '🎯', requirement: { type: 'goals_completed', value: 20 }, rarity: 'legendary' }
        ];
    }

    /**
     * Check if user has unlocked any new achievements
     */
    async checkAchievements(stats) {
        const newlyUnlocked = [];

        for (const achievement of this.achievements) {
            // Skip if already unlocked
            if (this.isUnlocked(achievement.id)) continue;

            // Check if requirement is met
            if (this.checkRequirement(achievement.requirement, stats)) {
                await this.unlockAchievement(achievement.id);
                newlyUnlocked.push(achievement);
            }
        }

        return newlyUnlocked;
    }

    /**
     * Check if a specific requirement is met
     */
    checkRequirement(requirement, stats) {
        const { type, value } = requirement;

        switch (type) {
            case 'streak':
                return stats.currentStreak >= value;
            case 'logs':
                return stats.totalLogs >= value;
            case 'moods':
                return stats.totalMoods >= value;
            case 'good_streak':
                return stats.goodMoodStreak >= value;
            case 'all_moods':
                return stats.uniqueMoods >= value;
            case 'unique_foods':
                return stats.uniqueFoods >= value;
            case 'goals_set':
                return stats.goalsSet >= value;
            case 'goals_completed':
                return stats.goalsCompleted >= value;
            default:
                return false;
        }
    }

    /**
     * Unlock an achievement
     */
    async unlockAchievement(achievementId) {
        if (this.isUnlocked(achievementId)) return;

        this.unlockedAchievements.push({
            id: achievementId,
            unlockedAt: new Date().toISOString()
        });

        await this.storageService.saveUnlockedAchievements(this.unlockedAchievements);
    }

    /**
     * Check if achievement is unlocked
     */
    isUnlocked(achievementId) {
        return this.unlockedAchievements.some(a => a.id === achievementId);
    }

    /**
     * Get all achievements with unlock status
     */
    getAllAchievements() {
        return this.achievements.map(achievement => ({
            ...achievement,
            unlocked: this.isUnlocked(achievement.id),
            unlockedAt: this.getUnlockDate(achievement.id)
        }));
    }

    /**
     * Get unlocked achievements only
     */
    getUnlockedAchievements() {
        return this.achievements.filter(a => this.isUnlocked(a.id));
    }

    /**
     * Get unlock date for an achievement
     */
    getUnlockDate(achievementId) {
        const unlocked = this.unlockedAchievements.find(a => a.id === achievementId);
        return unlocked ? unlocked.unlockedAt : null;
    }

    /**
     * Get achievement by ID
     */
    getAchievement(achievementId) {
        return this.achievements.find(a => a.id === achievementId);
    }
}
