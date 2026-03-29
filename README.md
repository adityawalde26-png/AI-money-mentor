# 🧠 AI Money Mentor

> **ET AI Hackathon 2026 — Problem Statement 9**
> AI-powered conversational personal finance mentor that makes financial planning as accessible as chatting with a friend.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

🔗 **Live Demo:** [velvety-daifuku-df353f.netlify.app](https://velvety-daifuku-df353f.netlify.app/)

---

## 🎯 Problem

95% of Indians don't have a financial plan. Financial advisors charge ₹25,000+/year and serve only HNIs. India has 14 Cr+ demat accounts — but most retail investors lose ₹15,000-40,000/year just from picking the wrong tax regime.

**AI Money Mentor** replaces the human advisor with a conversational AI that understands natural language, collects data through chat, and generates personalized financial analysis — completely free.

---

## 🚀 How It Works

This is a **chat-first** financial planning app. No forms, no dashboards upfront — just a conversation.

1. **Onboarding** — Name, age, biggest financial concern (3 steps)
2. **Chat with AI** — Type naturally: "help me plan retirement", "I earn 12 lakh which regime?", "got a 5 lakh bonus"
3. **AI collects data** — Asks questions one-by-one in chat. Understands "1.2 lakh", "50k", "none", "nahi"
4. **Dashboard appears** — Visual results with plain-English explanations for every metric
5. **AI Analysis** — Google Gemini generates a unique, personalized insight based on your numbers
6. **Back to Chat** — Summary + next steps. Explore another module or ask follow-up questions

---

## 🧠 AI Integration

AI is the **backbone**, not a feature:

| AI Layer | Technology | What It Does |
|----------|-----------|--------------|
| Conversational Chat | Google Gemini 2.0 Flash | Natural language financial advice, context-aware follow-ups |
| Intent Detection | Custom NLP + regex | Detects what user needs, routes to correct module automatically |
| Data Collection | Conversational flow engine | Asks inputs one-by-one in chat, parses natural language amounts |
| Result Analysis | Google Gemini 2.0 Flash | Generates unique personalized insight from computed results |

---

## 📦 Six Modules

| Module | What It Does |
|--------|-------------|
| 💊 **Money Health Score** | 5-minute quiz across 6 dimensions with AI-generated recommendations |
| 🧾 **Tax Wizard** | Old vs New regime comparison (FY 2025-26), missed deduction detection |
| 🔥 **FIRE Path Planner** | Retirement corpus calculator with SIP target and asset allocation |
| 🔬 **MF Portfolio X-Ray** | Mutual fund overlap detection, expense ratio drag, alpha vs benchmark |
| 💑 **Couple's Money Planner** | Dual-income tax optimization, SIP splits, joint insurance planning |
| 🎯 **Life Event Advisor** | Action plans for bonus, marriage, new baby, inheritance |

---

## 🗣️ Natural Language Understanding

The app understands how Indians actually talk about money:

| You Type | System Understands |
|----------|-------------------|
| "1.2 lakh", "1.5 lac", "one lakh" | ₹1,20,000 / ₹1,50,000 / ₹1,00,000 |
| "50k", "80 thousand", "50 hazar" | ₹50,000 / ₹80,000 / ₹50,000 |
| "1.5 crore", "2 cr" | ₹1,50,00,000 / ₹2,00,00,000 |
| "12 lpa" | ₹12,00,000 |
| "none", "nahi", "nil", "nothing" | 0 |
| "retirment", "taks" | Routes to FIRE / Tax (typo-tolerant) |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────┐
│     React SPA — Chat-First Interface     │
│  Landing → Onboarding → Chat → Dashboard │
└────────────────────┬─────────────────────┘
                     │ Natural language
              ┌──────▼──────┐
              │ Google       │
              │ Gemini 2.0   │  Chat + AI Analysis
              │ Flash API    │
              └──────┬──────┘
                     │ Intent + parsed data
              ┌──────▼──────┐
              │ Flow Engine  │  parseINR() + step-by-step Q&A
              └──────┬──────┘
                     │ Structured data
    ┌────┬─────┬─────┼─────┬──────┬────┐
    ▼    ▼     ▼     ▼     ▼      ▼    
  Health Tax  FIRE  MF   Couple  Life
  Score  Wiz  Plan  XRay Plan    Event
    │    │     │     │     │      │
    └────┴─────┴─────┼─────┴──────┘
                     │ Results
              ┌──────▼──────┐
              │ Gemini AI    │  Personalized analysis
              │ Analysis     │  (unique per user)
              └─────────────┘
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Git

### Run Locally

```bash
git clone https://github.com/adityawalde26-png/AI-money-mentor.git
cd AI-money-mentor
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
AI-money-mentor/
├── src/
│   ├── App.jsx          # Complete application (all 6 modules + AI chat)
│   └── main.jsx         # Entry point
├── docs/
│   ├── architecture_document.docx
│   └── impact_model.docx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 📊 Impact Model

| Metric | Conservative | Base Case | Optimistic |
|--------|-------------|-----------|------------|
| Tax savings / year | ₹125 Cr | ₹1,250 Cr | ₹2,500 Cr |
| New SIP inflows / year | ₹180 Cr | ₹1,800 Cr | ₹3,600 Cr |
| 10-year wealth created | ₹3,450 Cr | ₹34,500 Cr | ₹69,000 Cr |
| Advisory cost replaced | ₹125 Cr | ₹1,250 Cr | ₹2,500 Cr |
| AI cost (Gemini) | ₹7.5L/yr | ₹75L/yr | ₹1.5Cr/yr |
| **ROI** | **1,600x** | **16,000x** | **32,000x** |

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + Hooks |
| AI / LLM | Google Gemini 2.0 Flash (free API) |
| NLP | Custom parseINR() + regex intent matching |
| Computation | Client-side JavaScript (zero latency) |
| Hosting | Netlify (free, global CDN) |
| Version Control | Git + GitHub |

---

## 📝 License

MIT License

---

**Built for ET AI Hackathon 2026 | Problem Statement 9 — AI Money Mentor**
