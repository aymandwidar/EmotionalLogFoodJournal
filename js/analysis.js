/**
 * Analysis Service
 * Uses Google Gemini 1.5 Flash API to analyze food images.
 */

export class AnalysisService {
    constructor() {
        this.apiKey = localStorage.getItem('gemini_api_key');
        this.model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    }

    setModel(modelId) {
        this.model = modelId;
        localStorage.setItem('gemini_model', modelId);
    }

    /**
     * Updates the API key.
     * @param {string} key 
     */
    setApiKey(key) {
        const cleanKey = key.trim();
        this.apiKey = cleanKey;
        localStorage.setItem('gemini_api_key', cleanKey);
    }

    /**
     * Analyzes an image file using Gemini API.
     * @param {File} imageFile 
     * @returns {Promise<Object>}
     */
    async analyzeImage(imageFile) {
        if (!this.apiKey) {
            throw new Error("API_KEY_MISSING");
        }

        // Resize image to avoid payload limits/timeouts
        const resizedBlob = await this._resizeImage(imageFile, 800);
        const base64Image = await this._fileToBase64(resizedBlob);

        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64Image.split(',')[1];
        const mimeType = "image/jpeg"; // Resized is always jpeg

        const prompt = `
            Analyze this image. If it contains food, identify it and estimate nutrition.
            Return ONLY a raw JSON object (no markdown formatting) with these fields:
            {
                "name": "Food Name",
                "calories": 0, (integer)
                "protein": "0g",
                "carbs": "0g",
                "fats": "0g"
            }
            If it is NOT food, return: {"error": "Not food detected"}
        `;

        const requestBody = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.0
            }
        };

        const apiUrl = `${this.baseUrl}${this.model}:generateContent`;

        try {
            const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API Request Failed');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;

            // Clean up markdown code blocks if present
            const cleanJson = text.replace(/```json|```/g, '').trim();
            const result = JSON.parse(cleanJson);

            if (result.error) {
                throw new Error(result.error);
            }

            return result;

        } catch (error) {
            console.error("Gemini API Error:", error);
            throw error;
        }
    }

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
                }, 'image/jpeg', 0.8); // Compress to 80% quality
            };
        });
    }

    async listModels() {
        if (!this.apiKey) throw new Error("API_KEY_MISSING");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
        if (!response.ok) throw new Error("Failed to list models");

        const data = await response.json();
        return data.models.map(m => m.name.replace('models/', ''));
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
