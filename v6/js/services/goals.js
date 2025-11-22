/**
 * Goals Service - V6
 * Manages user goals (calories, protein, mood, streaks, custom)
 */

export class GoalsService {
    constructor(storageService) {
        this.storageService = storageService;
        this.goals = [];
        // Load goals synchronously
        this.loadGoals();
    }

    async loadGoals() {
        // Load goals from storage
        this.goals = await this.storageService.getGoals() || [];
    }

    /**
     * Create a new goal
     */
    async createGoal(type, target, deadline = null) {
        const goal = {
            id: this.generateId(),
            type, // 'calories', 'protein', 'mood', 'streak', 'custom'
            target,
            current: 0,
            deadline,
            createdAt: new Date().toISOString(),
            status: 'active' // 'active', 'completed', 'failed'
        };

        this.goals.push(goal);
        await this.storageService.saveGoals(this.goals);
        return goal;
    }

    /**
     * Get all goals
     */
    getGoals(status = null) {
        if (status) {
            return this.goals.filter(g => g.status === status);
        }
        return this.goals;
    }

    /**
     * Update goal progress
     */
    async updateProgress(goalId, progress) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return null;

        goal.current = progress;

        // Check if goal is completed
        if (goal.current >= goal.target) {
            goal.status = 'completed';
            goal.completedAt = new Date().toISOString();
        }

        // Check if goal failed (deadline passed)
        if (goal.deadline && new Date(goal.deadline) < new Date() && goal.status === 'active') {
            goal.status = 'failed';
        }

        await this.storageService.saveGoals(this.goals);
        return goal;
    }

    /**
     * Delete a goal
     */
    async deleteGoal(goalId) {
        this.goals = this.goals.filter(g => g.id !== goalId);
        await this.storageService.saveGoals(this.goals);
    }

    /**
     * Check and update all goals based on current stats
     */
    async checkGoals(stats) {
        for (const goal of this.goals) {
            if (goal.status !== 'active') continue;

            let progress = 0;
            switch (goal.type) {
                case 'calories':
                    progress = stats.totalCalories || 0;
                    break;
                case 'protein':
                    progress = stats.totalProtein || 0;
                    break;
                case 'mood':
                    progress = stats.goodMoodDays || 0;
                    break;
                case 'streak':
                    progress = stats.currentStreak || 0;
                    break;
            }

            await this.updateProgress(goal.id, progress);
        }
    }

    /**
     * Get goal progress percentage
     */
    getProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return 0;
        return Math.min((goal.current / goal.target) * 100, 100);
    }

    generateId() {
        return 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
