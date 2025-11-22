import { AnalysisService } from './analysis.js';
import { StorageService } from './storage.js';

console.log("app.js module loaded");
alert("app.js module loaded"); // DEBUG: Remove later

export default class App {
    constructor() {
        this.analysisService = new AnalysisService();
        this.storageService = new StorageService();

        this.state = {
            currentImage: null,
            currentAnalysis: null,
            currentMood: null
        };

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderHistory(); // Initial render if any
    }

    cacheDOM() {
        // Views
        this.views = {
            home: document.getElementById('home-view'),
            analysis: document.getElementById('analysis-view'),
            mood: document.getElementById('mood-view'),
            history: document.getElementById('history-view'),
            report: document.getElementById('report-view')
        };

        // Elements
        this.scanBtn = document.getElementById('scan-btn'); // Now a label
        this.fileInput = document.getElementById('file-input');
        this.historyBtn = document.getElementById('history-btn');
        this.reportBtn = document.getElementById('report-btn');
        this.settingsBtn = document.getElementById('settings-btn'); // New
        this.backHomeBtn = document.getElementById('back-home-btn');
        this.backHomeReportBtn = document.getElementById('back-home-report-btn');
        this.generateDataBtn = document.getElementById('generate-data-btn');

        // Settings Modal
        this.settingsModal = document.getElementById('settings-modal');
        this.apiKeyInput = document.getElementById('api-key-input');
        this.modelSelect = document.getElementById('model-select');
        this.saveKeyBtn = document.getElementById('save-key-btn');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');

        // Report Elements
        this.totalCals = document.getElementById('total-cals');
        this.avgCals = document.getElementById('avg-cals');
        this.moodChart = document.getElementById('mood-chart');

        // Analysis Elements
        this.loaderContainer = document.querySelector('.loader-container');
        this.resultsCard = document.getElementById('analysis-results');
        this.previewImg = document.getElementById('preview-img');
        this.foodName = document.getElementById('food-name');
        this.calories = document.getElementById('calories');
        this.protein = document.getElementById('protein');
        this.carbs = document.getElementById('carbs');
        this.fats = document.getElementById('fats');
        this.confirmFoodBtn = document.getElementById('confirm-food-btn');

        // Mood Elements
        this.moodBtns = document.querySelectorAll('.mood-btn');

        // History Elements
        this.historyList = document.getElementById('history-list');
    }

    bindEvents() {
        // Navigation
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.historyBtn.addEventListener('click', () => this.switchView('history'));
        this.reportBtn.addEventListener('click', () => {
            this.renderReport();
            this.switchView('report');
        });
        this.backHomeBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeReportBtn.addEventListener('click', () => this.switchView('home'));

        this.checkConnBtn = document.getElementById('check-conn-btn');

        // Settings
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());

        this.checkConnBtn.addEventListener('click', async () => {
            const key = this.apiKeyInput.value.trim();
            if (!key) { alert("Enter key first"); return; }
            this.analysisService.setApiKey(key);

            try {
                this.checkConnBtn.textContent = "Checking...";
                const models = await this.analysisService.listModels();
                alert("Connection Successful!\nAvailable Models:\n" + models.filter(m => m.includes('gemini')).join('\n'));
                this.checkConnBtn.textContent = "Check Connection";
            } catch (e) {
                alert("Connection Failed: " + e.message);
                this.checkConnBtn.textContent = "Check Connection";
            }
        });

        this.saveKeyBtn.addEventListener('click', () => {
            const key = this.apiKeyInput.value.trim();
            const model = this.modelSelect.value;

            if (key) {
                this.analysisService.setApiKey(key);
                this.analysisService.setModel(model);
                this.closeSettings();
                alert("Settings Saved!");
            } else {
                alert("Please enter a valid key.");
            }
        });

        // Debug / Test Data
        this.generateDataBtn.addEventListener('click', () => {
            const dummyDB = [
                { name: "Test Salad", calories: 300, protein: "10g", carbs: "20g", fats: "10g" },
                { name: "Test Burger", calories: 800, protein: "40g", carbs: "50g", fats: "40g" },
                { name: "Test Fruit", calories: 100, protein: "1g", carbs: "25g", fats: "0g" }
            ];
            this.storageService.generateRandomData(dummyDB);
            this.renderReport();
            alert("Generated random data for the week!");
        });

        // Analysis Flow
        this.confirmFoodBtn.addEventListener('click', () => this.switchView('mood'));

        // Mood Selection
        this.moodBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mood = btn.dataset.mood;
                const color = btn.dataset.color;
                this.handleMoodSelection(mood, color);
            });
        });
    }

    openSettings() {
        this.apiKeyInput.value = this.analysisService.apiKey || '';
        this.settingsModal.classList.remove('hidden');
    }

    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }

    switchView(viewName) {
        // Hide all views
        Object.values(this.views).forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('active');
        });

        // Show target view
        const targetView = this.views[viewName];
        targetView.classList.remove('hidden');

        // Small delay to allow display:block to apply before opacity transition
        requestAnimationFrame(() => {
            targetView.classList.add('active');
        });
    }

    async handleFileUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) {
                return;
            }

            this.state.currentImage = file;

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                if (this.previewImg) {
                    this.previewImg.src = e.target.result;
                }
            };
            reader.readAsDataURL(file);

            // Switch to analysis view
            this.switchView('analysis');

            this.resetAnalysisView();

            // Start Analysis
            const result = await this.analysisService.analyzeImage(file);

            this.state.currentAnalysis = result;
            this.showAnalysisResults(result);
        } catch (error) {
            console.error(error);

            if (error.message === "API_KEY_MISSING") {
                alert("Please enter your Gemini API Key in Settings.");
                this.openSettings();
                this.switchView('home');
            } else {
                alert("Analysis Error: " + error.message);
                this.switchView('home');
            }
        }

        // Reset input
        this.fileInput.value = '';
    }

    resetAnalysisView() {
        this.loaderContainer.style.display = 'flex';
        this.resultsCard.classList.add('hidden');
    }

    showAnalysisResults(data) {
        this.loaderContainer.style.display = 'none';
        this.resultsCard.classList.remove('hidden');

        // Populate data
        this.foodName.textContent = data.name;
        this.calories.textContent = data.calories;
        this.protein.textContent = data.protein;
        this.carbs.textContent = data.carbs;
        this.fats.textContent = data.fats;
    }

    handleMoodSelection(mood, color) {
        this.state.currentMood = { mood, color };

        // Save Entry
        this.saveEntry();

        // Go to History
        this.switchView('history');
    }

    saveEntry() {
        const entry = {
            food: this.state.currentAnalysis,
            mood: this.state.currentMood,
            mood: this.state.currentMood,
            image: null // Disable image saving to prevent QuotaExceededError
        };

        this.storageService.addLog(entry);
        this.renderHistory();
    }

    renderHistory() {
        const logs = this.storageService.getLogs();
        this.historyList.innerHTML = '';

        if (logs.length === 0) {
            this.historyList.innerHTML = '<div class="empty-state">No logs yet. Start scanning!</div>';
            return;
        }

        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString();
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.borderLeftColor = log.mood.color;

            item.innerHTML = `
                <div class="history-img-placeholder" style="width:50px; height:50px; background:#333; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px;">
                    ${log.image ? `<img src="${log.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : '🍱'}
                </div>
                <div class="history-info">
                    <h4>${log.food.name}</h4>
                    <p>${date} • ${time} • ${log.food.calories} kcal</p>
                </div>
                <div class="mood-badge" title="${log.mood.mood}">
                    ${this.getMoodEmoji(log.mood.mood)}
                </div>
            `;

            this.historyList.appendChild(item);
        });
    }

    renderReport() {
        const summary = this.storageService.getWeeklySummary();

        this.totalCals.textContent = summary.totalCalories.toLocaleString();
        this.avgCals.textContent = summary.avgCalories.toLocaleString();

        // Render Mood Chart
        this.moodChart.innerHTML = '';
        const moods = ['Very Bad', 'Bad', 'Neutral', 'Good', 'Feel OK'];
        const colors = {
            'Very Bad': '#ff4b4b',
            'Bad': '#ff9f43',
            'Neutral': '#feca57',
            'Good': '#54a0ff',
            'Feel OK': '#1dd1a1'
        };

        moods.forEach(mood => {
            const count = summary.moodCounts[mood] || 0;
            const percentage = summary.totalEntries ? (count / summary.totalEntries) * 100 : 0;

            const row = document.createElement('div');
            row.className = 'chart-bar-container';
            row.innerHTML = `
                <span style="width: 80px;">${mood}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${percentage}%; background-color: ${colors[mood]}"></div>
                </div>
                <span class="chart-count">${count}</span>
            `;
            this.moodChart.appendChild(row);
        });
    }

    getMoodEmoji(moodName) {
        const map = {
            'Very Bad': '😫',
            'Bad': '😕',
            'Neutral': '😐',
            'Good': '🙂',
            'Feel OK': '🥰'
        };
        return map[moodName] || '❓';
    }
}

// Initialize App
// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing App...");
    try {
        window.app = new App();
        console.log("App initialized successfully.");
    } catch (e) {
        console.error("App initialization failed:", e);
        alert("App failed to load: " + e.message);
    }
});
