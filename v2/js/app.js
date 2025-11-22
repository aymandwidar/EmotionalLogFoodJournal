import { AnalysisService } from './analysis.js';
import { StorageService } from './storage.js';

console.log("app.js module loaded");
console.log("app.js module loaded");

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
            report: document.getElementById('report-view'),
            insights: document.getElementById('insights-view'),
            recipes: document.getElementById('recipes-view')
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
        this.fats = document.getElementById('fats');
        this.confirmFoodBtn = document.getElementById('confirm-food-btn');
        this.cancelFoodBtn = document.getElementById('cancel-food-btn');

        // Mood Elements
        this.moodBtns = document.querySelectorAll('.mood-btn');

        // History Elements
        this.historyList = document.getElementById('history-list');

        // Insights Elements
        this.insightsBtn = document.getElementById('insights-btn');
        this.backHomeInsightsBtn = document.getElementById('back-home-insights-btn');
        this.triggerList = document.getElementById('trigger-list');
        this.safeList = document.getElementById('safe-list');
        // Recipes Elements
        this.fridgeInput = document.getElementById('fridge-input');
        this.recipesList = document.getElementById('recipes-list');
        this.recipeLoader = document.getElementById('recipe-loader');
        this.backHomeRecipesBtn = document.getElementById('back-home-recipes-btn');
    }

    bindEvents() {
        // Navigation
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.fridgeInput.addEventListener('change', (e) => this.handleFridgeUpload(e));
        this.historyBtn.addEventListener('click', () => this.switchView('history'));
        this.reportBtn.addEventListener('click', () => {
            this.renderReport();
            this.switchView('report');
        });
        this.insightsBtn.addEventListener('click', () => {
            this.renderInsights();
            this.switchView('insights');
        });
        this.backHomeBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeReportBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeInsightsBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeRecipesBtn.addEventListener('click', () => this.switchView('home'));

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
                { name: "Test Fruit", calories: 100, protein: "1g", carbs: "25g", fats: "0g" },
                { name: "Spicy Tacos", calories: 600, protein: "25g", carbs: "40g", fats: "20g" },
                { name: "Ice Cream", calories: 400, protein: "5g", carbs: "50g", fats: "20g" }
            ];
            this.storageService.generateRandomData(dummyDB);
            this.renderReport();
            alert("Generated random data for the week!");
        });

        // Analysis Flow
        this.confirmFoodBtn.addEventListener('click', () => this.switchView('mood'));
        this.cancelFoodBtn.addEventListener('click', () => {
            this.fileInput.value = ''; // Reset input
            this.switchView('home');
        });

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
        if (!targetView) {
            // Handle case where view might not be in list (e.g. insights added dynamically)
            const dynView = document.getElementById(viewName + '-view');
            if (dynView) {
                dynView.classList.remove('hidden');
                requestAnimationFrame(() => dynView.classList.add('active'));
            }
            return;
        }

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

    async handleFridgeUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            this.switchView('recipes');
            this.recipeLoader.style.display = 'flex';
            this.recipesList.classList.add('hidden');

            const result = await this.analysisService.analyzeFridge(file);
            this.renderRecipes(result.recipes);

        } catch (error) {
            console.error(error);
            if (error.message === "API_KEY_MISSING") {
                alert("Please enter your Gemini API Key in Settings.");
                this.openSettings();
                this.switchView('home');
            } else {
                alert("Chef Error: " + error.message);
                this.switchView('home');
            }
        }
        // Reset input
        this.fridgeInput.value = '';
    }

    renderRecipes(recipes) {
        this.recipeLoader.style.display = 'none';
        this.recipesList.classList.remove('hidden');
        this.recipesList.innerHTML = '';

        if (!recipes || recipes.length === 0) {
            this.recipesList.innerHTML = '<p>No recipes found. Try a clearer photo!</p>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>${recipe.description}</p>
                <div class="recipe-meta">🔥 ${recipe.calories}</div>
            `;
            this.recipesList.appendChild(card);
        });
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
        if (!this.state.currentAnalysis) {
            alert("Error: No food data found. Please scan again.");
            return;
        }

        const entry = {
            food: this.state.currentAnalysis,
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
            // Robustness check for corrupted logs
            if (!log.food) {
                console.warn("Skipping corrupted log entry:", log);
                return;
            }

            const date = new Date(log.timestamp).toLocaleDateString();
            const time = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const item = document.createElement('div');
            item.className = 'history-item';
            item.style.borderLeftColor = log.mood ? log.mood.color : '#ccc';

            item.innerHTML = `
                <div class="history-img-placeholder" style="width:50px; height:50px; background:#333; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px;">
                    ${log.image ? `<img src="${log.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : '🍱'}
                </div>
                <div class="history-info">
                    <h4>${log.food.name || 'Unknown Food'}</h4>
                    <p>${date} • ${time} • ${log.food.calories || 0} kcal</p>
                </div>
                <div class="mood-badge" title="${log.mood ? log.mood.mood : 'Unknown'}">
                    ${log.mood ? this.getMoodEmoji(log.mood.mood) : '❓'}
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

    renderInsights() {
        const report = this.storageService.getSensitivityReport();

        const renderList = (list, container) => {
            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = '<li><span class="insight-name">None yet</span></li>';
                return;
            }
            list.slice(0, 5).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="insight-name">${item.name}</span>
                    <span class="insight-count">${item.count}x</span>
                `;
                container.appendChild(li);
            });
        };

        renderList(report.triggers, this.triggerList);
        renderList(report.safe, this.safeList);
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
