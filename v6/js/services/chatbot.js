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
        // Check if any API key is available via the service
        if (!this.analysisService.hasApiKey() && this.analysisService.provider !== 'ollama') {
            throw new Error("API_KEY_MISSING");
        }

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

        try {
            const reply = await this.analysisService.analyze('text', {
                prompt: systemPrompt
            }, {
                responseFormat: 'text',
                temperature: 0.7
            });

            this.history.push({ user: userMessage, bot: reply });
            return reply;

        } catch (error) {
            console.error("Chat Error:", error);
            throw error;
        }
    }
}
