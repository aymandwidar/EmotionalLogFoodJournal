/**
 * Ollama Service - Local AI Integration
 * Provides unlimited, free AI analysis using locally-run models
 * No API keys, no rate limits, 100% private
 */

export class OllamaService {
    constructor() {
        this.baseUrl = 'http://localhost:11434/api';
        this.model = localStorage.getItem('ollama_model') || 'llama3.2:3b';
        this.isAvailable = false;
        this.checkAvailability();
    }

    /**
     * Check if Ollama is running
     */
    async checkAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/tags`, {
                method: 'GET',
                signal: AbortSignal.timeout(2000) // 2 second timeout
            });

            if (response.ok) {
                const data = await response.json();
                this.isAvailable = true;
                this.availableModels = data.models || [];
                console.log('✅ Ollama is available with models:', this.availableModels.map(m => m.name));
                return true;
            }
        } catch (error) {
            this.isAvailable = false;
            console.log('⚠️ Ollama not available. Install from https://ollama.ai');
            return false;
        }
        return false;
    }

    /**
     * Set the model to use
     */
    setModel(model) {
        this.model = model;
        localStorage.setItem('ollama_model', model);
    }

    /**
     * Generate completion with Ollama
     */
    async generate(prompt, options = {}) {
        if (!this.isAvailable) {
            await this.checkAvailability();
            if (!this.isAvailable) {
                throw new Error('Ollama is not running. Start it with: ollama serve');
            }
        }

        const response = await fetch(`${this.baseUrl}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: options.temperature || 0.1,
                    num_predict: options.maxTokens || 512
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Ollama error: ${error}`);
        }

        const data = await response.json();
        return data.response;
    }

    /**
     * Parse voice log using Ollama
     */
    async parseVoiceLog(text) {
        const prompt = `You are a nutrition analysis AI. Analyze this food log and extract nutritional information.

Food log: "${text}"

Return ONLY a valid JSON object with this exact structure (no markdown, no explanations):
{
    "name": "Food Name",
    "calories": 0,
    "protein": "0g",
    "carbs": "0g",
    "fats": "0g"
}

If a mood is mentioned, add: "mood": "Mood Name"
Choose mood from: Very Bad, Bad, Neutral, Good, Feel OK

JSON:`;

        const response = await this.generate(prompt, { temperature: 0.1 });

        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse Ollama response');
        }

        return JSON.parse(jsonMatch[0]);
    }

    /**
     * Analyze food image (not supported by Ollama text models)
     */
    async analyzeImage(imageFile) {
        throw new Error('Image analysis requires vision models. Use Gemini for image analysis.');
    }

    /**
     * Generate meal plan
     */
    async generateMealPlan(safeFoods, days = 7) {
        const foodsList = safeFoods.map(f => f.name).join(', ');

        const prompt = `Create a ${days}-day meal plan using these safe foods: ${foodsList}.
You can add other common healthy ingredients.

Return ONLY a valid JSON object with this structure (no markdown):
{
    "plan": [
        {
            "day": "Day 1",
            "meals": [
                { "type": "Breakfast", "name": "Meal Name", "calories": "300kcal" },
                { "type": "Lunch", "name": "Meal Name", "calories": "500kcal" },
                { "type": "Dinner", "name": "Meal Name", "calories": "600kcal" }
            ]
        }
    ]
}

Create all ${days} days. JSON:`;

        const response = await this.generate(prompt, { temperature: 0.3, maxTokens: 2048 });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse meal plan response');
        }

        return JSON.parse(jsonMatch[0]);
    }

    /**
     * Generate grocery list
     */
    async generateGroceryList(plan) {
        const planText = JSON.stringify(plan);

        const prompt = `Based on this meal plan: ${planText}

Create a consolidated shopping list grouped by category.

Return ONLY a valid JSON object (no markdown):
{
    "shopping_list": {
        "Produce": ["Item 1", "Item 2"],
        "Dairy": ["Item 3"],
        "Meat": ["Item 4"],
        "Pantry": ["Item 5"]
    }
}

JSON:`;

        const response = await this.generate(prompt, { temperature: 0.2, maxTokens: 1024 });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse grocery list response');
        }

        return JSON.parse(jsonMatch[0]);
    }

    /**
     * Chat completion
     */
    async chat(message, context = []) {
        const prompt = context.length > 0
            ? `${context.join('\n')}\n\nUser: ${message}\nAssistant:`
            : `You are a helpful nutrition and health assistant. Answer this question:\n\n${message}\n\nAnswer:`;

        return await this.generate(prompt, { temperature: 0.7, maxTokens: 512 });
    }

    /**
     * Get available models
     */
    async getAvailableModels() {
        try {
            const response = await fetch(`${this.baseUrl}/tags`);
            if (response.ok) {
                const data = await response.json();
                return data.models || [];
            }
        } catch (error) {
            console.error('Failed to get Ollama models:', error);
        }
        return [];
    }

    /**
     * Pull a new model
     */
    async pullModel(modelName) {
        const response = await fetch(`${this.baseUrl}/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: modelName })
        });

        if (!response.ok) {
            throw new Error('Failed to pull model');
        }

        // Note: This is a streaming response, but we'll just return success
        return true;
    }
}
