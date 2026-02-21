# FinMate - AI-Powered Personal Finance Manager �

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, AI-powered personal finance management application built with React Native and Expo. FinMate helps users track expenses, manage savings goals, get investment recommendations, and receive intelligent financial insights powered by Google's Gemini AI.

## ✨ Key Features

### 💸 Smart Money Management
- **QR Code Payments**: Scan QR codes to make instant payments with automatic category detection
- **Transaction Tracking**: Monitor all your income and expenses in real-time
- **Category Management**: AI-powered automatic categorization with learning capabilities
- **Multi-language Support**: Available in English, Hindi, Marathi, and Gujarati

### 🐷 Piggy Banks (Savings Goals)
- **Goal-Based Savings**: Create multiple savings goals with custom targets
- **Visual Progress Tracking**: Beautiful progress indicators and charts
- **Agentic AI Coach**: Get personalized savings advice and autonomous allocation suggestions
- **Smart Insights**: AI analyzes your spending patterns to optimize savings

### 📊 AI Financial Analysis
- **Spending Patterns**: Detect daily, weekly, and category-based spending trends
- **Income Forecasting**: Predict future income based on historical patterns
- **Anomaly Detection**: Identify unusual spending behavior
- **Budget Rebalancing**: AI-powered budget optimization suggestions
- **Gig Worker Support**: Special features for irregular income patterns

### 📈 Investment Recommendations
- **Risk Profiling**: Comprehensive risk assessment based on age, income, dependents, and financial goals
- **Personalized Fund Recommendations**: AI-curated mutual fund suggestions
- **Dynamic Portfolio Analysis**: Real-time portfolio health monitoring
- **Smart SIP Allocation**: Automated investment distribution across funds
- **Insurance Recommendations**: Personalized health and life insurance suggestions
- **Spirit Animal Investing**: Personality-based investment strategies

### 🤖 AI-Powered Features
- **Financial Chatbot**: 24/7 AI assistant powered by Google Gemini
- **Predictive Analytics**: Forecast spending and income trends
- **Intelligent Insights**: Context-aware financial advice
- **Pattern Recognition**: Identify spending habits and opportunities

### 🎨 Modern UI/UX
- **Google AI Studio Theme**: Sleek dark theme inspired by Google AI Studio
- **Responsive Design**: Optimized for all screen sizes
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Interactive Charts**: Beautiful data visualizations with React Native Chart Kit

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)
- A Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/apurvakirve/finmate-mpp.git
   cd money-transfer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Add your Gemini API key to `.env`:
   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSyA40MxmO40lUhcENJxyWO1B58B5EMeypAg
   ```
   
   Get your free API key from: [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **Start the development server**
   ```bash
   npx expo start
   ```

5. **Run on your device**
   - Scan the QR code with Expo Go (Android/iOS)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Press `w` for web browser

## 📱 Project Structure

```
money-transfer/
├── app/                          # Main application screens
│   ├── (tabs)/                   # Tab-based navigation screens
│   │   ├── MoneyTransferApp.tsx  # Main dashboard & transactions
│   │   ├── TransactionAnalysis.tsx # AI insights & analytics
│   │   ├── PiggyBanks.tsx        # Savings goals management
│   │   ├── InvestmentsTab.tsx    # Investment recommendations
│   │   ├── SignupForm.tsx        # User onboarding
│   │   └── RiskProfile.tsx       # Investment risk assessment
│   └── _layout.tsx               # Root layout configuration
├── components/                   # Reusable UI components
│   ├── AIInsightsDashboard.tsx   # AI analytics dashboard
│   ├── FinanceBot.tsx            # AI chatbot component
│   ├── PredictionCard.tsx        # Prediction display cards
│   ├── SpendingSnapshot.tsx      # Spending overview
│   ├── InsuranceRecommendationsCard.tsx
│   ├── PersonalityInsightCard.tsx
│   └── ui/                       # Base UI components
├── lib/                          # Business logic & services
│   ├── aiFinancialAnalyzer.ts    # AI-powered financial analysis
│   ├── AgenticInvestmentCoach.ts # Investment AI coach
│   ├── AgenticPiggyBankCoach.ts  # Savings AI coach
│   ├── PersonalizedRiskProfile.ts # Risk assessment engine
│   ├── FundSearchService.ts      # Mutual fund search
│   ├── InsuranceRecommendation.ts # Insurance logic
│   ├── BillTracker.ts            # Bill tracking service
│   ├── CategoryMemoryService.ts  # Category learning
│   └── supabase.ts               # Database client
├── constants/                    # App constants & themes
│   └── aiStudioTheme.ts          # Google AI Studio theme
├── types/                        # TypeScript type definitions
├── assets/                       # Images, fonts, icons
└── package.json                  # Dependencies & scripts
```

## 🛠️ Technology Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation library
- **React Native Chart Kit** - Data visualization

### AI & Machine Learning
- **Google Gemini AI** - Conversational AI and insights
- **Custom ML Algorithms** - Pattern detection and predictions

### Backend & Storage
- **Supabase** - Backend-as-a-Service (PostgreSQL)
- **AsyncStorage** - Local data persistence

### UI/UX
- **Expo Vector Icons** - Icon library
- **React Native SVG** - SVG rendering
- **React Native Linear Gradient** - Gradient effects
- **React Native Reanimated** - Smooth animations

### Additional Features
- **Expo Camera** - QR code scanning
- **React Native QRCode SVG** - QR code generation
- **i18n** - Internationalization support

## 🎯 Core Features Breakdown

### Dashboard (MoneyTransferApp)
- Real-time balance display
- Recent transactions list
- Quick actions (Send, Request, Scan QR)
- Spending overview charts
- Daily insights card

### AI Analysis Tab
- **Overview**: Spending patterns, predictions, budget rebalancing
- **Predictions**: Income forecasting, spending trends, financial alerts
- Interactive multi-line category charts
- Gig worker income volatility tracking

### Piggy Banks Tab
- Create and manage multiple savings goals
- Visual progress tracking with charts
- AI coach for savings optimization
- Autonomous allocation suggestions
- Goal completion celebrations

### Investments Tab
- Personalized risk profiling
- AI-curated fund recommendations
- Real-time NAV tracking
- Portfolio health score
- Smart SIP allocation
- Insurance recommendations
- Personality-based strategies

## 🔐 Environment Variables

Create a `.env` file with the following variables:

```env
# Gemini AI API Key (Required)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration (Optional - for backend features)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📸 Screenshots

> Add screenshots of your app here

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Development Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Run linter
npm run lint

# Reset project (clean start)
npm run reset-project
```

## 🐛 Known Issues & Limitations

- QR code scanning requires camera permissions
- Some AI features require active internet connection
- Mutual fund data fetched from public API (mfapi.in)
- Investment recommendations are for educational purposes only

## 🔮 Future Enhancements

- [ ] Bill payment integration
- [ ] Expense splitting with friends
- [ ] Recurring transaction automation
- [ ] Export transactions to CSV/PDF
- [ ] Biometric authentication
- [ ] Dark/Light theme toggle
- [ ] Advanced budgeting tools
- [ ] Credit score tracking
- [ ] Tax calculation assistance



## 👥 Team

**FinMate Group**
- Apurva Kirve - Lead Developer

## 🙏 Acknowledgments

- Google Gemini AI for powering intelligent features
- Expo team for the amazing development platform
- React Native community for excellent libraries
- Mutual Fund API (mfapi.in) for fund data

## 📞 Support

For support, email kirveapurva3806@gmail.com or open an issue in the repository.

---

**Note**: This application is for educational and personal finance management purposes. Investment recommendations should not be considered as financial advice. Always consult with a certified financial advisor before making investment decisions.

Made with ❤️ by the FinMate Team#
