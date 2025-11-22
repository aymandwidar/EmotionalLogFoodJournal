/**
 * Analysis Service - V5S
 * Unified AI service supporting both Claude Sonnet 4.5 and Google Gemini
 * Provides food analysis, voice parsing, meal planning, and recipe generation
 */

export class AnalysisService {
    constructor() {
        // Load saved preferences
        this.claudeApiKey = localStorage.getItem('claude_api_key') || '';
        this.geminiApiKey = localStorage.getItem('gemini_api_key') || '';
        this.provider = localStorage.getItem('ai_provider') || 'claude'; // Default to Claude
        this.geminiModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';

        // API endpoints
        this.claudeBaseUrl = 'https://api.anthropic.com/v1';
        this.geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';

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

    /**
     * Set AI provider (claude or gemini)
     */
    setProvider(provider) {
        if (!['claude', 'gemini'].includes(provider)) {
            throw new Error('Invalid provider. Must be "claude" or "gemini"');
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
        return providers;
    }

    /**
     * Check if current provider has API key
     */
    hasApiKey() {
        if (this.provider === 'claude') return !!this.claudeApiKey;
        if (this.provider === 'gemini') return !!this.geminiApiKey;
        return false;
    }

    /**
     * Unified analyze method - routes to appropriate provider
     */
    async analyze(type, data, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('API_KEY_MISSING');
        }

        // Try primary provider, fallback to secondary if available
        try {
            if (this.provider === 'claude') {
                return await this._analyzeWithClaude(type, data, options);
            } else {
                return await this._analyzeWithGemini(type, data, options);
            }
        } catch (error) {
            console.error(`${this.provider} failed:`, error);

            // Try fallback provider
            const fallbackProvider = this.provider === 'claude' ? 'gemini' : 'claude';
            const hasFallback = this.getAvailableProviders().includes(fallbackProvider);

            if (hasFallback && options.allowFallback !== false) {
                console.log(`Falling back to ${fallbackProvider}...`);
                const originalProvider = this.provider;
                this.provider = fallbackProvider;

                try {
                    const result = this.provider === 'claude'
                        ? await this._analyzeWithClaude(type, data, options)
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
