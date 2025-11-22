/**
 * Chat Service
 * Handles AI conversation with context awareness of user logs.
 */
export class ChatService {
    constructor(analysisService, storageService) {
        this.analysisService = analysisService;
        this.storageService = storageService;
        this.history = [];
    }

    async sendMessage(userMessage) {
        if (!this.analysisService.apiKey) throw new Error("API_KEY_MISSING");

        // Get recent context (last 10 logs)
        const logs = this.storageService.getLogs().slice(0, 10);
        const context = logs.map(log =>
            `- ${new Date(log.timestamp).toLocaleDateString()}: Ate ${log.food.name} (${log.food.calories}kcal), Mood: ${log.mood ? log.mood.mood : 'Unknown'}`
        ).join('\n');

        const systemPrompt = `
            You are "NutriMood AI", a helpful gut health assistant.
            You have access to the user's recent food and mood logs:
            ${context}

            User Question: "${userMessage}"

            Answer the user's question based on their logs if relevant. 
            CRITICAL INSTRUCTION: Keep your answer EXTREMELY CONCISE. 
            - Maximum 2-3 sentences.
            - No fluff or long introductions.
            - Get straight to the point.
            If you see a clear pattern between a food and a bad mood, point it out gently but briefly.
        `;

        const requestBody = {
            contents: [{
                parts: [{ text: systemPrompt }]
            }]
        };

        const apiUrl = `${this.analysisService.baseUrl}${this.analysisService.model}:generateContent`;

        try {
            const response = await fetch(`${apiUrl}?key=${this.analysisService.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'API Request Failed');
            }

            const data = await response.json();
            const reply = data.candidates[0].content.parts[0].text;

            this.history.push({ user: userMessage, bot: reply });
            return reply;

        } catch (error) {
            console.error("Chat Error:", error);
            throw error;
        }
    }
}
