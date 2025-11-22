# NutriMood V5S

AI-powered food and mood tracking application with Claude Sonnet 4.5 integration.

## Features

- 📸 **Food Scanning**: AI-powered food recognition and nutrition analysis
- 🎙️ **Voice Logging**: Speak your meals naturally
- 😊 **Mood Tracking**: Track how foods affect your mood
- 📊 **Advanced Analytics**: Visualize patterns and trends
- 📅 **Meal Planning**: AI-generated meal plans based on your safe foods
- 🛒 **Grocery Lists**: Automatic shopping lists from meal plans
- 💬 **AI Chat**: Ask questions about your nutrition and patterns
- 🌓 **Themes**: Dark, light, high contrast, and sepia modes
- 📴 **Offline Support**: Full offline functionality with sync

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **AI Models**: Claude Sonnet 4.5 + Google Gemini (fallback)
- **Storage**: IndexedDB + localStorage
- **PWA**: Service Worker for offline support
- **Testing**: Jest + Playwright

## Getting Started

### Installation

```bash
cd v5
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:8080/v5/ in your browser.

### Testing

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Configuration

1. Open the app
2. Click Settings (⚙️)
3. Enter your API keys:
   - Claude API key (get from https://console.anthropic.com/)
   - Gemini API key (get from https://aistudio.google.com/app/apikey)
4. Select your preferred AI model

## Project Structure

```
v5/
├── index.html              # Main HTML file
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── styles.css         # Main styles
│   ├── themes.css         # Theme definitions
│   └── print.css          # Print styles
├── js/
│   ├── app.js             # Main application
│   ├── services/          # Service layer
│   ├── utils/             # Utility functions
│   └── components/        # UI components
└── tests/                 # Test files
```

## License

MIT
