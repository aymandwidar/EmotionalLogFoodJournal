/**
 * Analysis Service - V6
 * Unified AI service supporting Claude, Gemini, and Ollama (local AI)
 * Provides food analysis, voice parsing, meal planning, and recipe generation
 */

import { OllamaService } from './ollama.js';

export class AnalysisService {
    constructor() {
        // Load saved preferences
        this.claudeApiKey = localStorage.getItem('claude_api_key') || '';
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.groqApiKey = localStorage.getItem('groq_api_key') || '';
        this.provider = localStorage.getItem('ai_provider') || 'groq'; // Default to Groq (best free tier)
        this.geminiModel = localStorage.getItem('gemini_model') || 'gemini-2.0-flash';
        this.groqModel = localStorage.getItem('groq_model') || 'llama-3.2-3b-preview';

        // API endpoints
        this.claudeBaseUrl = 'https://api.anthropic.com/v1';
        this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
        this.groqBaseUrl = 'https://api.groq.com/openai/v1';

        // Ollama service (local AI)
        this.ollamaService = new OllamaService();

        // Response cache (5 minutes TTL)
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Set API keys
     */
    setClaudeApiKey(key) {
        this.claudeApiKey = key.trim();
        localStorage.setItem('claude_api_key', this.claudeApiKey);
    }

    setGeminiApiKey(key) {
        this.geminiApiKey = key.trim();
        localStorage.setItem('gemini_api_key', this.geminiApiKey);
    }

    setGeminiModel(model) {
        this.geminiModel = model;
        localStorage.setItem('gemini_model', model);
    }

    setGroqApiKey(key) {
        this.groqApiKey = key.trim();
        localStorage.setItem('groq_api_key', this.groqApiKey);
    }

    setGroqModel(model) {
        this.groqModel = model;
        localStorage.setItem('groq_model', model);
    }

    /**
     * Set AI provider (claude, gemini, groq, or ollama)
     */
    setProvider(provider) {
        if (!['claude', 'gemini', 'groq', 'ollama'].includes(provider)) {
            throw new Error('Invalid provider. Must be "claude", "gemini", "groq", or "ollama"');
        }
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
    }

    /**
     * Get available providers based on API keys
     */
    getAvailableProviders() {
        const providers = [];
        if (this.claudeApiKey) providers.push('claude');
        if (this.geminiApiKey) providers.push('gemini');
        if (this.groqApiKey) providers.push('groq');
        providers.push('ollama'); // Always available if installed
        return providers;
    }

    /**
     * Check if current provider has API key
     */
    hasApiKey() {
        if (this.provider === 'claude') return !!this.claudeApiKey;
        if (this.provider === 'gemini') return !!this.geminiApiKey;
        if (this.provider === 'groq') return !!this.groqApiKey;
        if (this.provider === 'ollama') return true; // Ollama doesn't need API key
        return false;
    }

    /**
     * Unified analyze method - routes to appropriate provider
     */
    async analyze(type, data, options = {}) {
        // Try Ollama first if selected
        if (this.provider === 'ollama') {
            try {
                if (type === 'image') {
                    // Ollama doesn't support images, fall back to Gemini
                    console.log('Ollama doesn\'t support images, using Gemini...');
                    const originalProvider = this.provider;
                    this.provider = 'gemini';
                    const result = await this._analyzeWithGemini(type, data, options);
                    this.provider = originalProvider;
                    return result;
                }
                return await this._analyzeWithOllama(type, data, options);
            } catch (error) {
                console.error('Ollama failed:', error);
                // Fall back to Gemini if Ollama fails
                if (this.geminiApiKey) {
                    console.log('Falling back to Gemini...');
                    const originalProvider = this.provider;
                    this.provider = 'gemini';
                    try {
                        const result = await this._analyzeWithGemini(type, data, options);
                        this.provider = originalProvider;
                        return result;
                    } catch (fallbackError) {
                        this.provider = originalProvider;
                        throw fallbackError;
                    }
                }
                throw error;
            }
        }

        // Cloud AI providers
        if (!this.hasApiKey()) {
            throw new Error('API_KEY_MISSING');
        }

        // Try primary provider, fallback to secondary if available
        try {
            if (this.provider === 'claude') {
                return await this._analyzeWithClaude(type, data, options);
            } else if (this.provider === 'groq') {
                return await this._analyzeWithGroq(type, data, options);
            } else {
                return await this._analyzeWithGemini(type, data, options);
            }
        } catch (error) {
            console.error(`${this.provider} failed:`, error);

            // Try fallback provider
            let fallbackProvider;
            if (this.provider === 'groq') {
                // Groq failed, try Gemini for images, or another Groq model for text
                fallbackProvider = type === 'image' ? 'gemini' : 'gemini';
            } else {
                fallbackProvider = this.provider === 'claude' ? 'gemini' : 'groq';
            }

            const hasFallback = this.getAvailableProviders().includes(fallbackProvider);

            if (hasFallback && options.allowFallback !== false) {
                console.log(`Falling back to ${fallbackProvider}...`);
                const originalProvider = this.provider;
                this.provider = fallbackProvider;

                try {
                    const result = this.provider === 'claude'
                        ? await this._analyzeWithClaude(type, data, options)
                        : this.provider === 'groq'
                            ? await this._analyzeWithGroq(type, data, options)
                            : await this._analyzeWithGemini(type, data, options);

                    this.provider = originalProvider; // Restore original
                    return result;
                } catch (fallbackError) {
                    this.provider = originalProvider; // Restore original
                    throw fallbackError;
                }
            }

            throw error;
        }
    }

    /**
     * Analyze image (food recognition)
     */
    async analyzeImage(imageFile) {
        const resizedBlob = await this._resizeImage(imageFile, 800);
        const base64Image = await this._fileToBase64(resizedBlob);

        return await this.analyze('image', {
            image: base64Image,
            prompt: `Analyze this image. If it contains food, identify it and estimate nutrition.
            Return ONLY a raw JSON object (no markdown formatting) with these fields:
            {
                "name": "Food Name",
                "calories": 0,
                "protein": "0g",
                "carbs": "0g",
                "fats": "0g"
            }
            If it is NOT food, return: {"error": "Not food detected"}`
        });
    }

    /**
     * Parse voice log
     */
    async parseVoiceLog(text) {
        return await this.analyze('text', {
            prompt: `Analyze this spoken food log: "${text}"
            Extract the food name, estimated nutritional info, and the user's mood if mentioned.
            Return ONLY a raw JSON object (no markdown) with this structure:
            {
                "name": "Food Name",
                "calories": 0,
                "protein": "0g",
                "carbs": "0g",
                "fats": "0g",
                "mood": "Mood Name (Choose from: Very Bad, Bad, Neutral, Good, Feel OK) or null if not mentioned"
            }`
        });
    }

    /**
     * Generate meal plan
     */
    async generateMealPlan(safeFoods, days = 7) {
        const foodsList = safeFoods.map(f => f.name).join(', ');

        return await this.analyze('text', {
            prompt: `Create a ${days}-day meal plan using these safe foods: ${foodsList}.
            You can add other common healthy ingredients.
            Return ONLY a raw JSON object (no markdown) with this structure:
            {
                "plan": [
                    {
                        "day": "Day 1",
                        "meals": [
                            { "type": "Breakfast", "name": "Meal Name", "calories": "300kcal" },
                            { "type": "Lunch", "name": "Meal Name", "calories": "500kcal" },
                            { "type": "Dinner", "name": "Meal Name", "calories": "600kcal" }
                        ]
                    },
                    ... (Day 2 through ${days})
                ]
            }`
        });
    }

    /**
     * Generate grocery list from meal plan
     */
    async generateGroceryList(plan) {
        const planText = JSON.stringify(plan);

        return await this.analyze('text', {
            prompt: `Based on this ${plan.length}-day meal plan: ${planText}
            Create a consolidated shopping list.
            Group items by category (Produce, Dairy, Meat, Pantry, etc.).
            Return ONLY a raw JSON object (no markdown) with this structure:
            {
                "shopping_list": {
                    "Produce": ["Item 1", "Item 2"],
                    "Dairy": ["Item 3"],
                    ...
                }
            }`
        });
    }

    /**
     * Analyze fridge/pantry image for recipe suggestions
     */
    async analyzeFridge(imageFile) {
        const resizedBlob = await this._resizeImage(imageFile, 800);
        const base64Image = await this._fileToBase64(resizedBlob);

        return await this.analyze('image', {
            image: base64Image,
            prompt: `Identify the ingredients in this image. Based on these ingredients, suggest 3 healthy meal ideas suitable for someone with food sensitivities (avoiding common allergens if possible, or keeping it simple).
            Return ONLY a raw JSON object (no markdown) with this structure:
            {
                "recipes": [
                    {
                        "name": "Recipe Name",
                        "description": "Brief description of ingredients and steps.",
                        "calories": "Estimate per serving"
                    }
                ]
            }`
        }, { temperature: 0.7 });
    }

    /**
     * Claude-specific implementation
     */
    async _analyzeWithClaude(type, data, options = {}) {
        const cacheKey = `claude_${type}_${JSON.stringify(data).substring(0, 100)}`;
        const cached = this._getFromCache(cacheKey);
        if (cached) return cached;

        const messages = [];

        if (type === 'image') {
            // Extract base64 data and mime type
            const base64Data = data.image.split(',')[1] || data.image;
            const mimeType = data.image.match(/data:(image\/\w+);base64,/)
                ? data.image.match(/data:(image\/\w+);base64,/)[1]
                : 'image/jpeg';

            messages.push({
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mimeType,
                            data: base64Data
                        }
                    },
                    {
                        type: 'text',
                        text: data.prompt
                    }
                ]
            });
        } else {
            messages.push({
                role: 'user',
                content: data.prompt
            });
        }

        const requestBody = {
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            temperature: options.temperature || 0.0,
            messages: messages
        };

        try {
            const response = await fetch(`${this.claudeBaseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.claudeApiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Claude API request failed');
            }

            const responseData = await response.json();
            const text = responseData.content[0].text;

            // Parse JSON response
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanJson);

            if (result.error) {
                throw new Error(result.error);
            }

            this._saveToCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Claude API Error:', error);
            throw error;
        }
    }

    /**
     * Gemini-specific implementation
     */
    async _analyzeWithGemini(type, data, options = {}) {
        const cacheKey = `gemini_${type}_${JSON.stringify(data).substring(0, 100)}`;
        const cached = this._getFromCache(cacheKey);
        if (cached) return cached;

        const parts = [];

        if (type === 'image') {
            const base64Data = data.image.split(',')[1] || data.image;
            const mimeType = 'image/jpeg';

            parts.push({ text: data.prompt });
            parts.push({
                inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                }
            });
        } else {
            parts.push({ text: data.prompt });
        }

        const requestBody = {
            contents: [{ parts }],
            generationConfig: {
                temperature: options.temperature || 0.0
            }
        };

        const apiUrl = `${this.geminiBaseUrl}${this.geminiModel}:generateContent`;

        try {
            const response = await fetch(`${apiUrl}?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Gemini API request failed');
            }

            const responseData = await response.json();
            const text = responseData.candidates[0].content.parts[0].text;

            // Parse JSON response
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanJson);

            if (result.error) {
                throw new Error(result.error);
            }

            this._saveToCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    /**
     * List available Gemini models
     */
    async listGeminiModels() {
        if (!this.geminiApiKey) throw new Error('API_KEY_MISSING');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${this.geminiApiKey}`
        );

        if (!response.ok) throw new Error('Failed to list models');

        const data = await response.json();
        return data.models.map(m => m.name.replace('models/', ''));
    }

    /**
     * Ollama-specific implementation (local AI)
     */
    async _analyzeWithOllama(type, data, options = {}) {
        // Ollama doesn't use cache for now (it's local and fast)

        if (type === 'text') {
            // For text-based analysis (voice logs, meal plans, etc.)
            if (data.prompt.includes('food log')) {
                return await this.ollamaService.parseVoiceLog(data.prompt.match(/"([^"]+)"/)?.[1] || '');
            } else if (data.prompt.includes('meal plan')) {
                // Extract safe foods from prompt
                const foodsMatch = data.prompt.match(/using these safe foods: ([^.]+)/);
                const safeFoods = foodsMatch ? foodsMatch[1].split(',').map(f => ({ name: f.trim() })) : [];
                const daysMatch = data.prompt.match(/(\d+)-day/);
                const days = daysMatch ? parseInt(daysMatch[1]) : 7;
                return await this.ollamaService.generateMealPlan(safeFoods, days);
            } else if (data.prompt.includes('shopping list')) {
                // Extract plan from prompt
                const planMatch = data.prompt.match(/meal plan: (\[[\s\S]*\])/);
                const plan = planMatch ? JSON.parse(planMatch[1]) : [];
                return await this.ollamaService.generateGroceryList(plan);
            }
        }

        throw new Error('Unsupported operation for Ollama');
    }

    /**
     * Groq-specific implementation (cloud AI with generous free tier)
     */
    async _analyzeWithGroq(type, data, options = {}) {
        const cacheKey = `groq_${type}_${JSON.stringify(data).substring(0, 100)}`;
        const cached = this._getFromCache(cacheKey);
        if (cached) return cached;

        // Groq uses OpenAI-compatible API
        const messages = [{
            role: 'user',
            content: data.prompt
        }];

        const requestBody = {
            model: this.groqModel,
            messages: messages,
            temperature: options.temperature || 0.1,
            max_tokens: 1024
        };

        try {
            const response = await fetch(`${this.groqBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Groq API request failed');
            }

            const responseData = await response.json();
            const text = responseData.choices[0].message.content;

            // Parse JSON response
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanJson);

            if (result.error) {
                throw new Error(result.error);
            }

            this._saveToCache(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Groq API Error:', error);
            throw error;
        }
    }

    /**
     * Cache helpers
     */
    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    _saveToCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limit cache size to 50 entries
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    /**
     * Image processing helpers
     */
    _resizeImage(file, maxSize) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', 0.8);
            };
        });
    }

    _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}
