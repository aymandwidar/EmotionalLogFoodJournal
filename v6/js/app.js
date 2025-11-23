/**
 * NutriMood V6 - Main Application
 * The Intelligent Food Coach with Goals, Achievements & AI Insights
 */

import { AnalysisService } from './services/analysis.js';
import { StorageService } from './services/storage.js';
import { VoiceService } from './services/voice.js';
import { ChatService } from './services/chatbot.js';
import { GoalsService } from './services/goals.js';
import { AchievementsService } from './services/achievements.js';
import { NotificationService } from './services/notifications.js';
import { CoachService } from './services/coach.js';

console.log('NutriMood V6 - App loading...');

export default class App {
    constructor() {
        this.state = {
            currentMood: null,
            currentImage: null,
            currentAnalysis: null,
            currentPlan: null
        };

        console.log('Initializing services...');

        try {
            this.storageService = new StorageService();
            this.voiceService = new VoiceService();
            this.analysisService = new AnalysisService();
            this.chatService = new ChatService(this.analysisService, this.storageService);

            // V6 Services
            this.goalsService = new GoalsService(this.storageService);
            this.achievementsService = new AchievementsService(this.storageService);
            this.notificationService = new NotificationService();
            this.coachService = new CoachService(this.analysisService, this.storageService);

            console.log('Services initialized successfully');
        } catch (e) {
            console.error('Service initialization failed:', e);
            alert('Failed to initialize app: ' + e.message);
        }

        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('Initializing app...');

            // Wait for storage to initialize (IndexedDB)
            await this.storageService.init();

            this.cacheDOM();
            this.bindEvents();
            this.renderHistory();
            this.updateStreak();
            this.loadSettings();
            this.loadDailyTip();

            console.log('App initialized successfully');
        } catch (e) {
            console.error('App initialization error:', e);
            alert('App initialization failed: ' + e.message);
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
            trends: document.getElementById('trends-view'),
            goals: document.getElementById('goals-view'),
            achievements: document.getElementById('achievements-view'),
            reminders: document.getElementById('reminders-view')
        };

        // Navigation
        this.appLogo = document.getElementById('app-logo');
        this.historyBtn = document.getElementById('history-btn');
        this.reportBtn = document.getElementById('report-btn');
        this.insightsBtn = document.getElementById('insights-btn');
        this.goalsBtn = document.getElementById('goals-btn');
        this.achievementsBtn = document.getElementById('achievements-btn');
        this.settingsBtn = document.getElementById('settings-btn');

        // Home buttons
        this.scanBtn = document.getElementById('scan-btn');
        this.fileInput = document.getElementById('file-input');
        this.voiceBtn = document.getElementById('voice-btn');
        this.typeBtn = document.getElementById('type-btn');
        this.homeTrendsBtn = document.getElementById('home-trends-btn');
        this.homePlanBtn = document.getElementById('home-plan-btn');
        this.fridgeInput = document.getElementById('fridge-input');

        // Settings modal
        this.settingsModal = document.getElementById('settings-modal');
        this.providerSelect = document.getElementById('provider-select');
        this.claudeApiKeyInput = document.getElementById('claude-api-key-input');
        this.geminiApiKeyInput = document.getElementById('gemini-api-key-input');
        this.geminiModelSelect = document.getElementById('gemini-model-select');
        this.groqApiKeyInput = document.getElementById('groq-api-key-input');
        this.groqModelSelect = document.getElementById('groq-model-select');
        this.testConnectionBtn = document.getElementById('test-connection-btn');
        this.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.closeSettingsBtn = document.getElementById('close-settings-btn');

        // Analysis view
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

        // Mood view
        this.moodBtns = document.querySelectorAll('.mood-btn');

        // History view
        this.historyList = document.getElementById('history-list');
        this.backHomeBtn = document.getElementById('back-home-btn');

        // Report view
        this.totalCals = document.getElementById('total-cals');
        this.avgCals = document.getElementById('avg-cals');
        this.moodChart = document.getElementById('mood-chart');
        this.reportMealList = document.getElementById('report-meal-list');
        this.reportAggregatedStats = document.getElementById('report-aggregated-stats');
        this.reportGoodFoods = document.getElementById('report-good-foods');
        this.reportBadFoods = document.getElementById('report-bad-foods');
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.generateDataBtn = document.getElementById('generate-data-btn');
        this.backHomeReportBtn = document.getElementById('back-home-report-btn');

        // Insights view
        this.triggerList = document.getElementById('trigger-list');
        this.safeList = document.getElementById('safe-list');
        this.generatePlanBtn = document.getElementById('generate-plan-btn');
        this.backHomeInsightsBtn = document.getElementById('back-home-insights-btn');

        // Plan view
        this.planLoader = document.getElementById('plan-loader');
        this.planContainer = document.getElementById('plan-container');
        this.backInsightsPlanBtn = document.getElementById('back-insights-plan-btn');
        this.generateListBtn = document.getElementById('generate-list-btn');

        // Grocery view
        this.groceryLoader = document.getElementById('grocery-loader');
        this.groceryContainer = document.getElementById('grocery-container');
        this.backPlanGroceryBtn = document.getElementById('back-plan-grocery-btn');

        // Trends view
        this.trendsContainer = document.getElementById('trends-container');
        this.backInsightsTrendsBtn = document.getElementById('back-insights-trends-btn');

        // Recipes view
        this.recipesList = document.getElementById('recipes-list');
        this.recipeLoader = document.getElementById('recipe-loader');
        this.backHomeRecipesBtn = document.getElementById('back-home-recipes-btn');

        // Goals view
        this.goalsContainer = document.getElementById('goals-container');
        this.addGoalBtn = document.getElementById('add-goal-btn');
        this.activeGoalsTab = document.getElementById('active-goals-tab');
        this.completedGoalsTab = document.getElementById('completed-goals-tab');
        this.backHomeGoalsBtn = document.getElementById('back-home-goals-btn');

        // Achievements view
        this.achievementsGrid = document.getElementById('achievements-grid');
        this.unlockedCount = document.getElementById('unlocked-count');
        this.totalCount = document.getElementById('total-count');
        this.backHomeAchievementsBtn = document.getElementById('back-home-achievements-btn');

        // Reminders view
        this.remindersContainer = document.getElementById('reminders-container');
        this.requestPermissionBtn = document.getElementById('request-permission-btn');
        this.permissionStatus = document.getElementById('permission-status');
        this.addReminderBtn = document.getElementById('add-reminder-btn');
        this.backHomeRemindersBtn = document.getElementById('back-home-reminders-btn');

        // Goal Modal
        this.goalModal = document.getElementById('goal-modal');
        this.goalTypeSelect = document.getElementById('goal-type-select');
        this.goalTargetInput = document.getElementById('goal-target-input');
        this.goalDeadlineInput = document.getElementById('goal-deadline-input');
        this.createGoalBtn = document.getElementById('create-goal-btn');
        this.cancelGoalBtn = document.getElementById('cancel-goal-btn');

        // Chat
        this.chatFab = document.getElementById('chat-fab');
        this.chatModal = document.getElementById('chat-modal');
        this.closeChatBtn = document.getElementById('close-chat-btn');
        this.chatInput = document.getElementById('chat-input');
        this.sendChatBtn = document.getElementById('send-chat-btn');
        this.chatMessages = document.getElementById('chat-messages');

        // Voice status
        this.voiceStatus = document.getElementById('voice-status');
    }

    bindEvents() {
        // Navigation
        if (this.appLogo) this.appLogo.addEventListener('click', () => this.switchView('home'));
        if (this.historyBtn) this.historyBtn.addEventListener('click', () => this.switchView('history'));
        if (this.reportBtn) this.reportBtn.addEventListener('click', () => {
            this.renderReport();
            this.switchView('report');
        });
        if (this.insightsBtn) this.insightsBtn.addEventListener('click', () => {
            this.renderInsights();
            this.switchView('insights');
        });

        // Settings
        if (this.settingsBtn) this.settingsBtn.addEventListener('click', () => this.openSettings());
        if (this.closeSettingsBtn) this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        if (this.testConnectionBtn) this.testConnectionBtn.addEventListener('click', () => this.testConnection());
        if (this.saveSettingsBtn) this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());

        // File input
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Voice and type
        if (this.voiceBtn) this.voiceBtn.addEventListener('click', () => this.handleVoiceInput());
        if (this.typeBtn) this.typeBtn.addEventListener('click', () => this.handleTypeInput());

        // Home shortcuts
        if (this.homeTrendsBtn) this.homeTrendsBtn.addEventListener('click', () => {
            this.renderTrends();
            this.switchView('trends');
        });
        if (this.homePlanBtn) this.homePlanBtn.addEventListener('click', () => this.handleGeneratePlan());

        // Fridge chef
        if (this.fridgeInput) this.fridgeInput.addEventListener('change', (e) => this.handleFridgeUpload(e));

        // Analysis flow
        if (this.confirmFoodBtn) this.confirmFoodBtn.addEventListener('click', () => this.switchView('mood'));
        if (this.cancelFoodBtn) this.cancelFoodBtn.addEventListener('click', () => this.switchView('home'));

        // Mood selection
        this.moodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = btn.dataset.mood;
                const color = btn.dataset.color;
                this.handleMoodSelection(mood, color);
            });
        });

        // Back buttons
        if (this.backHomeBtn) this.backHomeBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backHomeReportBtn) this.backHomeReportBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backHomeInsightsBtn) this.backHomeInsightsBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backHomeRecipesBtn) this.backHomeRecipesBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backHomeGoalsBtn) this.backHomeGoalsBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backHomeAchievementsBtn) this.backHomeAchievementsBtn.addEventListener('click', () => this.switchView('home'));
        if (this.backInsightsPlanBtn) this.backInsightsPlanBtn.addEventListener('click', () => this.switchView('insights'));
        if (this.backPlanGroceryBtn) this.backPlanGroceryBtn.addEventListener('click', () => this.switchView('plan'));
        if (this.backInsightsTrendsBtn) this.backInsightsTrendsBtn.addEventListener('click', () => this.switchView('insights'));

        // Goals & Achievements
        if (this.goalsBtn) this.goalsBtn.addEventListener('click', () => {
            this.renderGoals();
            this.switchView('goals');
        });
        if (this.achievementsBtn) this.achievementsBtn.addEventListener('click', () => {
            this.renderAchievements();
            this.switchView('achievements');
        });
        if (this.activeGoalsTab) this.activeGoalsTab.addEventListener('click', () => this.switchGoalsTab('active'));
        if (this.completedGoalsTab) this.completedGoalsTab.addEventListener('click', () => this.switchGoalsTab('completed'));

        // Achievement filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterAchievements(btn.dataset.filter));
        });

        // Reminders
        if (this.requestPermissionBtn) this.requestPermissionBtn.addEventListener('click', () => this.requestNotificationPermission());
        if (this.backHomeRemindersBtn) this.backHomeRemindersBtn.addEventListener('click', () => this.switchView('home'));

        // Goal Modal
        if (this.addGoalBtn) this.addGoalBtn.addEventListener('click', () => this.showGoalModal());
        if (this.createGoalBtn) this.createGoalBtn.addEventListener('click', () => this.createGoal());
        if (this.cancelGoalBtn) this.cancelGoalBtn.addEventListener('click', () => this.hideGoalModal());

        // Plan and grocery
        if (this.generatePlanBtn) this.generatePlanBtn.addEventListener('click', () => this.handleGeneratePlan());
        if (this.generateListBtn) this.generateListBtn.addEventListener('click', () => this.handleGenerateGroceryList());

        // Report actions
        if (this.exportPdfBtn) this.exportPdfBtn.addEventListener('click', () => window.print());
        if (this.generateDataBtn) this.generateDataBtn.addEventListener('click', () => this.generateTestData());

        // Chat
        if (this.chatFab) this.chatFab.addEventListener('click', () => this.chatModal.classList.remove('hidden'));
        if (this.closeChatBtn) this.closeChatBtn.addEventListener('click', () => this.chatModal.classList.add('hidden'));
        if (this.sendChatBtn) this.sendChatBtn.addEventListener('click', () => this.handleChatSend());
        if (this.chatInput) this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleChatSend();
        });

        // Close chat on outside click
        if (this.chatModal) {
            this.chatModal.addEventListener('click', (e) => {
                if (e.target === this.chatModal) {
                    this.chatModal.classList.add('hidden');
                }
            });
        }
    }

    // Settings Management
    loadSettings() {
        const provider = localStorage.getItem('ai_provider') || 'groq';
        const claudeKey = localStorage.getItem('claude_api_key') || '';
        const geminiKey = localStorage.getItem('gemini_api_key') || '';
        const geminiModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
        const groqKey = localStorage.getItem('groq_api_key') || '';
        const groqModel = localStorage.getItem('groq_model') || 'llama-3.2-3b-preview';

        if (this.providerSelect) this.providerSelect.value = provider;
        if (this.claudeApiKeyInput) this.claudeApiKeyInput.value = claudeKey;
        if (this.geminiApiKeyInput) this.geminiApiKeyInput.value = geminiKey;
        if (this.geminiModelSelect) this.geminiModelSelect.value = geminiModel;
        if (this.groqApiKeyInput) this.groqApiKeyInput.value = groqKey;
        if (this.groqModelSelect) this.groqModelSelect.value = groqModel;
    }

    openSettings() {
        this.loadSettings();
        if (this.settingsModal) this.settingsModal.classList.remove('hidden');
    }

    closeSettings() {
        if (this.settingsModal) this.settingsModal.classList.add('hidden');
    }

    async testConnection() {
        const provider = this.providerSelect.value;
        const claudeKey = this.claudeApiKeyInput.value.trim();
        const geminiKey = this.geminiApiKeyInput.value.trim();

        if (provider === 'claude' && !claudeKey) {
            alert('Please enter a Claude API key');
            return;
        }
        if (provider === 'gemini' && !geminiKey) {
            alert('Please enter a Gemini API key');
            return;
        }

        this.testConnectionBtn.textContent = 'Testing...';
        this.testConnectionBtn.disabled = true;

        try {
            // Temporarily set keys
            this.analysisService.setClaudeApiKey(claudeKey);
            this.analysisService.setGeminiApiKey(geminiKey);
            this.analysisService.setProvider(provider);

            // Test with a simple text analysis
            const result = await this.analysisService.parseVoiceLog('I ate an apple');

            alert(`✅ Connection successful!\n\nProvider: ${provider}\nResponse: ${result.name}`);
        } catch (error) {
            alert(`❌ Connection failed:\n\n${error.message}`);
        } finally {
            this.testConnectionBtn.textContent = 'Test Connection';
            this.testConnectionBtn.disabled = false;
        }
    }

    saveSettings() {
        const provider = this.providerSelect.value;
        const claudeKey = this.claudeApiKeyInput.value.trim();
        const geminiKey = this.geminiApiKeyInput.value.trim();
        const geminiModel = this.geminiModelSelect.value;
        const groqKey = this.groqApiKeyInput.value.trim();
        const groqModel = this.groqModelSelect.value;

        this.analysisService.setProvider(provider);
        this.analysisService.setClaudeApiKey(claudeKey);
        this.analysisService.setGeminiApiKey(geminiKey);
        this.analysisService.setGeminiModel(geminiModel);
        this.analysisService.setGroqApiKey(groqKey);
        this.analysisService.setGroqModel(groqModel);

        this.closeSettings();
        alert('✅ Settings saved!');
    }

    // View Management
    switchView(viewName) {
        Object.values(this.views).forEach(view => {
            if (view) {
                view.classList.add('hidden');
                view.classList.remove('active');
            }
        });

        const targetView = this.views[viewName];
        if (targetView) {
            targetView.classList.remove('hidden');
            requestAnimationFrame(() => {
                targetView.classList.add('active');
            });
        }
    }

    // File Upload
    async handleFileUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            this.state.currentImage = file;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageUrl = e.target.result;
                if (this.previewImg) this.previewImg.src = imageUrl;

                this.switchView('analysis');
                this.resetAnalysisView();

                try {
                    const result = await this.analysisService.analyzeImage(file);
                    this.state.currentAnalysis = result;
                    this.showAnalysisResults(result, imageUrl);
                } catch (error) {
                    console.error('Analysis failed:', error);
                    if (error.message === 'API_KEY_MISSING') {
                        alert('⚠️ Please configure your API keys in Settings');
                        this.openSettings();
                        this.switchView('home');
                    } else {
                        alert(`❌ Analysis Error: ${error.message}`);
                        this.switchView('home');
                    }
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File upload error:', error);
            alert(`Upload Error: ${error.message}`);
        }

        this.fileInput.value = '';
    }

    resetAnalysisView() {
        if (this.loaderContainer) this.loaderContainer.style.display = 'flex';
        if (this.resultsCard) this.resultsCard.classList.add('hidden');
    }

    showAnalysisResults(data, imageUrl = null) {
        if (this.loaderContainer) this.loaderContainer.style.display = 'none';
        if (this.resultsCard) this.resultsCard.classList.remove('hidden');

        if (this.foodName) this.foodName.textContent = data.name;
        if (this.calories) this.calories.textContent = data.calories;
        if (this.protein) this.protein.textContent = data.protein;
        if (this.carbs) this.carbs.textContent = data.carbs;
        if (this.fats) this.fats.textContent = data.fats;

        if (imageUrl && this.previewImg) {
            this.previewImg.src = imageUrl;
            this.previewImg.style.display = 'block';
        }
    }

    // Voice Input
    handleVoiceInput() {
        if (!this.voiceService.isSupported()) {
            alert('❌ Voice input is not supported in this browser');
            return;
        }

        if (this.voiceService.isListening) {
            this.voiceService.stop();
            if (this.voiceStatus) this.voiceStatus.classList.add('hidden');
            if (this.voiceBtn) this.voiceBtn.classList.remove('active');
        } else {
            if (this.voiceStatus) this.voiceStatus.classList.remove('hidden');
            if (this.voiceBtn) this.voiceBtn.classList.add('active');

            this.voiceService.onResult = (text) => {
                if (this.voiceStatus) this.voiceStatus.classList.add('hidden');
                if (this.voiceBtn) this.voiceBtn.classList.remove('active');
                this.processVoiceText(text);
            };

            this.voiceService.onEnd = () => {
                if (this.voiceStatus) this.voiceStatus.classList.add('hidden');
                if (this.voiceBtn) this.voiceBtn.classList.remove('active');
            };

            this.voiceService.start().catch(e => {
                alert(`Voice Error: ${e.message}`);
                if (this.voiceStatus) this.voiceStatus.classList.add('hidden');
                if (this.voiceBtn) this.voiceBtn.classList.remove('active');
            });
        }
    }

    async processVoiceText(text) {
        try {
            this.switchView('analysis');
            this.resetAnalysisView();

            const result = await this.analysisService.parseVoiceLog(text);

            // Show results first (without image)
            this.showAnalysisResults(result, null);

            // Generate AI image with loading indicator
            const encodedFood = encodeURIComponent(result.name + ' food photorealistic');
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedFood}?width=800&height=800&nologo=true`;

            this.state.currentAnalysis = result;
            this.state.currentImage = imageUrl;

            // Show "Generating image..." text
            if (this.previewImg) {
                this.previewImg.style.display = 'block';
                this.previewImg.alt = 'Generating AI image...';
                this.previewImg.style.opacity = '0.5';

                // Create loading text overlay
                const loadingText = document.createElement('div');
                loadingText.id = 'image-loading-text';
                loadingText.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 14px; text-align: center; z-index: 10; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 8px;';
                loadingText.innerHTML = '🎨 Generating AI image...<br><span style="font-size: 12px; opacity: 0.8;">This may take 10-15 seconds</span>';

                const container = this.previewImg.parentElement;
                if (container && !document.getElementById('image-loading-text')) {
                    container.style.position = 'relative';
                    container.appendChild(loadingText);
                }

                // Load the image
                const img = new Image();
                img.onload = () => {
                    this.previewImg.src = imageUrl;
                    this.previewImg.style.opacity = '1';
                    this.previewImg.alt = result.name;
                    const loadingEl = document.getElementById('image-loading-text');
                    if (loadingEl) loadingEl.remove();
                };
                img.onerror = () => {
                    const loadingEl = document.getElementById('image-loading-text');
                    if (loadingEl) {
                        loadingEl.innerHTML = '⚠️ Image failed to load';
                        setTimeout(() => loadingEl.remove(), 2000);
                    }
                };
                img.src = imageUrl;
            }
        } catch (error) {
            console.error('Voice analysis failed:', error);
            alert(`❌ Voice Analysis Failed: ${error.message}`);
            this.switchView('home');
        }
    }

    // Type Input
    handleTypeInput() {
        const text = prompt('What did you eat and how do you feel?\\n\\nExample: "I had a salad and feel great"');
        if (text && text.trim().length > 0) {
            this.processVoiceText(text);
        }
    }

    // Mood Selection
    async handleMoodSelection(mood, color) {
        this.state.currentMood = { mood, color };

        if (!this.state.currentAnalysis) {
            alert('❌ Error: No food data found');
            return;
        }

        const logEntry = {
            food: this.state.currentAnalysis,
            mood: this.state.currentMood,
            image: null
        };

        await this.storageService.addLog(logEntry);

        // V6: Check for achievements and goal progress
        await this.checkAndUnlockAchievements();

        this.renderHistory();
        this.updateStreak();
        this.switchView('history');
    }

    // History
    renderHistory() {
        if (!this.historyList) return;

        this.historyList.innerHTML = '';
        const logs = this.storageService.getLogs();

        if (logs.length === 0) {
            this.historyList.innerHTML = '<div class=\"empty-state\">No logs yet. Start scanning!</div>';
            return;
        }

        logs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            item.innerHTML = `
                <div class=\"history-info\">
                    <h4>${log.food?.name || 'Unknown'}</h4>
                    <p>${log.food?.calories || 0} cal | ${timeStr}, ${dateStr}</p>
                </div>
                <div class=\"history-mood\" style=\"background-color: ${log.mood?.color || '#ccc'}\">
                    ${this.getMoodEmoji(log.mood?.mood)}
                </div>
            `;

            this.historyList.appendChild(item);
        });
    }

    // Report
    renderReport() {
        const summary = this.storageService.getWeeklySummary();
        const logs = this.storageService.getLogs();

        if (this.totalCals) this.totalCals.textContent = summary.totalCalories.toLocaleString();
        if (this.avgCals) this.avgCals.textContent = summary.avgDailyCalories.toLocaleString();

        // Mood chart
        if (this.moodChart) {
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
                    <span style=\"width: 80px;\">${mood}</span>
                    <div class=\"chart-bar-bg\">
                        <div class=\"chart-bar-fill\" style=\"width: ${percentage}%; background-color: ${colors[mood]}\"></div>
                    </div>
                    <span class=\"chart-count\">${count}</span>
                `;
                this.moodChart.appendChild(row);
            });
        }

        // Food recommendations
        const sensitivity = this.storageService.getSensitivityReport();

        const renderList = (list, container) => {
            if (!container) return;
            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = '<li><span>None yet</span></li>';
                return;
            }
            list.slice(0, 5).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.name}</span>`;
                container.appendChild(li);
            });
        };

        renderList(sensitivity.safe, this.reportGoodFoods);
        renderList(sensitivity.triggers, this.reportBadFoods);
    }

    // Insights
    renderInsights() {
        const report = this.storageService.getSensitivityReport();

        const renderList = (list, container) => {
            if (!container) return;
            container.innerHTML = '';
            if (list.length === 0) {
                container.innerHTML = '<li><span>None yet</span></li>';
                return;
            }
            list.slice(0, 5).forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${item.name}</span>
                    <span class=\"insight-count\">${item.count}x</span>
                `;
                container.appendChild(li);
            });
        };

        renderList(report.triggers, this.triggerList);
        renderList(report.safe, this.safeList);
    }

    // Meal Plan
    async handleGeneratePlan() {
        const report = this.storageService.getSensitivityReport();
        let safeFoods = report.safe;

        if (safeFoods.length === 0) {
            safeFoods = [
                { name: 'Grilled Chicken' },
                { name: 'Rice' },
                { name: 'Bananas' },
                { name: 'Oatmeal' },
                { name: 'Yogurt' }
            ];
        }

        this.switchView('plan');
        if (this.planLoader) this.planLoader.style.display = 'flex';
        if (this.planContainer) this.planContainer.classList.add('hidden');

        try {
            const result = await this.analysisService.generateMealPlan(safeFoods, 7);
            this.renderPlan(result.plan);
        } catch (error) {
            console.error('Plan generation failed:', error);
            alert(`❌ Plan Generation Failed: ${error.message}`);
            this.switchView('insights');
        }
    }

    renderPlan(plan) {
        if (this.planLoader) this.planLoader.style.display = 'none';
        if (this.planContainer) {
            this.planContainer.classList.remove('hidden');
            this.planContainer.innerHTML = '';
        }

        this.state.currentPlan = plan;

        plan.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'plan-day';
            dayDiv.innerHTML = `<h4>${day.day}</h4>`;

            day.meals.forEach(meal => {
                const mealDiv = document.createElement('div');
                mealDiv.className = 'plan-meal';
                mealDiv.innerHTML = `
                    <strong>${meal.type}:</strong> ${meal.name} <span class=\"tiny-text\">(${meal.calories})</span>
                `;
                dayDiv.appendChild(mealDiv);
            });

            if (this.planContainer) this.planContainer.appendChild(dayDiv);
        });
    }

    // Grocery List
    async handleGenerateGroceryList() {
        if (!this.state.currentPlan) return;

        this.switchView('grocery');
        if (this.groceryLoader) this.groceryLoader.style.display = 'flex';
        if (this.groceryContainer) this.groceryContainer.classList.add('hidden');

        try {
            const result = await this.analysisService.generateGroceryList(this.state.currentPlan);
            this.renderGroceryList(result.shopping_list);
        } catch (error) {
            console.error('Grocery list failed:', error);
            alert(`❌ Grocery List Failed: ${error.message}`);
            this.switchView('plan');
        }
    }

    renderGroceryList(list) {
        if (this.groceryLoader) this.groceryLoader.style.display = 'none';
        if (this.groceryContainer) {
            this.groceryContainer.classList.remove('hidden');
            this.groceryContainer.innerHTML = '';
        }

        Object.entries(list).forEach(([category, items]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'grocery-category';
            catDiv.style.marginBottom = '15px';
            catDiv.innerHTML = `<h4 style=\"color: var(--accent-color); margin-bottom: 8px;\">${category}</h4>`;

            const ul = document.createElement('ul');
            ul.style.listStyle = 'none';

            items.forEach(item => {
                const li = document.createElement('li');
                li.style.padding = '8px 0';
                li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                li.innerHTML = `
                    <input type=\"checkbox\" style=\"margin-right: 10px;\">
                    <span>${item}</span>
                `;
                ul.appendChild(li);
            });

            catDiv.appendChild(ul);
            if (this.groceryContainer) this.groceryContainer.appendChild(catDiv);
        });
    }

    // Trends
    renderTrends() {
        if (!this.trendsContainer) return;

        this.trendsContainer.innerHTML = '';
        const data = this.storageService.getNutrientTrends();

        const moods = Object.keys(data).filter(m => data[m].count > 0);

        if (moods.length === 0) {
            this.trendsContainer.innerHTML = '<p class=\"empty-state\">Not enough data yet.</p>';
            return;
        }

        const createChart = (title, metric, unit, color) => {
            const section = document.createElement('div');
            section.className = 'report-card';
            section.style.marginBottom = '20px';
            section.innerHTML = `<h4 style=\"margin-bottom: 15px; color: ${color};\">${title}</h4>`;

            const maxVal = Math.max(...moods.map(m => data[m][metric]));

            moods.forEach(mood => {
                const value = data[mood][metric];
                const width = maxVal > 0 ? (value / maxVal) * 100 : 0;

                const row = document.createElement('div');
                row.style.marginBottom = '10px';
                row.innerHTML = `
                    <div style=\"display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px;\">
                        <span>${mood}</span>
                        <span>${value}${unit}</span>
                    </div>
                    <div class=\"chart-bar-bg\">
                        <div class=\"chart-bar-fill\" style=\"width: ${width}%; background-color: ${color};\"></div>
                    </div>
                `;
                section.appendChild(row);
            });
            return section;
        };

        this.trendsContainer.appendChild(createChart('Avg Calories', 'avgCalories', 'kcal', '#fdcb6e'));
        this.trendsContainer.appendChild(createChart('Avg Protein', 'avgProtein', 'g', '#0984e3'));
        this.trendsContainer.appendChild(createChart('Avg Carbs', 'avgCarbs', 'g', '#00b894'));
    }

    // Fridge Chef
    async handleFridgeUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;

            this.switchView('recipes');
            if (this.recipeLoader) this.recipeLoader.style.display = 'flex';
            if (this.recipesList) this.recipesList.classList.add('hidden');

            const result = await this.analysisService.analyzeFridge(file);
            this.renderRecipes(result.recipes);
        } catch (error) {
            console.error('Fridge analysis failed:', error);
            if (error.message === 'API_KEY_MISSING') {
                alert('⚠️ Please configure your API keys in Settings');
                this.openSettings();
                this.switchView('home');
            } else {
                alert(`❌ Chef Error: ${error.message}`);
                this.switchView('home');
            }
        }

        this.fridgeInput.value = '';
    }

    renderRecipes(recipes) {
        if (this.recipeLoader) this.recipeLoader.style.display = 'none';
        if (this.recipesList) {
            this.recipesList.classList.remove('hidden');
            this.recipesList.innerHTML = '';
        }

        if (!recipes || recipes.length === 0) {
            if (this.recipesList) this.recipesList.innerHTML = '<p>No recipes found. Try a clearer photo!</p>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <h4>${recipe.name}</h4>
                <p>${recipe.description}</p>
                <div class=\"recipe-meta\">🔥 ${recipe.calories}</div>
            `;
            if (this.recipesList) this.recipesList.appendChild(card);
        });
    }

    // Chat
    async handleChatSend() {
        const text = this.chatInput.value.trim();
        if (!text) return;

        this.addChatMessage(text, 'user');
        this.chatInput.value = '';

        try {
            const reply = await this.chatService.sendMessage(text);
            this.addChatMessage(reply, 'bot');
        } catch (error) {
            console.error('Chat error:', error);
            this.addChatMessage('Sorry, I\'m having trouble thinking right now. Check your API key!', 'bot');
        }
    }

    addChatMessage(text, sender) {
        if (!this.chatMessages) return;

        const div = document.createElement('div');
        div.className = `message ${sender}-message`;
        div.textContent = text;
        this.chatMessages.appendChild(div);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Utilities
    updateStreak() {
        const streak = this.storageService.getStreak();
        const streakEl = document.getElementById('streak-count');
        if (streakEl) streakEl.textContent = streak;
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

    async generateTestData() {
        const dummyDB = [
            { name: 'Test Salad', calories: 300, protein: '10g', carbs: '20g', fats: '10g' },
            { name: 'Test Burger', calories: 800, protein: '40g', carbs: '50g', fats: '40g' },
            { name: 'Test Fruit', calories: 100, protein: '1g', carbs: '25g', fats: '0g' },
            { name: 'Spicy Tacos', calories: 600, protein: '25g', carbs: '40g', fats: '20g' },
            { name: 'Ice Cream', calories: 400, protein: '5g', carbs: '50g', fats: '20g' }
        ];

        await this.storageService.generateRandomData(dummyDB);
        this.renderReport();
        this.renderHistory();
        this.updateStreak();
        alert('✅ Generated random test data!');
    }

    // V6: Goals & Achievements Methods

    /**
     * Render Goals view
     */
    async renderGoals(tab = 'active') {
        if (!this.goalsContainer) return;

        this.currentGoalsTab = tab;
        const goals = this.goalsService.getGoals(tab);

        this.goalsContainer.innerHTML = '';

        if (goals.length === 0) {
            this.goalsContainer.innerHTML = `<div class="empty-state">No ${tab} goals yet. ${tab === 'active' ? 'Set your first goal!' : ''}</div>`;
            return;
        }

        goals.forEach(goal => {
            const progress = this.goalsService.getProgress(goal.id);
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';

            const typeEmoji = {
                'calories': '🔥',
                'protein': '💪',
                'mood': '😊',
                'streak': '📅'
            };

            goalCard.innerHTML = `
                <div class="goal-header">
                    <span class="goal-type">${typeEmoji[goal.type] || '🎯'} ${goal.type}</span>
                </div>
                <div class="goal-title">${goal.current} / ${goal.target} ${goal.type === 'calories' ? 'kcal' : goal.type === 'protein' ? 'g' : goal.type === 'streak' ? 'days' : 'days'}</div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="goal-stats">
                    <span>${Math.round(progress)}% complete</span>
                    <span class="goal-current">${goal.status}</span>
                </div>
            `;

            this.goalsContainer.appendChild(goalCard);
        });
    }

    /**
     * Switch goals tab
     */
    switchGoalsTab(tab) {
        // Update tab buttons
        if (this.activeGoalsTab) {
            this.activeGoalsTab.classList.toggle('active', tab === 'active');
        }
        if (this.completedGoalsTab) {
            this.completedGoalsTab.classList.toggle('active', tab === 'completed');
        }

        // Render goals for selected tab
        this.renderGoals(tab);
    }

    /**
     * Render Achievements view
     */
    async renderAchievements(filter = 'all') {
        if (!this.achievementsGrid) return;

        const achievements = this.achievementsService.getAllAchievements();
        const unlocked = achievements.filter(a => a.unlocked);

        // Update counts
        if (this.unlockedCount) this.unlockedCount.textContent = unlocked.length;
        if (this.totalCount) this.totalCount.textContent = achievements.length;

        // Filter achievements
        const filtered = filter === 'all'
            ? achievements
            : achievements.filter(a => {
                const category = a.requirement.type.includes('streak') ? 'streak' :
                    a.requirement.type.includes('logs') ? 'volume' :
                        a.requirement.type.includes('mood') ? 'mood' :
                            a.requirement.type.includes('food') ? 'discovery' :
                                a.requirement.type.includes('goal') ? 'goal' : 'other';
                return category === filter;
            });

        this.achievementsGrid.innerHTML = '';

        filtered.forEach(achievement => {
            const badge = document.createElement('div');
            badge.className = `achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`;

            badge.innerHTML = `
                <span class="achievement-rarity rarity-${achievement.rarity}">${achievement.rarity}</span>
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            `;

            this.achievementsGrid.appendChild(badge);
        });
    }

    /**
     * Filter achievements by category
     */
    filterAchievements(category) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === category);
        });

        // Render filtered achievements
        this.renderAchievements(category);
    }

    /**
     * Check and unlock achievements after logging
     */
    async checkAndUnlockAchievements() {
        const stats = this.storageService.getUserStats();
        const newlyUnlocked = await this.achievementsService.checkAchievements(stats);

        if (newlyUnlocked.length > 0) {
            // Show achievement unlock notification
            newlyUnlocked.forEach(achievement => {
                setTimeout(() => {
                    alert(`🏆 Achievement Unlocked!\n\n${achievement.icon} ${achievement.name}\n${achievement.description}`);
                }, 500);
            });
        }

        // Update goals progress
        await this.goalsService.checkGoals(stats);
    }

    /**
     * Show goal creation modal
     */
    showGoalModal() {
        if (this.goalModal) {
            this.goalModal.classList.remove('hidden');
            // Reset form
            if (this.goalTypeSelect) this.goalTypeSelect.value = 'calories';
            if (this.goalTargetInput) this.goalTargetInput.value = '';
            if (this.goalDeadlineInput) this.goalDeadlineInput.value = '';
        }
    }

    /**
     * Hide goal creation modal
     */
    hideGoalModal() {
        if (this.goalModal) {
            this.goalModal.classList.add('hidden');
        }
    }

    /**
     * Create a new goal
     */
    async createGoal() {
        const type = this.goalTypeSelect?.value;
        const target = parseInt(this.goalTargetInput?.value);
        const deadline = this.goalDeadlineInput?.value || null;

        if (!type || !target || target <= 0) {
            alert('Please enter a valid goal target');
            return;
        }

        try {
            await this.goalsService.createGoal(type, target, deadline);
            this.hideGoalModal();
            this.renderGoals('active');
            alert(`✅ Goal created! Track your progress in the Goals view.`);
        } catch (error) {
            console.error('Failed to create goal:', error);
            alert('❌ Failed to create goal. Please try again.');
        }
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        const permission = await this.notificationService.requestPermission();

        if (this.permissionStatus) {
            if (permission === 'granted') {
                this.permissionStatus.textContent = '✅ Notifications enabled!';
                this.permissionStatus.style.color = 'var(--success)';
                if (this.requestPermissionBtn) {
                    this.requestPermissionBtn.textContent = 'Enabled ✓';
                    this.requestPermissionBtn.disabled = true;
                }

                // Send test notification
                this.notificationService.sendNotification(
                    'NutriMood Notifications Enabled!',
                    'You\'ll now receive meal reminders and achievement alerts',
                    {}
                );
            } else if (permission === 'denied') {
                this.permissionStatus.textContent = '❌ Notifications blocked. Enable in browser settings.';
                this.permissionStatus.style.color = '#ff4b4b';
            } else {
                this.permissionStatus.textContent = '⏳ Permission pending...';
            }
        }
    }

    getMoodEmoji(mood) {
        const emojis = {
            'Very Bad': '😫',
            'Bad': '😕',
            'Neutral': '😐',
            'Good': '🙂',
            'Feel OK': '🥰'
        };
        return emojis[mood] || '😐';
    }

    /**
     * Load and display daily tip from AI Coach
     */
    loadDailyTip() {
        const dailyTipEl = document.getElementById('daily-tip');
        if (!dailyTipEl) return;

        // Get daily tip from coach service
        const tip = this.coachService.getDailyTip();
        dailyTipEl.textContent = tip;
    }
}

// Initialize App
const startApp = () => {
    console.log('Starting NutriMood V5S...');
    try {
        window.app = new App();
        console.log('✅ NutriMood V5S initialized successfully');
    } catch (e) {
        console.error('❌ App initialization failed:', e);
        alert('App failed to load: ' + e.message);
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
