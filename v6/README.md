# NutriMood V6 - The Intelligent Food Coach

> AI-powered food and mood tracking with **Goals**, **Achievements**, and **Intelligent Coaching**

## 🎯 What's New in V6

### 1. **Goal Setting & Achievements** 🏆
- Set custom goals (calories, protein, mood score, streak days)
- Earn 20+ achievement badges
- Visual progress tracking
- Weekly challenges

### 2. **Smart Reminders** 🔔
- Meal logging reminders (breakfast, lunch, dinner)
- Streak maintenance alerts
- Goal progress notifications
- Customizable reminder times

### 3. **AI Meal Coach** 🤖
- Pattern recognition (food-mood correlations)
- Proactive suggestions
- Nutrient deficiency warnings
- Mood prediction for planned meals
- Smart food substitutions

---

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- AI API key (Claude or Gemini)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/EmotionalLogFoodJournal.git
cd EmotionalLogFoodJournal/v6
```

2. **Run locally**
```bash
npm run dev
```

3. **Open in browser**
```
http://localhost:8080/v6/
```

4. **Configure API Key**
- Click Settings ⚙️
- Select AI provider (Gemini recommended for free tier)
- Add your API key
- Save

---

## ✨ Features

### Core Features (from V5S)
- 📸 **Food Scanning** - AI-powered food recognition
- 🎙️ **Voice Logging** - Speak your meals
- ⌨️ **Type Logging** - Quick text entry
- 😊 **Mood Tracking** - Track how food affects you
- 📊 **Weekly Reports** - Comprehensive analytics
- 🔍 **Food Sensitivity Insights** - Identify trigger & safe foods
- 📅 **7-Day Meal Planning** - AI-generated meal plans
- 🛒 **Grocery Lists** - Auto-generated shopping lists
- 👨‍🍳 **Fridge Chef** - Recipe suggestions from ingredients
- 💬 **AI Chatbot** - Ask nutrition questions

### New V6 Features
- 🎯 **Goals** - Set and track custom goals
- 🏆 **Achievements** - Unlock 20+ badges
- 🔔 **Reminders** - Never miss a meal log
- 🤖 **AI Coach** - Proactive insights and recommendations
- 📈 **Pattern Recognition** - Discover food-mood correlations
- 🔮 **Mood Prediction** - See how foods will affect you
- 💡 **Daily Tips** - Personalized health advice

---

## 🏗️ Architecture

### Services

#### Core Services (V5S)
- `AnalysisService` - AI food analysis (Claude/Gemini)
- `StorageService` - IndexedDB data persistence
- `VoiceService` - Speech recognition
- `ChatService` - AI chatbot

#### New V6 Services
- `GoalsService` - Goal management and progress tracking
- `AchievementsService` - Badge system and unlock logic
- `NotificationService` - Browser notifications and reminders
- `CoachService` - AI pattern recognition and insights

### Data Flow
```
User Input → Services → AI Analysis → Storage → Insights → Coach → Notifications
```

---

## 🎮 Achievement System

### Badge Categories

**Streak Badges** 🔥
- First Step (1 day)
- Getting Started (3 days)
- Week Warrior (7 days)
- Month Master (30 days)
- Unstoppable (100 days)

**Volume Badges** 📝
- Beginner (10 logs)
- Dedicated (50 logs)
- Expert (100 logs)
- Master (500 logs)

**Mood Badges** 😊
- Mood Tracker (10 moods)
- Happiness Hunter (7 good days)
- Mood Master (all mood types)

**Discovery Badges** 🍽️
- Food Explorer (20 foods)
- Variety Seeker (50 foods)
- Culinary Master (100 foods)

**Goal Badges** 🎯
- Goal Setter (1 goal)
- Achiever (1 completed)
- Overachiever (5 completed)
- Goal Master (20 completed)

---

## 🤖 AI Coach Intelligence

### Pattern Recognition
- Food-mood correlations
- Time-based patterns
- Nutrient deficiencies
- Eating habits

### Proactive Insights
- "You tend to feel bad after dairy - try alternatives"
- "Your energy is low on Mondays - try protein breakfast"
- "You're low on protein this week - add chicken or beans"

### Smart Recommendations
- Mood prediction for planned meals
- Food substitution suggestions
- Personalized meal plans
- Daily health tips

---

## 📱 Mobile Support

### PWA Features
- Add to home screen
- Offline capable (coming soon)
- Push notifications
- Mobile-optimized UI

### Supported Platforms
- ✅ iOS (Safari)
- ✅ Android (Chrome)
- ✅ Desktop (all modern browsers)

---

## 🔐 Privacy & Data

- **Local-first**: All data stored on your device
- **No tracking**: We don't collect your data
- **API keys**: Stored locally, never sent to our servers
- **Export**: Download your data anytime

---

## 🛠️ Development

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Storage**: IndexedDB + localStorage
- **AI**: Claude Sonnet 4.5 / Google Gemini
- **Notifications**: Web Notifications API
- **Testing**: Jest + Playwright

### Project Structure
```
v6/
├── index.html
├── manifest.json
├── package.json
├── css/
│   ├── styles.css
│   └── print.css
├── js/
│   ├── app.js
│   ├── services/
│   │   ├── analysis.js
│   │   ├── storage.js
│   │   ├── voice.js
│   │   ├── chatbot.js
│   │   ├── goals.js          (NEW)
│   │   ├── achievements.js   (NEW)
│   │   ├── notifications.js  (NEW)
│   │   └── coach.js          (NEW)
│   └── utils/
└── assets/
    └── badges/
```

### Running Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📄 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- Claude Sonnet 4.5 by Anthropic
- Google Gemini AI
- Pollinations.ai for food images

---

**Built with ❤️ for better health through mindful eating**
