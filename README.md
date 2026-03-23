# 💰 AI Money Mentor

> **ET AI Hackathon 2026 — Problem Statement 9**
> AI-powered personal finance mentor that makes financial planning as accessible as checking WhatsApp.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🎯 Problem

95% of Indians don't have a financial plan. Financial advisors charge ₹25,000+/year and serve only HNIs. India has 14 Cr+ demat accounts — but most retail investors are flying blind.

**AI Money Mentor** is the intelligence layer that turns confused savers into confident investors.

---

## 🚀 What It Does

A conversational AI-powered personal finance platform with **6 integrated modules**:

| Module | Status | Description |
|--------|--------|-------------|
| 💊 **Money Health Score** | ✅ Live | 5-minute assessment across 6 financial dimensions with personalized AI recommendations |
| 🧾 **Tax Wizard** | ✅ Live | Old vs New regime comparison, missed deduction detection, tax-saving suggestions |
| 🔥 **FIRE Path Planner** | ✅ Live | Retirement corpus calculator, monthly SIP target, asset allocation roadmap |
| 🔬 **MF Portfolio X-Ray** | 🔜 Planned | CAMS/KFintech parsing, XIRR, overlap analysis, rebalancing plan |
| 💑 **Couple's Money Planner** | 🔜 Planned | Dual-income optimization, joint tax planning, combined net worth |
| 🎯 **Life Event Advisor** | 🔜 Planned | Event-triggered financial guidance (marriage, baby, bonus, inheritance) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│          React Single-Page Application       │
│    (Dark Theme • Responsive • Interactive)   │
└──────────────────────┬──────────────────────┘
                       │ User Intent
               ┌───────▼────────┐
               │  Orchestrator  │
               │     Agent      │
               └───────┬────────┘
                       │ Routes to specialized agent
        ┌──────┬───────┼───────┬──────┬───────┐
        ▼      ▼       ▼       ▼      ▼       ▼
    ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐
    │Health││ Tax  ││ FIRE ││MF    ││Couple││Life  │
    │Score ││Wizard││Plnnr ││X-Ray ││Plnnr ││Event │
    └──┬───┘└──┬───┘└──┬───┘└──────┘└──────┘└──────┘
       │       │       │
       ▼       ▼       ▼
    ┌──────────────────────┐    ┌─────────────┐
    │  Computation Engines │    │   LLM API   │
    │  (Tax/FIRE/Scoring)  │    │(Claude/GPT) │
    └──────────────────────┘    └─────────────┘
```

> Full architecture document with detailed agent roles, communication patterns, and error handling: [`docs/architecture_document.pdf`](docs/architecture_document.pdf)

---

## 📊 Impact Model

| Metric | Annual Estimate |
|--------|----------------|
| Tax savings unlocked | ₹1,250 Cr/year |
| New SIP inflows | ₹1,800 Cr/year |
| 10-year wealth creation | ₹34,500 Cr |
| Advisory cost replaced | ₹1,250-2,500 Cr/year |
| Person-hours saved | 12.5 lakh hours/year |

> Full impact model with assumptions and methodology: [`docs/impact_model.pdf`](docs/impact_model.pdf)

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed ([download](https://nodejs.org/))
- Git installed

### Run Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-money-mentor.git
cd ai-money-mentor

# Install dependencies
npm install

# Start development server
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
ai-money-mentor/
├── src/
│   └── App.jsx          # Main application (all modules)
├── docs/
│   ├── architecture_document.pdf
│   └── impact_model.pdf
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🧮 Technical Details

### Money Health Score
- 12 questions across 6 dimensions (Emergency, Insurance, Investment, Debt, Tax, Retirement)
- Weighted scoring algorithm with dimension-specific weights
- AI-generated prioritized recommendations based on score gaps

### Tax Wizard
- Complete FY 2025-26 tax slab implementation (both Old and New regimes)
- Section 87A rebate logic for new regime (up to ₹60K for income ≤ ₹12L)
- Deduction cap enforcement: 80C (₹1.5L), 80D (₹75K), 80CCD1B (₹50K)
- Standard deduction: ₹75,000

### FIRE Path Planner
- 4% withdrawal rule (25x annual expenses) for corpus target
- Inflation-adjusted future expense calculation
- Future Value of Annuity formula for SIP computation
- Suggested asset allocation based on Indian investment instruments

---

## 🔮 Roadmap

- [ ] MF Portfolio X-Ray — CAMS/KFintech PDF parsing, XIRR, overlap detection
- [ ] Couple's Money Planner — dual-income tax optimization
- [ ] Life Event Advisor — event-triggered financial workflows
- [ ] Voice interface — Hindi + regional languages
- [ ] WhatsApp integration — reach Tier 2/3 users

---

## 📝 License

MIT License

---

**Built for ET AI Hackathon 2026 by [Your Name]**
