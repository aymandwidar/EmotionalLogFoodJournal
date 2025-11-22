/**
 * Notification Service - V6
 * Manages browser notifications and reminders
 */

export class NotificationService {
    constructor() {
        this.permission = 'default';
        this.reminders = [];
        this.init();
    }

    async init() {
        // Check current permission status
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }

        // Load saved reminders from localStorage
        const saved = localStorage.getItem('nutrimood_reminders');
        if (saved) {
            this.reminders = JSON.parse(saved);
        }
    }

    /**
     * Request notification permission
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            throw new Error('This browser does not support notifications');
        }

        if (this.permission === 'granted') {
            return true;
        }

        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
    }

    /**
     * Send a notification
     */
    async sendNotification(title, body, data = {}) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        const notification = new Notification(title, {
            body,
            icon: '/EmotionalLogFoodJournal/v6/icon-192.png',
            badge: '/EmotionalLogFoodJournal/v6/icon-192.png',
            data,
            requireInteraction: false
        });

        return notification;
    }

    /**
     * Schedule a reminder
     */
    scheduleReminder(type, time, days = [0, 1, 2, 3, 4, 5, 6]) {
        const reminder = {
            id: this.generateId(),
            type, // 'meal', 'streak', 'goal', 'insight'
            time, // HH:MM format
            days, // Array of day numbers (0 = Sunday)
            enabled: true
        };

        this.reminders.push(reminder);
        this.saveReminders();
        return reminder;
    }

    /**
     * Get all reminders
     */
    getReminders() {
        return this.reminders;
    }

    /**
     * Update reminder
     */
    updateReminder(id, updates) {
        const reminder = this.reminders.find(r => r.id === id);
        if (!reminder) return null;

        Object.assign(reminder, updates);
        this.saveReminders();
        return reminder;
    }

    /**
     * Delete reminder
     */
    deleteReminder(id) {
        this.reminders = this.reminders.filter(r => r.id !== id);
        this.saveReminders();
    }

    /**
     * Check if it's time to send a reminder
     */
    checkReminders() {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        for (const reminder of this.reminders) {
            if (!reminder.enabled) continue;
            if (!reminder.days.includes(currentDay)) continue;
            if (reminder.time !== currentTime) continue;

            // Send notification based on type
            this.sendReminderNotification(reminder);
        }
    }

    /**
     * Send reminder notification
     */
    async sendReminderNotification(reminder) {
        let title, body;

        switch (reminder.type) {
            case 'meal':
                title = '🍽️ Meal Time!';
                body = 'Don\'t forget to log your meal and track your mood!';
                break;
            case 'streak':
                title = '🔥 Keep Your Streak!';
                body = 'You haven\'t logged today. Keep your streak alive!';
                break;
            case 'goal':
                title = '🎯 Goal Progress';
                body = 'Check your goal progress and stay on track!';
                break;
            case 'insight':
                title = '📊 Weekly Insights';
                body = 'Your weekly insights are ready!';
                break;
            default:
                title = 'NutriMood Reminder';
                body = 'Time to check in!';
        }

        await this.sendNotification(title, body, { type: reminder.type });
    }

    /**
     * Save reminders to localStorage
     */
    saveReminders() {
        localStorage.setItem('nutrimood_reminders', JSON.stringify(this.reminders));
    }

    /**
     * Check if notifications are supported
     */
    isSupported() {
        return 'Notification' in window;
    }

    generateId() {
        return 'reminder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}
