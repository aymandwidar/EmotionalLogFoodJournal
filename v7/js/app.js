/**
 * NutriMood V7 - Main App
 * Integrates all V7 features: HealthKit, Symptoms, Export, Menu Scan
 */

import { AnalysisService } from './services/analysis.js';
import { StorageService } from './services/storage.js';
import { SymptomsService } from './services/symptoms.js';
import { HealthKitService } from './services/healthkit.js';
import { ExportService } from './services/export.js';
import { MenuScanService } from './services/menuScan.js';

class NutriMoodApp {
    constructor() {
        // Initialize services
        this.analysisService = new AnalysisService();
        this.storageService = new StorageService();
        this.symptomsService = new SymptomsService(this.storageService);
        this.healthKitService = new HealthKitService();
        this.exportService = new ExportService(this.storageService, this.symptomsService);
        this.menuScanService = new MenuScanService(this.storageService, this.symptomsService);

        // Current state
        this.currentView = 'home';
        this.currentMealId = null;

        this.init();
    }

    async init() {
        console.log('🚀 NutriMood V7 Starting...');

        // Load AI settings
        const provider = localStorage.getItem('ai_provider') || 'groq';
        this.analysisService.setProvider(provider);

        // Update UI
        this.updateStreak();
        this.setupEventListeners();

        console.log('✅ NutriMood V7 Ready!');
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('app-logo').addEventListener('click', () => this.showView('home'));
        document.getElementById('biometrics-btn').addEventListener('click', () => this.showView('biometrics'));
        document.getElementById('export-btn').addEventListener('click', () => this.handleExport());
        document.getElementById('history-btn').addEventListener('click', () => this.showHistory());
        document.getElementById('settings-btn').addEventListener('click', () => this.showSettings());

        // Home actions
        document.getElementById('file-input').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('voice-btn').addEventListener('click', () => this.startVoiceLog());
        document.getElementById('menu-scan-btn').addEventListener('click', () => this.startMenuScan());
        document.getElementById('symptoms-btn').addEventListener('click', () => this.showSymptoms());
        document.getElementById('insights-btn').addEventListener('click', () => this.showInsights());

        // Biometrics
        document.getElementById('sync-health-btn')?.addEventListener('click', () => this.syncHealthData());
        document.getElementById('back-biometrics-btn')?.addEventListener('click', () => this.showView('home'));

        // Settings
        document.getElementById('save-settings-btn').addEventListener('click', () => this.saveSettings());
        document.getElementById('close-settings-btn').addEventListener('click', () => this.closeSettings());
    }

    // ===== VIEW MANAGEMENT =====
    showView(viewName) {
        const views = document.querySelectorAll('.view');
        views.forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.remove('hidden');
            targetView.classList.add('active');
            this.currentView = viewName;
        }
    }

    // ===== FOOD SCANNING =====
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showLoading('Analyzing food...');

            const result = await this.analysisService.analyzeImage(file);

            if (result.error) {
                alert('Not food detected. Please try another image.');
                return;
            }

            // Save the meal
            const mealId = Date.now();
            this.currentMealId = mealId;

            await this.storageService.addLog({
                id: mealId,
                timestamp: new Date().toISOString(),
                food: result,
                image: await this.fileToBase64(file)
            });

            // Ask for mood
            this.showMoodSelector(mealId);

        } catch (error) {
            console.error('Food scan error:', error);
            alert('Analysis failed. Please check your API key in Settings.');
        } finally {
            this.hideLoading();
        }
    }

    showMoodSelector(mealId) {
        // For now, show a simple alert (you can create a proper modal)
        const mood = prompt('How do you feel? (Good/Bad/Neutral)');
        if (mood) {
            const log = this.storageService.getLogs().find(l => l.id === mealId);
            if (log) {
                log.mood = { mood };
                this.storageService.updateLog(log);
            }
        }

        // Ask if they want to log symptoms
        if (confirm('Do you want to log any symptoms?')) {
            this.showSymptomLogger(mealId);
        }
    }

    // ===== SYMPTOMS =====
    showSymptoms() {
        this.showSymptomLogger(null);
    }

    showSymptomLogger(mealId) {
        const symptomTypes = this.symptomsService.getSymptomTypes();

        const symptomList = symptomTypes.map(s => `${s.emoji} ${s.name}`).join('\n');
        const choice = prompt(`Select a symptom:\n${symptomList}\n\nEnter the number (1-${symptomTypes.length}):`);

        if (!choice) return;

        const index = parseInt(choice) - 1;
        if (index >= 0 && index < symptomTypes.length) {
            const symptom = symptomTypes[index];
            const intensity = prompt('Intensity (1-5):', '3');
            const hours = mealId ? prompt('Hours after meal:', '0') : '0';

            this.symptomsService.logSymptom({
                symptomType: symptom.id,
                intensity: parseInt(intensity) || 3,
                hoursAfterMeal: parseInt(hours) || 0,
                linkedMealId: mealId
            });

            alert(`${symptom.emoji} ${symptom.name} logged!`);
        }
    }

    // ===== HEALTHKIT =====
    async syncHealthData() {
        try {
            const data = await this.healthKitService.fetchTodayData();

            if (data) {
                this.healthKitService.saveBiometrics(data);
                this.updateBiometricsUI(data);

                if (data.simulated) {
                    alert('ℹ️ Showing simulated data.\n\nTo use real HealthKit data, you need to wrap this app with Capacitor.');
                } else {
                    alert('✅ Health data synced!');
                }
            }
        } catch (error) {
            console.error('HealthKit sync error:', error);
            alert('Failed to sync health data.');
        }
    }

    updateBiometricsUI(data) {
        document.getElementById('sleep-duration').textContent = data.sleep?.duration.toFixed(1) || '--';
        document.getElementById('step-count').textContent = data.steps?.toLocaleString() || '--';
        document.getElementById('heart-rate').textContent = data.heartRate?.avg || '--';
    }

    // ===== EXPORT =====
    async handleExport() {
        if (confirm('Export your data to CSV?')) {
            try {
                await this.exportService.exportToCSV();
                alert('✅ Data exported successfully!');
            } catch (error) {
                console.error('Export error:', error);
                alert('Export failed.');
            }
        }
    }

    // ===== MENU SCAN =====
    async startMenuScan() {
        const file = await this.selectImage();
        if (!file) return;

        try {
            this.showLoading('Scanning menu...');

            const result = await this.menuScanService.scanMenu(file);

            if (result.success) {
                this.showMenuScanResults(result);
            } else {
                alert('Menu scan failed. Please try another image.');
            }

        } catch (error) {
            console.error('Menu scan error:', error);
            alert('Make sure Tesseract.js is loaded.');
        } finally {
            this.hideLoading();
        }
    }

    showMenuScanResults(result) {
        const items = result.analysis.map(item =>
            `${this.menuScanService.getStatusEmoji(item.status)} ${item.name}\n${item.reason || ''}`
        ).join('\n\n');

        alert(`Menu Scan Results (${result.itemsFound} items):\n\n${items}`);
    }

    async selectImage() {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => resolve(e.target.files[0]);
            input.click();
        });
    }

    // ===== VOICE LOG =====
    async startVoiceLog() {
        alert('🎙️ Voice logging coming soon! For now, use text or camera.');
    }

    // ===== HISTORY =====
    showHistory() {
        const logs = this.storageService.getLogs();
        if (logs.length === 0) {
            alert('No food logs yet. Start by scanning a meal!');
            return;
        }

        const history = logs.slice(0, 10).map((log, i) => {
            const date = new Date(log.timestamp).toLocaleDateString();
            return `${i + 1}. ${log.food.name} (${log.food.calories}kcal) - ${date}`;
        }).join('\n');

        alert(`Recent Meals:\n\n${history}`);
    }

    // ===== INSIGHTS =====
    showInsights() {
        const correlations = this.symptomsService.getSymptomCorrelations();

        if (Object.keys(correlations).length === 0) {
            alert('No correlations yet. Log more meals and symptoms!');
            return;
        }

        let insights = 'Food-Symptom Correlations:\n\n';

        Object.entries(correlations).forEach(([symptom, foods]) => {
            if (foods.length > 0) {
                insights += `${symptom}:\n`;
                foods.slice(0, 3).forEach(f => {
                    insights += `  • ${f.food} (${f.count}x, intensity ${f.avgIntensity.toFixed(1)})\n`;
                });
                insights += '\n';
            }
        });

        alert(insights);
    }

    // ===== SETTINGS =====
    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
        document.getElementById('provider-select').value = this.analysisService.provider;
    }

    saveSettings() {
        const provider = document.getElementById('provider-select').value;
        const apiKey = document.getElementById('api-key-input').value;

        this.analysisService.setProvider(provider);

        if (apiKey) {
            if (provider === 'groq') this.analysisService.setGroqApiKey(apiKey);
            else if (provider === 'gemini') this.analysisService.setGeminiApiKey(apiKey);
            else if (provider === 'claude') this.analysisService.setClaudeApiKey(apiKey);
        }

        this.closeSettings();
        alert('✅ Settings saved!');
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
        document.getElementById('api-key-input').value = '';
    }

    // ===== UTILITIES =====
    updateStreak() {
        const logs = this.storageService.getLogs();
        const streak = this.calculateStreak(logs);
        document.getElementById('streak-count').textContent = streak;
    }

    calculateStreak(logs) {
        if (logs.length === 0) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);

            const hasLog = logs.some(log => {
                const logDate = new Date(log.timestamp);
                logDate.setHours(0, 0, 0, 0);
                return logDate.getTime() === checkDate.getTime();
            });

            if (hasLog) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    }

    showLoading(message) {
        // Simple loading indicator (you can enhance this)
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:30px;border-radius:20px;z-index:1000;';
        loader.innerHTML = `<div class="scanner-animation"></div><p>${message}</p>`;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById('app-loader');
        if (loader) loader.remove();
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}

// Initialize app
const app = new NutriMoodApp();
window.app = app;
