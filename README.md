📱 FinMate – AI-Powered Personal Finance Manager
FinMate is a modern, AI-powered personal finance management application built with React Native and Expo. It helps users track expenses, manage savings goals, receive investment recommendations, and gain intelligent financial insights powered by Google Gemini AI.
✨ Key Features
💸 Smart Money Management
•	• QR Code Payments with automatic category detection
•	• Real-time transaction tracking
•	• AI-powered category management with learning capabilities
•	• Multi-language support: English, Hindi, Marathi, Gujarati
🐷 Piggy Banks (Savings Goals)
•	• Create multiple savings goals with custom targets
•	• Visual progress tracking with charts
•	• Agentic AI coach for personalized savings advice
•	• Smart insights to optimize savings
📊 AI Financial Analysis
•	• Spending pattern detection (daily, weekly, category-based)
•	• Income forecasting based on historical data
•	• Anomaly detection for unusual spending behavior
•	• AI-powered budget rebalancing suggestions
•	• Gig worker support for irregular income
📈 Investment Recommendations
•	• Risk profiling based on age, income, dependents, and goals
•	• AI-curated mutual fund suggestions
•	• Real-time portfolio health monitoring
•	• Smart SIP allocation across funds
•	• Personalized insurance recommendations
•	• Personality-based “Spirit Animal Investing” strategies
🤖 AI-Powered Features
•	• 24/7 financial chatbot powered by Google Gemini
•	• Predictive analytics for spending and income trends
•	• Context-aware financial insights
•	• Pattern recognition for habits and opportunities
🎨 Modern UI/UX
•	• Sleek dark theme inspired by Google AI Studio
•	• Responsive design for all screen sizes
•	• Smooth animations and micro-interactions
•	• Interactive charts with React Native Chart Kit
🚀 Getting Started
Prerequisites
•	• Node.js (v18+)
•	• npm or yarn
•	• Expo CLI
•	• Android Studio (for Android) or Xcode (for iOS)
•	• Google Gemini API key (https://aistudio.google.com/app/apikey)
Installation
Clone repository:
  git clone https://github.com/swayamgode/finmate-group.git
  cd money-transfer
Install dependencies:
  npm install
Set up environment variables:
  cp .env.example .env
Add your Gemini API key to .env:
  EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
Start development server:
  npx expo start
Run on device:
  - Scan QR code with Expo Go (Android/iOS)
  - Press 'a' → Android emulator
  - Press 'i' → iOS simulator
  - Press 'w' → Web browser
📂 Project Structure
money-transfer/
├── app/
│   ├── (tabs)/
│   │   ├── MoneyTransferApp.tsx
│   │   ├── TransactionAnalysis.tsx
│   │   ├── PiggyBanks.tsx
│   │   ├── InvestmentsTab.tsx
│   │   ├── SignupForm.tsx
│   │   └── RiskProfile.tsx
│   └── _layout.tsx
├── components/
│   ├── AIInsightsDashboard.tsx
│   ├── FinanceBot.tsx
│   ├── PredictionCard.tsx
│   ├── SpendingSnapshot.tsx
│   ├── InsuranceRecommendationsCard.tsx
│   ├── PersonalityInsightCard.tsx
│   └── ui/
├── lib/
│   ├── aiFinancialAnalyzer.ts
│   ├── AgenticInvestmentCoach.ts
│   ├── AgenticPiggyBankCoach.ts
│   ├── PersonalizedRiskProfile.ts
│   ├── FundSearchService.ts
│   ├── InsuranceRecommendation.ts
│   ├── BillTracker.ts
│   ├── CategoryMemoryService.ts
│   └── supabase.ts
├── constants/
│   └── aiStudioTheme.ts
├── types/
├── assets/
└── package.json
🛠️ Technology Stack
•	• Frontend: React Native, Expo, TypeScript, React Navigation, Chart Kit
•	• AI/ML: Google Gemini AI, Custom ML algorithms
•	• Backend: Supabase (PostgreSQL), AsyncStorage
•	• UI/UX: Expo Vector Icons, SVG, Linear Gradient, Reanimated
•	• Additional: QR code scanning/generation, i18n internationalization
🔐 Environment Variables
Required:
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

Optional (Supabase backend):
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
📝 Development Scripts
npm start          # Start dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on Web
npm run lint       # Run linter
npm run reset-project # Clean reset
🐛 Known Issues
•	• QR code scanning requires camera permissions
•	• AI features need active internet connection
•	• Mutual fund data fetched from public API (mfapi.in)
•	• Investment recommendations are educational only (not financial advice)
🔮 Future Enhancements
•	• Bill payment integration
•	• Expense splitting with friends
•	• Recurring transaction automation
•	• Export transactions to CSV/PDF
•	• Biometric authentication
•	• Dark/Light theme toggle
•	• Advanced budgeting tools
•	• Credit score tracking
•	• Tax calculation assistance
👥 Team
FinMate Group
- Swayam Gode – Lead Developer
🙏 Acknowledgments
•	• Google Gemini AI
•	• Expo team
•	• React Native community
•	• Mutual Fund API (mfapi.in)
📞 Support
For support, email kirveapurva3806@gmail.com or open an issue in the repository.
⚠️ Disclaimer
This application is for educational and personal finance management purposes only. Investment recommendations should not be considered financial advice. Always consult a certified financial advisor before making investment decisions.
