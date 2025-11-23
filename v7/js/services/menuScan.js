/**
 * Menu Scan Service - V7
 * Uses OCR to scan restaurant menus and identify safe/unsafe dishes based on user's trigger foods
 * 
 * This uses Tesseract.js for client-side OCR
 * CDN: https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js
 */

export class MenuScanService {
    constructor(storageService, symptomsService) {
        this.storageService = storageService;
        this.symptomsService = symptomsService;
        this.worker = null;
    }

    /**
     * Initialize Tesseract worker
     */
    async initOCR() {
        if (this.worker) return;

        try {
            // Check if Tesseract is loaded
            if (typeof Tesseract === 'undefined') {
                throw new Error('Tesseract.js not loaded');
            }

            this.worker = await Tesseract.createWorker('eng');
            console.log('Tesseract OCR initialized');
        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            throw error;
        }
    }

    /**
     * Scan menu image
     */
    async scanMenu(imageFile) {
        if (!this.worker) {
            await this.initOCR();
        }

        try {
            // 1. Extract text from image
            const { data: { text } } = await this.worker.recognize(imageFile);
            console.log('Extracted text:', text);

            // 2. Parse menu items
            const menuItems = this._parseMenuItems(text);
            console.log('Parsed items:', menuItems);

            // 3. Analyze each item against user's trigger foods
            const analysis = await this._analyzeMenuItems(menuItems);

            return {
                success: true,
                itemsFound: menuItems.length,
                analysis: analysis,
                rawText: text
            };
        } catch (error) {
            console.error('Menu scan failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse menu items from OCR text
     */
    _parseMenuItems(text) {
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        const items = [];

        // Simple heuristic: Lines with food-related keywords or patterns
        const foodKeywords = /burger|pizza|pasta|salad|chicken|beef|fish|sandwich|soup|rice|noodle|steak|taco|wrap|bowl/i;
        const pricePattern = /\$\d+/;

        lines.forEach(line => {
            const cleaned = line.trim();

            // Skip very short lines or headers
            if (cleaned.length < 5) return;
            if (/^(appetizer|entree|dessert|drink|menu|price)/i.test(cleaned)) return;

            // If it has price or food keywords, likely a menu item
            if (pricePattern.test(cleaned) || foodKeywords.test(cleaned)) {
                items.push({
                    name: cleaned.replace(pricePattern, '').trim(),
                    rawText: cleaned
                });
            }
        });

        return items;
    }

    /**
     * Analyze menu items against user's food sensitivities
     */
    async _analyzeMenuItems(menuItems) {
        // Get user's trigger foods from symptom correlations
        const correlations = this.symptomsService.getSymptomCorrelations();
        const triggerFoods = new Set();

        // Collect all foods that caused symptoms
        Object.values(correlations).forEach(symptomData => {
            symptomData.forEach(item => {
                if (item.count >= 2) { // Triggered at least twice
                    triggerFoods.add(item.food.toLowerCase());
                }
            });
        });

        // Also check general trigger ingredients
        const commonTriggers = ['dairy', 'gluten', 'lactose', 'milk', 'cheese', 'wheat'];

        const analyzed = menuItems.map(item => {
            const itemLower = item.name.toLowerCase();
            let status = 'safe'; // safe, caution, avoid
            let reason = '';
            const triggers = [];

            // Check against user's specific trigger foods
            for (const trigger of triggerFoods) {
                if (itemLower.includes(trigger)) {
                    status = 'avoid';
                    triggers.push(trigger);
                    reason = `Contains ${trigger} (your trigger food)`;
                }
            }

            // Check common allergens/triggers
            if (status === 'safe') {
                for (const trigger of commonTriggers) {
                    if (itemLower.includes(trigger)) {
                        status = 'caution';
                        triggers.push(trigger);
                        reason = `May contain ${trigger}`;
                    }
                }
            }

            return {
                ...item,
                status,
                triggers,
                reason,
                confidence: triggers.length > 0 ? 0.8 : 0.5
            };
        });

        return analyzed;
    }

    /**
     * Get color for status
     */
    getStatusColor(status) {
        const colors = {
            'safe': '#10b981',      // Green
            'caution': '#f59e0b',   // Yellow
            'avoid': '#ef4444'      // Red
        };
        return colors[status] || colors['safe'];
    }

    /**
     * Get emoji for status
     */
    getStatusEmoji(status) {
        const emojis = {
            'safe': '✅',
            'caution': '⚠️',
            'avoid': '❌'
        };
        return emojis[status] || '❓';
    }

    /**
     * Cleanup
     */
    async terminate() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
        }
    }
}
