/**
 * Export Service - V7
 * Simple CSV export for now
 */

export class ExportService {
    constructor(storageService, symptomsService) {
        this.storageService = storageService;
        this.symptomsService = symptomsService;
    }

    /**
     * Export to CSV
     */
    async exportToCSV() {
        const logs = this.storageService.getLogs();
        const symptoms = this.symptomsService.getSymptoms();

        const headers = [
            'Date', 'Time', 'Food', 'Calories', 'Protein', 'Carbs', 'Fats', 'Mood', 'Symptoms', 'Intensity'
        ];

        const rows = logs.map(log => {
            const date = new Date(log.timestamp);
            const logSymptoms = symptoms.filter(s => s.linkedMealId === log.id);
            const symptomText = logSymptoms.map(s => s.symptomType).join(', ');
            const avgIntensity = logSymptoms.length > 0
                ? (logSymptoms.reduce((sum, s) => sum + s.intensity, 0) / logSymptoms.length).toFixed(1)
                : '';

            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                log.food?.name || '',
                log.food?.calories || '',
                log.food?.protein || '',
                log.food?.carbs || '',
                log.food?.fats || '',
                log.mood?.mood || '',
                symptomText,
                avgIntensity
            ];
        });

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nutrimood-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        return true;
    }
}
