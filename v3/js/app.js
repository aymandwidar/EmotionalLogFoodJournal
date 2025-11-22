import { AnalysisService } from './analysis.js';
import { StorageService } from './storage.js';
import { VoiceService } from './voice.js';
import { ChatService } from './chatbot.js';

console.log("app.js module loaded");

export default class App {
    constructor() {
        this.state = {
            currentMood: null,
            currentImage: null,
            currentAnalysis: null
        };

        // Use global logger if available
        this.log = console.log;
        this.log("App Constructor Started");

        try {
            this.log("Init StorageService...");
            this.storageService = new StorageService();

            this.log("Init VoiceService...");
            this.voiceService = new VoiceService();

            this.log("Init AnalysisService...");
            this.analysisService = new AnalysisService();

            this.log("Init ChatService...");
            this.chatService = new ChatService(this.analysisService, this.storageService);

            this.log("Services Initialized");
        } catch (e) {
            this.log("Service Init Failed: " + e.message);
            console.error(e);
            // Don't throw, try to continue? No, app depends on them.
            // But maybe we can continue with limited functionality?
            // For now, let's just see the error.
        }

        this.initializeApp();
    }

    initializeApp() {
        try {
            console.log("Initializing App...");
            // alert("App Starting..."); // Uncomment if needed, but let's trust the log for now

            this.cacheDOM();
            console.log("DOM Cached");

            this.bindEvents();
            console.log("Events Bound");

            this.renderHistory();
            console.log("History Rendered");

            this.updateStreak();
            console.log("Streak Updated");
        } catch (e) {
            console.error("Init Error:", e);
        }
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
            recipes: document.getElementById('recipes-view'),
            plan: document.getElementById('plan-view'),
            grocery: document.getElementById('grocery-view'),
            trends: document.getElementById('trends-view')
        };

        // Elements
        this.historyBtn = document.getElementById('history-btn');
        this.reportBtn = document.getElementById('report-btn');
        this.settingsBtn = document.getElementById('settings-btn'); // New
        this.backHomeBtn = document.getElementById('back-home-btn');
        this.backHomeReportBtn = document.getElementById('back-home-report-btn');
        this.generateDataBtn = document.getElementById('generate-data-btn');

        // Voice Elements
        this.voiceBtn = document.getElementById('voice-btn');
        this.voiceStatus = document.getElementById('voice-status');

        // Chat Elements
        this.chatFab = document.getElementById('chat-fab');
        this.chatModal = document.getElementById('chat-modal');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.chatInput = document.getElementById('chat-input');
        this.sendChatBtn = document.getElementById('send-chat-btn');
        this.chatMessages = document.getElementById('chat-messages');

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
        this.reportMealList = document.getElementById('report-meal-list');
        this.reportAggregatedStats = document.getElementById('report-aggregated-stats');
        this.reportGoodFoods = document.getElementById('report-good-foods');
        this.reportBadFoods = document.getElementById('report-bad-foods');

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
        this.generatePlanBtn = document.getElementById('generate-plan-btn');

        // Plan Elements
        this.planLoader = document.getElementById('plan-loader');
        this.planContainer = document.getElementById('plan-container');
        this.backInsightsPlanBtn = document.getElementById('back-insights-plan-btn');

        // Grocery Elements
        this.groceryLoader = document.getElementById('grocery-loader');
        this.groceryContainer = document.getElementById('grocery-container');

        // Trends Elements
        this.trendsContainer = document.getElementById('trends-container');
        this.backInsightsTrendsBtn = document.getElementById('back-insights-trends-btn');
        if (this.backInsightsTrendsBtn) this.backInsightsTrendsBtn.addEventListener('click', () => this.switchView('insights'));

        // Recipes Elements
        this.fridgeInput = document.getElementById('fridge-input');
        this.recipesList = document.getElementById('recipes-list');
        this.recipeLoader = document.getElementById('recipe-loader');
        this.backHomeRecipesBtn = document.getElementById('back-home-recipes-btn');
    }

    bindEvents() {
        // Navigation
        this.appLogo = document.getElementById('app-logo');
        if (this.appLogo) {
            this.appLogo.addEventListener('click', () => this.switchView('home'));
        }

        this.scanBtn = document.getElementById('scan-btn');
        this.fileInput = document.getElementById('file-input');

        if (this.scanBtn && this.fileInput) {
            // Input is now overlaying the button, so we only need the change event
            this.fileInput.addEventListener('change', (e) => {
                const log = window.logToScreen || console.log;
                log("File input change event fired");
                this.handleFileUpload(e);
            });

            // Optional: Add click logger to verify interaction
            this.fileInput.addEventListener('click', () => {
                const log = window.logToScreen || console.log;
                log("File input clicked directly");
            });
        } else {
            console.error("Critical: scan-btn or file-input element not found");
            alert("Critical: Scan elements missing!");
        }

        this.voiceBtn = document.getElementById('voice-btn');
        if (this.voiceBtn) {
            this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        }

        this.typeBtn = document.getElementById('type-btn');
        if (this.typeBtn) {
            this.typeBtn.addEventListener('click', () => this.handleTypeInput());
        }

        this.fridgeInput.addEventListener('change', (e) => this.handleFridgeUpload(e));
        this.historyBtn.addEventListener('click', () => this.switchView('history'));
        this.reportBtn.addEventListener('click', () => {
            this.renderReport();
            this.switchView('report');
        });

        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        if (this.exportPdfBtn) {
            this.exportPdfBtn.addEventListener('click', () => window.print());
        }

        this.insightsBtn.addEventListener('click', () => {
            this.renderInsights();
            this.switchView('insights');
        });
        this.backHomeBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeReportBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeInsightsBtn.addEventListener('click', () => this.switchView('home'));
        this.backHomeRecipesBtn.addEventListener('click', () => this.switchView('home'));

        // Plan Navigation
        this.generatePlanBtn.addEventListener('click', () => this.handleGeneratePlan());
        this.backInsightsPlanBtn.addEventListener('click', () => this.switchView('insights'));

        // Grocery Navigation
        this.generateListBtn = document.getElementById('generate-list-btn');
        this.backPlanGroceryBtn = document.getElementById('back-plan-grocery-btn');

        if (this.generateListBtn) this.generateListBtn.addEventListener('click', () => this.handleGenerateGroceryList());
        if (this.backPlanGroceryBtn) this.backPlanGroceryBtn.addEventListener('click', () => this.switchView('plan'));

        this.checkConnBtn = document.getElementById('check-conn-btn');

        // Home Navigation
        document.getElementById('home-trends-btn').addEventListener('click', () => {
            this.switchView('trends');
            this.renderTrends();
        });

        document.getElementById('home-plan-btn').addEventListener('click', () => {
            this.handleGeneratePlan();
        });

        // Cleanup on visibility change (backgrounding app)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.voiceService.stop();
            }
        });

        // Chat
        this.chatFab.addEventListener('click', () => this.chatModal.classList.remove('hidden'));
        this.closeChatBtn.addEventListener('click', () => this.chatModal.classList.add('hidden'));

        // Close on click outside
        this.chatModal.addEventListener('click', (e) => {
            if (e.target === this.chatModal) {
                this.chatModal.classList.add('hidden');
            }
        });

        this.sendChatBtn.addEventListener('click', () => this.handleChatSend());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleChatSend();
        });

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

    async handleChatSend() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        // Add user message
        this.addChatMessage(text, 'user');
        this.chatInput.value = '';

        try {
            const reply = await this.chatService.sendMessage(text);
            this.addChatMessage(reply, 'bot');
        } catch (error) {
            console.error(error);
            this.addChatMessage("Sorry, I'm having trouble thinking right now. Check your API key!", 'bot');
        }
    }

    addChatMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.textContent = text;
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async handleGeneratePlan() {
        const report = this.storageService.getSensitivityReport();
        let safeFoods = report.safe;

        if (safeFoods.length === 0) {
            // Fallback for demo/empty state
            safeFoods = [
                { name: 'Grilled Chicken' },
                { name: 'Rice' },
                { name: 'Bananas' },
                { name: 'Oatmeal' },
                { name: 'Yogurt' }
            ];
        }

        this.switchView('plan');
        this.planLoader.style.display = 'flex';
        this.planContainer.classList.add('hidden');

        try {
            const result = await this.analysisService.generateMealPlan(safeFoods);
            this.renderPlan(result.plan);
        } catch (error) {
            console.error(error);
            alert("Plan Generation Failed: " + error.message);
            this.switchView('insights');
        }
    }

    renderPlan(plan) {
        this.planLoader.style.display = 'none';
        this.planContainer.classList.remove('hidden');
        this.planContainer.innerHTML = '';

        // Store plan in state for grocery generation
        this.state.currentPlan = plan;

        plan.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'plan-day';
            dayDiv.innerHTML = `<h4>${day.day}</h4>`;

            day.meals.forEach(meal => {
                const mealDiv = document.createElement('div');
                mealDiv.className = 'plan-meal';
                mealDiv.innerHTML = `
                    <strong>${meal.type}:</strong> ${meal.name} <span class="tiny-text">(${meal.calories})</span>
                `;
                dayDiv.appendChild(mealDiv);
            });

            this.planContainer.appendChild(dayDiv);
        });

        // Show the "Shop This" button container if hidden
        const btnContainer = this.planContainer.nextElementSibling;
        if (btnContainer) btnContainer.classList.remove('hidden');
    }

    renderInsights() {
        this.insightsContainer.innerHTML = '';
        const report = this.storageService.getSensitivityReport();

        // 1. Render Report or Empty State
        if (!report || (report.trigger.length === 0 && report.safe.length === 0)) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-state';
            emptyMsg.innerText = 'Log more meals with different moods to see Trigger/Safe foods!';
            this.insightsContainer.appendChild(emptyMsg);
        } else {
            // Trigger Foods Card
            const triggerCard = document.createElement('div');
            triggerCard.className = 'report-card';
            triggerCard.innerHTML = `
                <h3 style="color: var(--danger-color);">Trigger Foods 🚨</h3>
                <p class="tiny-text">Foods that frequently caused a 'Bad' mood.</p>
            `;
            const triggerList = document.createElement('ul');
            triggerList.className = 'insight-list';
            report.trigger.slice(0, 3).forEach(item => {
                triggerList.innerHTML += `<li><span>${item.name}</span> <span class="insight-count">${item.count}x</span></li>`;
            });
            triggerCard.appendChild(triggerList);
            this.insightsContainer.appendChild(triggerCard);

            // Safe Foods Card
            const safeCard = document.createElement('div');
            safeCard.className = 'report-card';
            safeCard.innerHTML = `
                <h3 style="color: var(--success-color);">Safe Foods ✅</h3>
                <p class="tiny-text">Foods that frequently caused a 'Good' mood.</p>
            `;
            const safeList = document.createElement('ul');
            safeList.className = 'insight-list';
            report.safe.slice(0, 3).forEach(item => {
                safeList.innerHTML += `<li><span>${item.name}</span> <span class="insight-count">${item.count}x</span></li>`;
            });
            safeCard.appendChild(safeList);
            this.insightsContainer.appendChild(safeCard);
        }

        // 2. Always Render Buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '10px';
        btnContainer.style.marginTop = '20px';

        const planBtn = document.createElement('button');
        planBtn.className = 'primary-btn';
        planBtn.style.flex = '1';
        planBtn.innerHTML = '📅 Plan Meals';
        planBtn.onclick = () => this.handleGeneratePlan();

        const trendsBtn = document.createElement('button');
        trendsBtn.className = 'secondary-btn';
        trendsBtn.style.flex = '1';
        trendsBtn.innerHTML = '📊 Trends';
        trendsBtn.onclick = () => {
            this.switchView('trends');
            this.renderTrends();
        };

        btnContainer.appendChild(planBtn);
        btnContainer.appendChild(trendsBtn);
        this.insightsContainer.appendChild(btnContainer);
    }

    async handleGenerateGroceryList() {
        if (!this.state.currentPlan) return;

        this.switchView('grocery');
        this.groceryLoader.style.display = 'flex';
        this.groceryContainer.classList.add('hidden');

        try {
            const result = await this.analysisService.generateGroceryList(this.state.currentPlan);
            this.renderGroceryList(result.shopping_list);
        } catch (error) {
            console.error(error);
            alert("Grocery List Failed: " + error.message);
            this.switchView('plan');
        }
    }

    renderGroceryList(list) {
        this.groceryLoader.style.display = 'none';
        this.groceryContainer.classList.remove('hidden');
        this.groceryContainer.innerHTML = '';

        Object.entries(list).forEach(([category, items]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'grocery-category';
            catDiv.style.marginBottom = '15px';
            catDiv.innerHTML = `<h4 style="color: var(--accent-color); margin-bottom: 8px;">${category}</h4>`;

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';

            items.forEach(item => {
                const li = document.createElement('li');
                li.style.padding = '8px 0';
                li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.gap = '10px';

                li.innerHTML = `
                    <input type="checkbox" style="width: 20px; height: 20px; accent-color: var(--primary-color);">
                    <span>${item}</span>
                `;
                ul.appendChild(li);
            });

            catDiv.appendChild(ul);
            this.groceryContainer.appendChild(catDiv);
        });
    }

    renderReport() {
        const summary = this.storageService.getWeeklySummary();
        const logs = this.storageService.getLogs();

        // 1. Basic Stats
        this.totalCals.textContent = summary.totalCalories;
        this.avgCals.textContent = summary.avgDailyCalories;

        // 2. Mood Chart
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

        // 3. Calorie Breakdown (Aggregated by Food Name)
        this.reportAggregatedStats.innerHTML = '';
        const foodStats = {};
        logs.forEach(log => {
            const name = log.foodName || 'Unknown';
            if (!foodStats[name]) foodStats[name] = 0;
            foodStats[name] += parseInt(log.calories) || 0;
        });

        // Sort by calories desc
        const sortedFoods = Object.entries(foodStats).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5

        if (sortedFoods.length === 0) {
            this.reportAggregatedStats.innerHTML = '<p class="tiny-text">No data yet.</p>';
        } else {
            sortedFoods.forEach(([name, cals]) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.marginBottom = '5px';
                row.style.fontSize = '0.9rem';
                row.innerHTML = `<span>${name}</span> <span style="color: var(--text-muted);">${cals} kcal</span>`;
                this.reportAggregatedStats.appendChild(row);
            });
        }

        // 4. Recommendations
        const sensitivity = this.storageService.getSensitivityReport();

        const renderList = (list, container) => {
            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = '<li><span class="insight-name">None yet</span></li>';
                return;
            }
            list.slice(0, 5).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="insight-name">${item.name}</span>`;
                container.appendChild(li);
            });
        };

        renderList(sensitivity.safe, this.reportGoodFoods);
        renderList(sensitivity.triggers, this.reportBadFoods);

        // 5. Full Meal Log
        this.reportMealList.innerHTML = '';
        if (logs.length === 0) {
            this.reportMealList.innerHTML = '<p class="empty-state">No meals logged yet.</p>';
        } else {
            // Sort by date desc
            const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            sortedLogs.forEach(log => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const date = new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

                item.innerHTML = `
                    <div class="history-info">
                        <span class="history-name">${log.foodName}</span>
                        <span class="history-meta">${date} • ${log.calories} kcal</span>
                    </div>
                    <div class="history-mood">
                        ${this.getMoodEmoji(log.mood)}
                    </div>
                `;
                this.reportMealList.appendChild(item);
            });
        }
    }

    renderTrends() {
        this.trendsContainer.innerHTML = '';
        const data = this.storageService.getNutrientTrends();

        // Define moods to show (filter out empty ones)
        const moods = Object.keys(data).filter(m => data[m].count > 0);

        if (moods.length === 0) {
            this.trendsContainer.innerHTML = '<p class="empty-state">Not enough data yet.</p>';
            return;
        }

        // Helper to create a chart section
        const createChart = (title, metric, unit, color) => {
            const section = document.createElement('div');
            section.className = 'report-card'; // Reuse card style
            section.style.marginBottom = '20px';
            section.innerHTML = `<h4 style="margin-bottom: 15px; color: ${color};">${title}</h4>`;

            // Find max value for scaling
            const maxVal = Math.max(...moods.map(m => data[m][metric]));

            moods.forEach(mood => {
                const value = data[mood][metric];
                const width = maxVal > 0 ? (value / maxVal) * 100 : 0;

                const row = document.createElement('div');
                row.style.marginBottom = '10px';
                row.innerHTML = `
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px;">
                        <span>${mood}</span>
                        <span>${value}${unit}</span>
                    </div>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${width}%; background-color: ${color};"></div>
                    </div>
                `;
                section.appendChild(row);
            });
            return section;
        };

        // Create charts for Calories and Protein (as examples)
        this.trendsContainer.appendChild(createChart('Avg Calories', 'avgCalories', 'kcal', '#fdcb6e'));
        this.trendsContainer.appendChild(createChart('Avg Protein', 'avgProtein', 'g', '#0984e3'));
        this.trendsContainer.appendChild(createChart('Avg Carbs', 'avgCarbs', 'g', '#00b894'));
    }

    handleTypeInput() {
        const text = prompt("What did you eat and how do you feel? (e.g., 'I had a salad and feel great')");
        if (text && text.trim().length > 0) {
            this.processVoiceText(text);
        }
    }

    handleVoiceInput() {
        console.log("Voice button clicked");
        if (!this.voiceService.isSupported()) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        if (this.voiceService.isListening) {
            console.log("Stopping voice service...");
            this.voiceService.stop();
            this.voiceStatus.classList.add('hidden');
            this.voiceBtn.classList.remove('active');
        } else {
            console.log("Starting voice service...");
            this.voiceStatus.classList.remove('hidden');
            this.voiceBtn.classList.add('active');

            this.voiceService.onResult = (text) => {
                console.log("Voice result received:", text);
                this.voiceStatus.classList.add('hidden'); // Hide immediately on result
                this.voiceBtn.classList.remove('active');
                this.processVoiceText(text);
            };

            this.voiceService.onEnd = () => {
                console.log("Voice service ended");
                this.voiceStatus.classList.add('hidden'); // Hide on any stop
                this.voiceBtn.classList.remove('active');
            };

            this.voiceService.start().catch(e => {
                console.error("Voice start failed:", e);
                alert("Voice Start Error: " + e.message);
                this.voiceStatus.classList.add('hidden');
                this.voiceBtn.classList.remove('active');
            });
        }
    }

    async processVoiceText(text) {
        try {
            this.switchView('analysis');
            this.resetAnalysisView();

            // Use Gemini to parse the text
            const result = await this.analysisService.parseVoiceLog(text);

            // Generate AI Image URL (Free via Pollinations.ai)
            const encodedFood = encodeURIComponent(result.name + " food photorealistic delicious high quality");
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedFood}?width=800&height=800&nologo=true`;

            console.log("Generated Image URL:", imageUrl); // Debug Log

            // Preload image
            const img = new Image();
            img.onload = () => console.log("Image preloaded successfully");
            img.onerror = () => console.error("Image failed to preload");
            img.src = imageUrl;

            // Store in state
            this.state.currentAnalysis = result;
            this.state.currentImage = imageUrl; // Store URL instead of File object

            // Show results with generated image
            this.showAnalysisResults(result, imageUrl);

            if (result.mood) {
                console.log("Detected Mood:", result.mood);
            }

        } catch (error) {
            console.error(error);
            alert("Voice Analysis Failed: " + error.message);
            this.switchView('home');
        }
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
        console.log("File input changed");
        try {
            const file = event.target.files[0];
            if (!file) {
                console.log("No file selected");
                return;
            }
            console.log("File selected:", file.name);

            this.state.currentImage = file;

            // Show preview and analyze
            const reader = new FileReader();
            reader.onload = async (e) => {
                console.log("File read successfully");
                const imageUrl = e.target.result;

                if (this.previewImg) {
                    this.previewImg.src = imageUrl;
                }

                // Switch to analysis view
                console.log("Switching to analysis view...");
                this.switchView('analysis');
                this.resetAnalysisView();

                // Start Analysis
                try {
                    console.log("Starting analysis...");
                    const result = await this.analysisService.analyzeImage(file);
                    console.log("Analysis complete:", result);
                    this.state.currentAnalysis = result;
                    // Pass the local image URL so it doesn't get overwritten
                    this.showAnalysisResults(result, imageUrl);
                } catch (error) {
                    console.error("Analysis failed:", error);
                    if (error.message === "API_KEY_MISSING") {
                        alert("Please enter your Gemini API Key in Settings.");
                        this.openSettings();
                        this.switchView('home');
                    } else {
                        alert("Analysis Error: " + error.message);
                        this.switchView('home');
                    }
                }
            };
            reader.onerror = (e) => {
                console.error("FileReader error:", e);
                alert("Error reading file");
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error("handleFileUpload error:", error);
            alert("Upload Error: " + error.message);
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

    showAnalysisResults(data, imageUrl = null) {
        this.loaderContainer.style.display = 'none';
        this.resultsCard.classList.remove('hidden');

        // Populate data
        this.foodName.textContent = data.name;
        this.calories.textContent = data.calories;
        this.protein.textContent = data.protein;
        this.carbs.textContent = data.carbs;
        this.fats.textContent = data.fats;

        // Show generated image if available
        if (imageUrl && this.previewImg) {
            this.previewImg.onerror = () => {
                console.warn("AI Image failed to load, switching to fallback.");
                this.previewImg.src = "https://loremflickr.com/800/600/food,meal";
                this.previewImg.onerror = null; // Prevent infinite loop
            };
            this.previewImg.src = imageUrl;
            this.previewImg.style.display = 'block'; // Ensure it's visible
        } else if (!imageUrl && this.previewImg) {
            // Fallback if no URL generated
            this.previewImg.src = "https://loremflickr.com/800/600/food,meal";
            this.previewImg.style.display = 'block';
        }
    }

    handleMoodSelection(mood, color) {
        this.state.currentMood = { mood, color };

        if (!this.state.currentAnalysis) {
            alert("Error: No food data found. Please scan again.");
            return;
        }

        const logEntry = {
            food: this.state.currentAnalysis,
            mood: this.state.currentMood,
            image: null // Disable image saving to prevent QuotaExceededError
        };

        // Save to storage
        this.storageService.addLog(logEntry);

        // Update UI
        this.renderHistory();
        this.updateStreak();
        this.switchView('history');
    }

    saveEntry() {
        // This function is now deprecated as its logic has been moved to handleMoodSelection
        // It's kept here for reference or if other parts of the code still call it.
        // If no other parts call it, it can be removed.
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
        this.updateStreak(); // Update streak after saving an entry
    }

    init() {
        this.renderHistory();
        this.updateStreak();
    }

    updateStreak() {
        const streak = this.storageService.getStreak();
        const streakEl = document.getElementById('streak-count');
        if (streakEl) {
            streakEl.textContent = streak;
        }
    }

    renderHistory() {
        console.log("Rendering History...");
        if (!this.historyList) {
            console.warn("historyList not cached, retrying...");
            this.historyList = document.getElementById('history-list');
            if (!this.historyList) {
                console.error("Critical: history-list element not found in DOM");
                alert("Critical Error: History list element missing!");
                return;
            }
        }
        console.log("historyList found:", this.historyList);

        this.historyList.innerHTML = '';
        const logs = this.storageService.getLogs();

        if (logs.length === 0) {
            this.historyList.innerHTML = '<div class="empty-state">No logs yet. Start scanning!</div>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'history-item';

            // Format Date
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            item.innerHTML = `
                <div class="history-img">
                    ${log.food.image ? `<img src="${log.food.image}" alt="${log.food.name}">` : '<span>🍽️</span>'}
                </div>
                <div class="history-info">
                    <h4>${log.food.name}</h4>
                    <p>${log.food.calories} cal | ${timeStr}, ${dateStr}</p>
                </div>
                <div class="history-mood" style="background-color: ${log.mood ? log.mood.color : '#ccc'}">
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
const startApp = () => {
    console.log("Starting App instantiation...");
    try {
        window.app = new App();
        console.log("App initialized successfully.");
    } catch (e) {
        console.error("App initialization failed:", e);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
