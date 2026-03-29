import { useState, useEffect, useRef } from "react";

const MODULES = {
  health: { name: "Money Health Score", icon: "💊", desc: "5-min check-up across 6 financial dimensions", color: "#10B981" },
  tax: { name: "Tax Wizard", icon: "🧾", desc: "Find missing deductions, compare tax regimes", color: "#F59E0B" },
  fire: { name: "FIRE Path Planner", icon: "🔥", desc: "Month-by-month roadmap to financial independence", color: "#EF4444" },
  mf: { name: "MF Portfolio X-Ray", icon: "🔬", desc: "Overlap analysis, XIRR, rebalancing", color: "#8B5CF6" },
  couple: { name: "Couple's Money Planner", icon: "💑", desc: "Optimize across both incomes", color: "#EC4899" },
  life: { name: "Life Event Advisor", icon: "🎯", desc: "Bonus, marriage, baby — what to do with money", color: "#06B6D4" },
};

// ─── MUTUAL FUND DATABASE ───
const MF_DATABASE = {
  "HDFC Top 100 Fund": { category: "Large Cap", expenseRatio: 1.62, benchmark: "Nifty 100", topHoldings: ["HDFC Bank", "ICICI Bank", "Reliance", "Infosys", "TCS", "L&T", "Bharti Airtel", "SBI", "Axis Bank", "ITC"], returns: { "1y": 14.2, "3y": 12.8, "5y": 15.1 }, benchmarkReturns: { "1y": 13.5, "3y": 12.1, "5y": 14.3 } },
  "ICICI Pru Bluechip Fund": { category: "Large Cap", expenseRatio: 1.58, benchmark: "Nifty 100", topHoldings: ["ICICI Bank", "HDFC Bank", "Reliance", "Infosys", "L&T", "TCS", "Bharti Airtel", "SBI", "Maruti", "HUL"], returns: { "1y": 13.8, "3y": 13.1, "5y": 14.7 }, benchmarkReturns: { "1y": 13.5, "3y": 12.1, "5y": 14.3 } },
  "SBI Blue Chip Fund": { category: "Large Cap", expenseRatio: 1.55, benchmark: "Nifty 100", topHoldings: ["HDFC Bank", "Reliance", "ICICI Bank", "TCS", "Infosys", "Bharti Airtel", "L&T", "SBI", "HUL", "Kotak Bank"], returns: { "1y": 12.9, "3y": 11.5, "5y": 13.8 }, benchmarkReturns: { "1y": 13.5, "3y": 12.1, "5y": 14.3 } },
  "Axis Midcap Fund": { category: "Mid Cap", expenseRatio: 1.72, benchmark: "Nifty Midcap 150", topHoldings: ["Persistent Systems", "Cholamandalam", "Voltas", "Supreme Industries", "APL Apollo", "PI Industries", "Astral", "Coforge", "Sundaram Finance", "CG Power"], returns: { "1y": 18.5, "3y": 16.2, "5y": 19.8 }, benchmarkReturns: { "1y": 17.2, "3y": 15.8, "5y": 18.1 } },
  "Kotak Small Cap Fund": { category: "Small Cap", expenseRatio: 1.78, benchmark: "Nifty Smallcap 250", topHoldings: ["Cyient", "Blue Star", "Carborundum", "Century Ply", "Galaxy Surfactants", "Ratnamani Metals", "KPIT Tech", "IIFL Finance", "Navin Fluorine", "KEI Industries"], returns: { "1y": 22.1, "3y": 19.5, "5y": 24.3 }, benchmarkReturns: { "1y": 20.5, "3y": 18.2, "5y": 22.1 } },
  "Mirae Asset Large Cap": { category: "Large Cap", expenseRatio: 1.53, benchmark: "Nifty 100", topHoldings: ["HDFC Bank", "ICICI Bank", "Reliance", "Infosys", "TCS", "Bharti Airtel", "L&T", "Axis Bank", "SBI", "HUL"], returns: { "1y": 14.5, "3y": 13.4, "5y": 15.6 }, benchmarkReturns: { "1y": 13.5, "3y": 12.1, "5y": 14.3 } },
  "Parag Parikh Flexi Cap": { category: "Flexi Cap", expenseRatio: 1.33, benchmark: "Nifty 500", topHoldings: ["HDFC Bank", "ICICI Bank", "Alphabet", "Microsoft", "Amazon", "Bajaj Holdings", "ITC", "Coal India", "Power Grid", "HCL Tech"], returns: { "1y": 16.8, "3y": 15.9, "5y": 18.2 }, benchmarkReturns: { "1y": 14.8, "3y": 13.5, "5y": 15.9 } },
  "Nippon India Small Cap": { category: "Small Cap", expenseRatio: 1.82, benchmark: "Nifty Smallcap 250", topHoldings: ["KPIT Tech", "Tube Investments", "Karur Vysya Bank", "Apar Industries", "Emami", "Multi Commodity Exchange", "Kalpataru Projects", "CDSL", "Radico Khaitan", "EIH"], returns: { "1y": 24.3, "3y": 22.1, "5y": 26.5 }, benchmarkReturns: { "1y": 20.5, "3y": 18.2, "5y": 22.1 } },
};
const ALL_FUND_NAMES = Object.keys(MF_DATABASE);

function analyzePortfolio(selectedFunds) {
  const funds = selectedFunds.map(f => ({ name: f.name, invested: f.invested, data: MF_DATABASE[f.name] })).filter(f => f.data);
  if (funds.length === 0) return null;
  const totalInvested = funds.reduce((s, f) => s + f.invested, 0);
  const categoryAlloc = {};
  funds.forEach(f => { const cat = f.data.category; categoryAlloc[cat] = (categoryAlloc[cat] || 0) + f.invested; });
  const overlapPairs = [];
  for (let i = 0; i < funds.length; i++) {
    for (let j = i + 1; j < funds.length; j++) {
      const h1 = new Set(funds[i].data.topHoldings); const h2 = new Set(funds[j].data.topHoldings);
      const common = [...h1].filter(x => h2.has(x));
      if (common.length > 0) overlapPairs.push({ fund1: funds[i].name, fund2: funds[j].name, overlapPct: Math.round((common.length / 10) * 100), commonStocks: common });
    }
  }
  overlapPairs.sort((a, b) => b.overlapPct - a.overlapPct);
  const weightedExpense = funds.reduce((s, f) => s + f.data.expenseRatio * (f.invested / totalInvested), 0);
  const expenseDrag = totalInvested * (Math.pow(1 + weightedExpense / 100, 10) - 1);
  const weightedReturn = funds.reduce((s, f) => s + f.data.returns["3y"] * (f.invested / totalInvested), 0);
  const weightedBenchmark = funds.reduce((s, f) => s + f.data.benchmarkReturns["3y"] * (f.invested / totalInvested), 0);
  const alpha = weightedReturn - weightedBenchmark;
  const suggestions = [];
  const largeCap = (categoryAlloc["Large Cap"] || 0) / totalInvested * 100;
  const smallCap = (categoryAlloc["Small Cap"] || 0) / totalInvested * 100;
  if (largeCap > 70) suggestions.push("Portfolio is heavily large-cap skewed (" + Math.round(largeCap) + "%). Consider adding mid-cap or flexi-cap exposure for growth.");
  if (smallCap > 40) suggestions.push("Small-cap allocation is " + Math.round(smallCap) + "% — high risk. Consider rebalancing 10-15% to large-cap or debt for stability.");
  if (overlapPairs.some(p => p.overlapPct >= 60)) suggestions.push("High overlap detected between funds. Consider replacing one fund to reduce redundancy and improve diversification.");
  if (weightedExpense > 1.7) suggestions.push("Weighted expense ratio is " + weightedExpense.toFixed(2) + "% — above average. Consider index funds (0.1-0.3%) for core large-cap allocation.");
  if (alpha < 0) suggestions.push("Portfolio is underperforming benchmark by " + Math.abs(alpha).toFixed(1) + "%. Review underperformers and consider switching to index funds.");
  if (suggestions.length === 0) suggestions.push("Portfolio looks well-balanced. Continue regular rebalancing and review annually.");
  return { totalInvested, categoryAlloc, overlapPairs, weightedExpense, expenseDrag: Math.round(expenseDrag), weightedReturn, weightedBenchmark, alpha, suggestions, funds };
}

// ─── HEALTH SCORE ───
const healthQuestions = [
  { id: "emergency", dimension: "Emergency Preparedness", q: "How many months of expenses do you have saved in a liquid emergency fund?", options: [{ label: "Less than 1 month", score: 1 }, { label: "1–3 months", score: 4 }, { label: "3–6 months", score: 7 }, { label: "More than 6 months", score: 10 }] },
  { id: "emergency2", dimension: "Emergency Preparedness", q: "Where is your emergency fund kept?", options: [{ label: "Savings account only", score: 4 }, { label: "Mix of savings + liquid/overnight fund", score: 9 }, { label: "Fixed deposits (locked)", score: 5 }, { label: "I don't have one", score: 1 }] },
  { id: "insurance1", dimension: "Insurance Coverage", q: "Do you have a term life insurance policy?", options: [{ label: "Yes, cover ≥ 10x annual income", score: 10 }, { label: "Yes, but cover is less than 10x", score: 6 }, { label: "Only employer-provided cover", score: 3 }, { label: "No life insurance", score: 1 }] },
  { id: "insurance2", dimension: "Insurance Coverage", q: "What's your health insurance situation?", options: [{ label: "Personal policy ≥ ₹10L + top-up", score: 10 }, { label: "Personal policy < ₹10L", score: 6 }, { label: "Only employer coverage", score: 3 }, { label: "No health insurance", score: 1 }] },
  { id: "invest1", dimension: "Investment Diversification", q: "How are your investments spread?", options: [{ label: "Equity + Debt + Gold/REITs (diversified)", score: 10 }, { label: "Mostly equity (MF/stocks)", score: 6 }, { label: "Only FDs and savings", score: 3 }, { label: "I don't invest", score: 1 }] },
  { id: "invest2", dimension: "Investment Diversification", q: "Do you have a Systematic Investment Plan (SIP) running?", options: [{ label: "Yes, ≥ 20% of income", score: 10 }, { label: "Yes, 10–20% of income", score: 7 }, { label: "Yes, but < 10% of income", score: 4 }, { label: "No SIPs", score: 1 }] },
  { id: "debt1", dimension: "Debt Health", q: "What's your total EMI-to-income ratio?", options: [{ label: "No EMIs / loans", score: 10 }, { label: "Less than 30%", score: 7 }, { label: "30–50%", score: 4 }, { label: "More than 50%", score: 1 }] },
  { id: "debt2", dimension: "Debt Health", q: "Do you carry credit card debt month to month?", options: [{ label: "Never — always full payment", score: 10 }, { label: "Occasionally", score: 5 }, { label: "Regularly carry balance", score: 2 }, { label: "Minimum payment only", score: 1 }] },
  { id: "tax1", dimension: "Tax Efficiency", q: "Do you actively plan your taxes before March?", options: [{ label: "Yes, I maximize 80C + 80D + NPS + HRA", score: 10 }, { label: "I use some deductions but not all", score: 6 }, { label: "I only do 80C (ELSS/PPF/LIC)", score: 4 }, { label: "No tax planning", score: 1 }] },
  { id: "tax2", dimension: "Tax Efficiency", q: "Have you compared Old vs New tax regime for your income?", options: [{ label: "Yes, I chose the optimal one", score: 10 }, { label: "I compared but wasn't sure", score: 5 }, { label: "No, I go with the default", score: 2 }, { label: "I don't know the difference", score: 1 }] },
  { id: "retire1", dimension: "Retirement Readiness", q: "Do you have a retirement corpus target in mind?", options: [{ label: "Yes, calculated with inflation", score: 10 }, { label: "Rough idea but not calculated", score: 5 }, { label: "I'll figure it out later", score: 2 }, { label: "Haven't thought about it", score: 1 }] },
  { id: "retire2", dimension: "Retirement Readiness", q: "Are you contributing to any retirement-specific instruments (NPS, PPF, EPF voluntary)?", options: [{ label: "Yes, multiple instruments", score: 10 }, { label: "Only EPF (mandatory)", score: 5 }, { label: "Only PPF", score: 6 }, { label: "Nothing beyond EPF", score: 3 }] },
];
const dimensionWeights = { "Emergency Preparedness": 0.2, "Insurance Coverage": 0.2, "Investment Diversification": 0.2, "Debt Health": 0.15, "Tax Efficiency": 0.1, "Retirement Readiness": 0.15 };

function computeHealthScore(answers) {
  const dimScores = {}, dimCounts = {};
  healthQuestions.forEach((hq) => { const ans = answers[hq.id]; if (ans !== undefined) { if (!dimScores[hq.dimension]) { dimScores[hq.dimension] = 0; dimCounts[hq.dimension] = 0; } dimScores[hq.dimension] += ans; dimCounts[hq.dimension] += 1; } });
  const dimAverages = {}; let weightedTotal = 0, totalWeight = 0;
  Object.keys(dimScores).forEach((dim) => { dimAverages[dim] = dimScores[dim] / dimCounts[dim]; weightedTotal += dimAverages[dim] * (dimensionWeights[dim] || 0.167); totalWeight += dimensionWeights[dim] || 0.167; });
  return { overall: Math.round(totalWeight > 0 ? (weightedTotal / totalWeight) * 10 : 0), dimAverages };
}
function getScoreColor(s) { return s >= 75 ? "#10B981" : s >= 50 ? "#F59E0B" : s >= 30 ? "#F97316" : "#EF4444"; }
function getScoreLabel(s) { return s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Needs Work" : s >= 20 ? "At Risk" : "Critical"; }
function getRecommendations(dimAverages) {
  const recs = [];
  const highRec = { "Emergency Preparedness": "Build a 6-month emergency fund in a liquid mutual fund. Start with ₹5,000/month SIP into a liquid fund today.", "Insurance Coverage": "Get term life insurance (≥10x annual income) and personal health policy (≥₹10L with super top-up). Don't rely on employer coverage alone.", "Investment Diversification": "Start a diversified SIP: 60% equity index fund, 20% debt fund, 20% gold ETF. Even ₹3,000/month split this way builds real wealth.", "Debt Health": "Focus on eliminating high-interest debt first — credit cards (36%+) before personal loans before home loan. Use the avalanche method.", "Tax Efficiency": "Compare old vs new regime with your actual numbers. Claim 80C (₹1.5L), 80D (health insurance), 80CCD(1B) (₹50K NPS), and HRA.", "Retirement Readiness": "Calculate retirement corpus: monthly expenses × 12 × 25 (4% rule), adjusted for inflation. Start NPS Tier-1 for extra ₹50K tax benefit." };
  const medRec = { "Emergency Preparedness": "Push emergency fund to 6 months in a liquid/overnight fund for instant access.", "Insurance Coverage": "Review cover adequacy. Term cover ≥ 10x income. Add a super top-up health plan.", "Investment Diversification": "Consider adding international equity (Nasdaq 100 fund) and REITs for diversification.", "Tax Efficiency": "Check if NPS (80CCD1B) and health insurance (80D) are being claimed. Compare regimes annually." };
  Object.entries(dimAverages).forEach(([dim, avg]) => { if (avg < 5 && highRec[dim]) recs.push({ dim, priority: "HIGH", text: highRec[dim] }); else if (avg < 7 && medRec[dim]) recs.push({ dim, priority: "MEDIUM", text: medRec[dim] }); });
  recs.sort((a, b) => ({ HIGH: 0, MEDIUM: 1 }[a.priority] - { HIGH: 0, MEDIUM: 1 }[b.priority]));
  return recs;
}

// ─── TAX ───
function computeTax(income, deductions, regime) {
  if (regime === "old") {
    const totalDeductions = (deductions.sec80c || 0) + (deductions.sec80d || 0) + (deductions.nps80ccd || 0) + (deductions.hra || 0) + 75000;
    const taxableIncome = Math.max(0, income - totalDeductions);
    let tax = 0;
    if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
    if (Math.min(taxableIncome, 1500000) > 1250000) tax += (Math.min(taxableIncome, 1500000) - 1250000) * 0.25;
    if (Math.min(taxableIncome, 1250000) > 1000000) tax += (Math.min(taxableIncome, 1250000) - 1000000) * 0.20;
    if (Math.min(taxableIncome, 1000000) > 750000) tax += (Math.min(taxableIncome, 1000000) - 750000) * 0.15;
    if (Math.min(taxableIncome, 750000) > 500000) tax += (Math.min(taxableIncome, 750000) - 500000) * 0.10;
    if (Math.min(taxableIncome, 500000) > 250000) tax += (Math.min(taxableIncome, 500000) - 250000) * 0.05;
    return { taxableIncome, tax: Math.round(tax), totalDeductions };
  } else {
    const taxableIncome = Math.max(0, income - 75000);
    let tax = 0;
    if (taxableIncome > 2400000) tax += (taxableIncome - 2400000) * 0.30;
    if (Math.min(taxableIncome, 2400000) > 2000000) tax += (Math.min(taxableIncome, 2400000) - 2000000) * 0.25;
    if (Math.min(taxableIncome, 2000000) > 1600000) tax += (Math.min(taxableIncome, 2000000) - 1600000) * 0.20;
    if (Math.min(taxableIncome, 1600000) > 1200000) tax += (Math.min(taxableIncome, 1600000) - 1200000) * 0.15;
    if (Math.min(taxableIncome, 1200000) > 800000) tax += (Math.min(taxableIncome, 1200000) - 800000) * 0.10;
    if (Math.min(taxableIncome, 800000) > 400000) tax += (Math.min(taxableIncome, 800000) - 400000) * 0.05;
    if (taxableIncome <= 1200000) tax = Math.max(0, tax - 60000);
    return { taxableIncome, tax: Math.round(tax), totalDeductions: 75000 };
  }
}

// ─── FIRE ───
function computeFIRE(age, monthlyIncome, monthlyExpenses, currentSavings, targetAge, inflation, returnRate) {
  const yearsToRetire = targetAge - age;
  const futureAnnualExpense = monthlyExpenses * 12 * Math.pow(1 + inflation / 100, yearsToRetire);
  const corpusNeeded = futureAnnualExpense * 25;
  const fvCurrent = currentSavings * Math.pow(1 + returnRate / 100, yearsToRetire);
  const gap = corpusNeeded - fvCurrent;
  const monthlyRate = returnRate / 100 / 12;
  const months = yearsToRetire * 12;
  let monthlySIP = 0;
  if (gap > 0 && monthlyRate > 0) monthlySIP = gap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  return { corpusNeeded: Math.round(corpusNeeded), futureAnnualExpense: Math.round(futureAnnualExpense), fvCurrentSavings: Math.round(fvCurrent), gap: Math.round(Math.max(0, gap)), monthlySIP: Math.round(monthlySIP), yearsToRetire, savingsRate: Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) };
}

// ─── COUPLE ───
function computeCouplePlan(p1, p2) {
  const p1Old = computeTax(p1.income, { sec80c: p1.sec80c, sec80d: p1.sec80d, nps80ccd: p1.nps, hra: p1.hra }, "old");
  const p1New = computeTax(p1.income, {}, "new");
  const p2Old = computeTax(p2.income, { sec80c: p2.sec80c, sec80d: p2.sec80d, nps80ccd: p2.nps, hra: p2.hra }, "old");
  const p2New = computeTax(p2.income, {}, "new");
  const p1Best = p1Old.tax < p1New.tax ? "old" : "new";
  const p2Best = p2Old.tax < p2New.tax ? "old" : "new";
  const p1Tax = Math.min(p1Old.tax, p1New.tax);
  const p2Tax = Math.min(p2Old.tax, p2New.tax);
  const combinedIncome = p1.income + p2.income;
  const combinedTax = p1Tax + p2Tax;
  const combinedPostTax = combinedIncome - combinedTax;
  const monthlySaving = (combinedPostTax / 12) - p1.expenses - p2.expenses;
  const p1Ratio = p1.income / combinedIncome;
  const hraAdvice = [];
  if (p1.hra > 0 && p2.hra > 0) hraAdvice.push("Both claim HRA. Ensure rent agreement is in the higher-income partner's name for maximum benefit.");
  else if (p1.hra === 0 && p2.hra === 0) hraAdvice.push("Neither claims HRA. If you pay rent, one partner should claim HRA under old regime.");
  const npsAdvice = [];
  if (p1Best === "old" && (p1.nps || 0) < 50000) npsAdvice.push("Partner 1: maximize NPS 80CCD(1B) to ₹50,000 for additional tax savings.");
  if (p2Best === "old" && (p2.nps || 0) < 50000) npsAdvice.push("Partner 2: maximize NPS 80CCD(1B) to ₹50,000 for additional tax savings.");
  const insuranceAdvice = [
    `Term cover: P1 ≥ ₹${Math.round(p1.income * 10 / 100000)}L, P2 ≥ ₹${Math.round(p2.income * 10 / 100000)}L (10x income each).`,
    "Get a family floater health policy of ₹10-15L + individual super top-ups of ₹25-50L each."
  ];
  return { p1: { income: p1.income, bestRegime: p1Best, tax: p1Tax }, p2: { income: p2.income, bestRegime: p2Best, tax: p2Tax }, combinedIncome, combinedTax, combinedPostTax, monthlySavingCapacity: Math.round(monthlySaving), hraAdvice, npsAdvice, insuranceAdvice, sipSuggestion: { p1Sip: Math.round(monthlySaving * 0.5 * p1Ratio), p2Sip: Math.round(monthlySaving * 0.5 * (1 - p1Ratio)), jointGoals: Math.round(monthlySaving * 0.35), jointEmergency: Math.round(monthlySaving * 0.15) } };
}

// ─── LIFE EVENT ───
const LIFE_EVENTS = {
  bonus: { name: "Got a Bonus", icon: "💰", questions: [{ id: "amount", label: "Bonus Amount (₹)", type: "number" }, { id: "emergencyMonths", label: "Emergency fund (months)", type: "select", options: ["0", "1-3", "3-6", "6+"] }, { id: "hasDebt", label: "High-interest debt?", type: "select", options: ["No debt", "Credit card", "Personal loan", "Both"] }, { id: "hasInsurance", label: "Term + Health insurance?", type: "select", options: ["Yes, both", "Only one", "Neither"] }] },
  marriage: { name: "Getting Married", icon: "💍", questions: [{ id: "budget", label: "Wedding Budget (₹)", type: "number" }, { id: "months", label: "Months until wedding", type: "number" }, { id: "savings", label: "Saved for wedding (₹)", type: "number" }, { id: "combinedIncome", label: "Combined monthly income post-marriage (₹)", type: "number" }] },
  baby: { name: "New Baby", icon: "👶", questions: [{ id: "monthlyIncome", label: "Monthly household income (₹)", type: "number" }, { id: "currentSavings", label: "Current savings (₹)", type: "number" }, { id: "healthInsurance", label: "Health insurance cover (₹)", type: "number" }, { id: "hasLifeInsurance", label: "Term life insurance?", type: "select", options: ["Yes, adequate", "Yes, low cover", "No"] }] },
  inheritance: { name: "Received Inheritance", icon: "🏛️", questions: [{ id: "amount", label: "Inheritance Amount (₹)", type: "number" }, { id: "type", label: "Type", type: "select", options: ["Cash/FD", "Property", "Gold", "Mix"] }, { id: "age", label: "Your age", type: "number" }, { id: "existingInvestments", label: "Existing investments (₹)", type: "number" }] },
};

function getLifeEventAdvice(event, answers) {
  const advice = [];
  if (event === "bonus") {
    const amount = parseInt(answers.amount) || 0;
    if (answers.hasDebt !== "No debt") advice.push({ priority: "HIGH", title: "Clear High-Interest Debt", text: `Allocate ₹${Math.round(amount * 0.4).toLocaleString("en-IN")} (40%) to clearing ${answers.hasDebt}. Credit cards charge 36-42% — no investment beats that.` });
    if (answers.emergencyMonths === "0" || answers.emergencyMonths === "1-3") advice.push({ priority: "HIGH", title: "Build Emergency Fund", text: `Park ₹${Math.round(amount * 0.3).toLocaleString("en-IN")} (30%) in a liquid fund. Target: 6 months of expenses.` });
    if (answers.hasInsurance !== "Yes, both") advice.push({ priority: "HIGH", title: "Get Insurance First", text: "Secure term life (10x income) and health insurance (₹10L+) before investing. ~₹15-20K/year for ₹1Cr term cover." });
    advice.push({ priority: "MEDIUM", title: "Invest Strategically", text: `Invest ₹${Math.round(amount * (answers.hasDebt !== "No debt" ? 0.3 : 0.6)).toLocaleString("en-IN")} via STP: 50% equity index, 30% debt, 20% gold. Don't lump-sum into equity.` });
    advice.push({ priority: "LOW", title: "Guilt-Free Spending", text: `Keep ₹${Math.round(amount * 0.1).toLocaleString("en-IN")} (10%) for yourself — discipline works better when it's not punishing.` });
  }
  if (event === "marriage") {
    const gap = Math.max(0, (parseInt(answers.budget) || 0) - (parseInt(answers.savings) || 0));
    const months = parseInt(answers.months) || 12;
    if (gap > 0) advice.push({ priority: "HIGH", title: "Wedding Savings Plan", text: `Save ₹${Math.round(gap / months).toLocaleString("en-IN")}/month in ultra-short debt fund. Never put wedding money in equity.` });
    advice.push({ priority: "HIGH", title: "Insurance Before Wedding", text: "Both partners: get term life + health insurance BEFORE the wedding. Family floater ₹10-15L essential." });
    advice.push({ priority: "MEDIUM", title: "Post-Marriage Setup", text: `Combined ₹${(parseInt(answers.combinedIncome) || 0).toLocaleString("en-IN")}/month: Joint account for shared expenses, individual for personal. Higher earner claims HRA.` });
    advice.push({ priority: "MEDIUM", title: "Joint Investments", text: "Start joint SIPs split by income ratio. Use our Couple's Planner module for detailed optimization." });
  }
  if (event === "baby") {
    const income = parseInt(answers.monthlyIncome) || 0;
    advice.push({ priority: "HIGH", title: "Expand Emergency Fund", text: `With a baby, need 9-12 months expenses. Target: ₹${(income * 9).toLocaleString("en-IN")}. Current: ₹${(parseInt(answers.currentSavings) || 0).toLocaleString("en-IN")}.` });
    if (answers.hasLifeInsurance !== "Yes, adequate") advice.push({ priority: "HIGH", title: "Increase Life Cover", text: `With dependents, get 15-20x income term cover: ₹${Math.round(income * 12 * 15 / 100000)}L minimum.` });
    if ((parseInt(answers.healthInsurance) || 0) < 1000000) advice.push({ priority: "HIGH", title: "Upgrade Health Cover", text: "Get family floater ₹15-20L with maternity benefit (2-year waiting period applies)." });
    advice.push({ priority: "MEDIUM", title: "Start Education Fund", text: "Education inflation: 10-12%/year. ₹50L in 18 years = ₹5,000/month SIP now. 3-year delay = ₹8,500/month." });
  }
  if (event === "inheritance") {
    const amount = parseInt(answers.amount) || 0;
    const age = parseInt(answers.age) || 30;
    advice.push({ priority: "HIGH", title: "Don't Rush", text: `Park ₹${(amount / 100000).toFixed(0)}L in liquid fund for 3-6 months. Emotional decisions with large sums almost always go wrong.` });
    if (answers.type === "Property") advice.push({ priority: "HIGH", title: "Property Analysis", text: "If rental yield < 3% and no emotional attachment, consider selling. ₹1Cr property at ₹20K/month rent (2.4%) underperforms balanced MF portfolio." });
    if (answers.type === "Gold") advice.push({ priority: "MEDIUM", title: "Gold Optimization", text: "Convert physical gold to Sovereign Gold Bonds: 2.5% annual interest + gold appreciation, tax-free at maturity." });
    const eq = age < 35 ? 60 : age < 45 ? 50 : 40;
    advice.push({ priority: "MEDIUM", title: "Allocation Plan", text: `At age ${age}: ${eq}% equity (via STP over 6 months), ${80 - eq}% debt, 20% gold/alternatives.` });
    advice.push({ priority: "LOW", title: "Tax Note", text: "Inheritance isn't taxed in India, but income from inherited assets IS (rent, interest, capital gains). Consult a CA before selling." });
  }
  return advice;
}

// ─── COMPONENTS ───
function AnimatedScore({ score, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => { let c = 0; const i = setInterval(() => { c += 1; if (c >= score) { setDisplay(score); clearInterval(i); } else setDisplay(c); }, 20); return () => clearInterval(i); }, [score]);
  const circ = 2 * Math.PI * 54, off = circ - (display / 100) * circ;
  return (<div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}><svg width="140" height="140" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a2e" strokeWidth="8" /><circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 0.5s ease" }} /></svg><div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}><div style={{ fontSize: 32, fontWeight: 800, color }}>{display}</div><div style={{ fontSize: 11, color: "#94a3b8", marginTop: -2 }}>/100</div></div></div>);
}
function DimensionBar({ name, score, max = 10 }) {
  const pct = (score / max) * 100, color = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (<div style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}><span style={{ color: "#e2e8f0" }}>{name}</span><span style={{ color, fontWeight: 700 }}>{score.toFixed(1)}/10</span></div><div style={{ height: 8, borderRadius: 4, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 4, background: color, width: `${pct}%`, transition: "width 0.8s ease" }} /></div></div>);
}
function formatINR(n) { if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`; if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`; return `₹${n.toLocaleString("en-IN")}`; }
function InputField({ label, value, onChange, placeholder, suffix }) {
  return (<div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{label}</label><div style={{ position: "relative" }}><input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "10px 14px", paddingRight: suffix ? 40 : 14, background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" }} onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#334155"} />{suffix && <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 13 }}>{suffix}</span>}</div></div>);
}
function SelectField({ label, value, onChange, options }) {
  return (<div style={{ marginBottom: 16 }}><label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" }}><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>);
}
function Card({ children, style = {} }) { return <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 14, padding: "24px 20px", marginBottom: 16, ...style }}>{children}</div>; }
function PriorityBadge({ priority }) { const c = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" }; return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: c[priority], color: "#0a0a1a" }}>{priority}</span>; }

// ─── MAIN APP ───
export default function MoneyMentor() {
  const [screen, setScreen] = useState("landing");
  const [activeModule, setActiveModule] = useState(null);
  const [onboardStep, setOnboardStep] = useState(0);
  const [userProfile, setUserProfile] = useState({ name: "", age: "", concern: "" });
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { setTimeout(() => setHeroVisible(true), 100); }, []);
  const [healthStep, setHealthStep] = useState(0);
  const [healthAnswers, setHealthAnswers] = useState({});
  const [healthResult, setHealthResult] = useState(null);
  const [taxIncome, setTaxIncome] = useState(""); const [tax80c, setTax80c] = useState(""); const [tax80d, setTax80d] = useState(""); const [taxNps, setTaxNps] = useState(""); const [taxHra, setTaxHra] = useState(""); const [taxResult, setTaxResult] = useState(null);
  const [fireAge, setFireAge] = useState(""); const [fireIncome, setFireIncome] = useState(""); const [fireExpenses, setFireExpenses] = useState(""); const [fireSavings, setFireSavings] = useState(""); const [fireTargetAge, setFireTargetAge] = useState("50"); const [fireInflation, setFireInflation] = useState("6"); const [fireReturn, setFireReturn] = useState("12"); const [fireResult, setFireResult] = useState(null);
  const [mfFunds, setMfFunds] = useState([{ name: "", invested: "" }]); const [mfResult, setMfResult] = useState(null);
  const [p1, setP1] = useState({ income: "", expenses: "", sec80c: "", sec80d: "", nps: "", hra: "", savings: "" }); const [p2, setP2] = useState({ income: "", expenses: "", sec80c: "", sec80d: "", nps: "", hra: "", savings: "" }); const [coupleResult, setCoupleResult] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); const [lifeAnswers, setLifeAnswers] = useState({}); const [lifeResult, setLifeResult] = useState(null);
  // AI Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const scrollRef = useRef(null);

  const initChat = (profile) => {
    const concernMap = { "saving_tax": "tax optimization", "retirement": "retirement planning", "investing": "investment strategy", "debt": "debt management", "insurance": "insurance gaps", "general": "overall financial health" };
    const concern = concernMap[profile.concern] || "your finances";
    setChatMessages([{ role: "assistant", content: `Hey ${profile.name}! 👋 Great to meet you.\n\nBased on what you told me, I can see ${concern} is on your mind. That's a smart thing to focus on${profile.age ? " at " + profile.age : ""}.\n\nI'm here to help — ask me anything, or jump into one of the tools below. Here are some things I can help with:\n\n• Personalized tax advice for your income level\n• How much you need to retire comfortably\n• Whether your mutual funds overlap\n• What to do with a bonus, inheritance, or life event\n\nWhat's on your mind?` }]);
  };

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const conversationHistory = newMessages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyA28Vb0Q4jdJ3BGGXllzNVRVNv1jjTmMmM", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are AI Money Mentor, a personal finance advisor built for Indian users. You speak in a warm, friendly tone like a knowledgeable friend who is a financial expert. Keep responses concise (3-5 short paragraphs max). Use the rupee sign for currency. Reference Indian financial instruments: PPF, NPS, ELSS, SIPs, EPF, Section 80C/80D, HRA, old vs new tax regime, etc. When relevant, suggest one of these tools available in the app: Money Health Score (financial health check), Tax Wizard (old vs new regime comparison), FIRE Path Planner (retirement corpus calculator), MF Portfolio X-Ray (mutual fund overlap analysis), Couple's Money Planner (optimize across both incomes), Life Event Advisor (guidance for bonus, marriage, baby, inheritance). Format tool suggestions naturally like: Try our [Tool Name] for this. Never say you cannot help. Always give actionable advice with specific numbers where possible. Be confident, specific, and practical. Do not use markdown formatting like ** or ## in your responses - write in plain text only." }] },
          contents: conversationHistory,
        }),
      });
      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting right now. Please try one of the tools below!";
      setChatMessages([...newMessages, { role: "assistant", content: aiReply }]);
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant", content: "I'm having trouble connecting right now. Please try one of the tools below — they all work offline!" }]);
    }
    setChatLoading(false);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [healthStep, screen, healthResult, taxResult, fireResult, mfResult, coupleResult, lifeResult, selectedEvent]);

  const openModule = (key) => { setActiveModule(key); setScreen("module"); setHealthStep(0); setHealthAnswers({}); setHealthResult(null); setTaxResult(null); setFireResult(null); setMfResult(null); setCoupleResult(null); setLifeResult(null); setSelectedEvent(null); setLifeAnswers({}); setMfFunds([{ name: "", invested: "" }]); };
  const goHome = () => { setScreen("home"); setActiveModule(null); };
  const handleHealthAnswer = (qId, score) => { const na = { ...healthAnswers, [qId]: score }; setHealthAnswers(na); if (healthStep < healthQuestions.length - 1) setTimeout(() => setHealthStep(healthStep + 1), 300); else { const r = computeHealthScore(na); setTimeout(() => setHealthResult({ ...r, recs: getRecommendations(r.dimAverages) }), 400); } };
  const runTaxWizard = () => { const inc = parseInt(taxIncome) || 0; const d = { sec80c: Math.min(parseInt(tax80c) || 0, 150000), sec80d: Math.min(parseInt(tax80d) || 0, 75000), nps80ccd: Math.min(parseInt(taxNps) || 0, 50000), hra: parseInt(taxHra) || 0 }; const o = computeTax(inc, d, "old"); const n = computeTax(inc, {}, "new"); const s = o.tax - n.tax; const md = []; if ((parseInt(tax80c) || 0) < 150000) md.push({ name: "Section 80C", max: 150000, used: parseInt(tax80c) || 0, tip: "ELSS, PPF, EPF, LIC, SCSS, 5-year FD, tuition fees" }); if ((parseInt(tax80d) || 0) < 50000) md.push({ name: "Section 80D", max: 75000, used: parseInt(tax80d) || 0, tip: "Health insurance — self (₹25K) + parents (₹25K-₹50K)" }); if ((parseInt(taxNps) || 0) < 50000) md.push({ name: "80CCD(1B) — NPS", max: 50000, used: parseInt(taxNps) || 0, tip: "Additional ₹50K for NPS, over and above 80C" }); setTaxResult({ oldResult: o, newResult: n, savings: s, better: s > 0 ? "new" : "old", missedDeductions: md }); };
  const runFIRE = () => setFireResult(computeFIRE(parseInt(fireAge) || 25, parseInt(fireIncome) || 0, parseInt(fireExpenses) || 0, parseInt(fireSavings) || 0, parseInt(fireTargetAge) || 50, parseFloat(fireInflation) || 6, parseFloat(fireReturn) || 12));
  const runMF = () => { const sel = mfFunds.filter(f => f.name && f.invested).map(f => ({ name: f.name, invested: parseInt(f.invested) || 0 })); setMfResult(analyzePortfolio(sel)); };
  const runCouple = () => { const mk = (p) => ({ income: parseInt(p.income) || 0, expenses: parseInt(p.expenses) || 0, sec80c: parseInt(p.sec80c) || 0, sec80d: parseInt(p.sec80d) || 0, nps: parseInt(p.nps) || 0, hra: parseInt(p.hra) || 0, savings: parseInt(p.savings) || 0 }); setCoupleResult(computeCouplePlan(mk(p1), mk(p2))); };
  const runLife = () => setLifeResult(getLifeEventAdvice(selectedEvent, lifeAnswers));

  const btnStyle = (color) => ({ marginTop: 8, width: "100%", padding: "14px", background: `linear-gradient(135deg, ${color}, ${color}dd)`, border: "none", borderRadius: 10, color: ["#F59E0B", "#10B981"].includes(color) ? "#0a0a1a" : "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg, #0a0a1a 0%, #0f1629 50%, #0a0a1a 100%)", color: "#e2e8f0", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", position: "relative", overflow: "hidden" }}>
      {[["10%", "70%", "#10B981", 400], ["60%", "10%", "#F59E0B", 350], ["80%", "80%", "#8B5CF6", 300]].map(([t, l, c, s], i) => <div key={i} style={{ position: "fixed", top: t, left: l, width: s, height: s, borderRadius: "50%", background: c, filter: "blur(120px)", opacity: 0.07, pointerEvents: "none", zIndex: 0 }} />)}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "0 20px" }} ref={scrollRef}>
        <div style={{ paddingTop: 40, paddingBottom: 8, textAlign: "center", display: screen === "landing" || screen === "onboard" ? "none" : "block" }}>
          {screen !== "home" && screen !== "landing" && screen !== "onboard" && <button onClick={goHome} style={{ position: "absolute", left: 20, top: 44, background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Back</button>}
          <div style={{ fontSize: 13, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>AI-Powered</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #60a5fa, #10B981, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Money Mentor</h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6, marginBottom: 0 }}>{screen === "home" ? "Your personal AI financial planning assistant" : MODULES[activeModule]?.name}</p>
        </div>

        {/* LANDING PAGE */}
        {screen === "landing" && (<div style={{ paddingTop: 60, paddingBottom: 60, textAlign: "center", minHeight: "85vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <style>{`
            @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
            @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
            @keyframes countUp { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          
          <div style={{ animation: heroVisible ? "fadeUp 0.8s ease forwards" : "none", opacity: heroVisible ? 1 : 0 }}>
            <div style={{ fontSize: 56, marginBottom: 20, animation: "float 3s ease-in-out infinite" }}>🧠</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, margin: "0 0 8px", lineHeight: 1.2, background: "linear-gradient(135deg, #60a5fa, #10B981, #F59E0B, #EC4899)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 4s linear infinite" }}>
              AI Money Mentor
            </h1>
            <p style={{ fontSize: 17, color: "#94a3b8", margin: "0 0 32px", lineHeight: 1.6 }}>
              Your personal AI-powered<br/>financial planning assistant
            </p>
          </div>

          <div style={{ animation: heroVisible ? "fadeUp 0.8s ease 0.3s forwards" : "none", opacity: 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 36, maxWidth: 400, margin: "0 auto 36px" }}>
              {[{ num: "6", label: "AI Tools" }, { num: "₹0", label: "Free Forever" }, { num: "5 min", label: "Full Plan" }].map((s, i) => (
                <div key={i} style={{ padding: "16px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 12 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: ["#60a5fa", "#10B981", "#F59E0B"][i], animation: `countUp 0.5s ease ${0.5 + i * 0.2}s forwards`, opacity: 0 }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ animation: heroVisible ? "fadeUp 0.8s ease 0.6s forwards" : "none", opacity: 0 }}>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>95% of Indians don't have a financial plan.<br/>Let's change that — starting with you.</p>
            <button onClick={() => setScreen("onboard")} style={{
              padding: "16px 48px", background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              border: "none", borderRadius: 14, color: "#fff", fontSize: 17, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 0 40px rgba(37,99,235,0.3)",
              transition: "all 0.3s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 0 60px rgba(37,99,235,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(37,99,235,0.3)"; }}>
              Get Started →
            </button>
          </div>

          <div style={{ marginTop: 48, animation: heroVisible ? "fadeUp 0.8s ease 0.9s forwards" : "none", opacity: 0 }}>
            <div style={{ fontSize: 11, color: "#334155", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Powered by</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
              {["Tax Optimization", "FIRE Planning", "MF Analysis", "Couple Planning", "Life Events"].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: "#475569", padding: "4px 10px", borderRadius: 6, border: "1px solid #1e293b" }}>{t}</span>
              ))}
            </div>
          </div>
        </div>)}

        {/* ONBOARDING */}
        {screen === "onboard" && (<div style={{ paddingTop: 40, paddingBottom: 60, minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }`}</style>
          
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= onboardStep ? "linear-gradient(90deg, #2563eb, #7c3aed)" : "#1e293b", transition: "all 0.4s ease" }} />
              ))}
            </div>
          </div>

          {onboardStep === 0 && (
            <div style={{ animation: "slideIn 0.4s ease" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>👋</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#e2e8f0" }}>What should I call you?</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Let's make this personal.</p>
              <input value={userProfile.name} onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                placeholder="Your first name"
                style={{ width: "100%", padding: "16px 20px", background: "#0f172a", border: "2px solid #334155", borderRadius: 14, color: "#e2e8f0", fontSize: 18, outline: "none", boxSizing: "border-box", textAlign: "center" }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"} onBlur={(e) => e.target.style.borderColor = "#334155"}
                onKeyDown={(e) => { if (e.key === "Enter" && userProfile.name.trim()) setOnboardStep(1); }}
                autoFocus />
              <button onClick={() => { if (userProfile.name.trim()) setOnboardStep(1); }}
                style={{ marginTop: 20, width: "100%", padding: "14px", background: userProfile.name.trim() ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "#1e293b", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: userProfile.name.trim() ? "pointer" : "default", transition: "all 0.3s" }}>
                Continue
              </button>
            </div>
          )}

          {onboardStep === 1 && (
            <div style={{ animation: "slideIn 0.4s ease" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎂</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#e2e8f0" }}>How old are you, {userProfile.name}?</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>This helps me tailor advice to your life stage.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[{ label: "18–25", value: "22", emoji: "🎓" }, { label: "26–35", value: "30", emoji: "💼" }, { label: "36–45", value: "40", emoji: "🏠" }, { label: "46+", value: "50", emoji: "🌅" }].map(opt => (
                  <button key={opt.label} onClick={() => { setUserProfile({ ...userProfile, age: opt.value }); setOnboardStep(2); }}
                    style={{ padding: "20px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid #334155", borderRadius: 14, cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "rgba(37,99,235,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.emoji}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div style={{ animation: "slideIn 0.4s ease" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎯</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#e2e8f0" }}>What's your biggest money worry?</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>I'll prioritize advice around this.</p>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  { label: "Am I paying too much tax?", value: "saving_tax", icon: "🧾" },
                  { label: "Will I have enough to retire?", value: "retirement", icon: "🔥" },
                  { label: "I don't know where to invest", value: "investing", icon: "📈" },
                  { label: "I have loans/debt to manage", value: "debt", icon: "💳" },
                  { label: "Am I insured enough?", value: "insurance", icon: "🛡️" },
                  { label: "Just want a financial check-up", value: "general", icon: "💊" },
                ].map(opt => (
                  <button key={opt.value} onClick={() => {
                    const profile = { ...userProfile, concern: opt.value };
                    setUserProfile(profile);
                    initChat(profile);
                    setScreen("home");
                  }}
                    style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "rgba(255,255,255,0.03)", border: "1px solid #334155", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.background = "rgba(37,99,235,0.08)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <span style={{ fontSize: 24 }}>{opt.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>)}

        {/* HOME */}
        {screen === "home" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          {/* AI CHAT */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 16, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: chatLoading ? "#F59E0B" : "#10B981", animation: chatLoading ? "pulse 1s infinite" : "none" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>AI Money Mentor</span>
              <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>Powered by Claude</span>
            </div>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
            <div style={{ maxHeight: 350, overflowY: "auto", padding: "16px 18px" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                  <div style={{
                    maxWidth: "85%", padding: "12px 16px", borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: msg.role === "user" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
                    border: msg.role === "user" ? "none" : "1px solid #1e293b",
                    fontSize: 13, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap",
                  }}>{msg.content}</div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{ padding: "12px 16px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid #1e293b", fontSize: 13, color: "#64748b" }}>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: "12px 14px", borderTop: "1px solid #1e293b", display: "flex", gap: 10 }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
                placeholder="Ask me anything about your finances..."
                style={{ flex: 1, padding: "10px 14px", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none" }}
                onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#334155"}
              />
              <button onClick={sendChat} disabled={chatLoading}
                style={{ padding: "10px 18px", background: chatLoading ? "#334155" : "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 600, cursor: chatLoading ? "default" : "pointer" }}>
                Send
              </button>
            </div>
          </div>

          {/* MODULE CARDS */}
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>Tools & Calculators</div>
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(MODULES).map(([key, mod]) => (
              <button key={key} onClick={() => openModule(key)} style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.04)", border: "1px solid #334155", borderRadius: 14, padding: "18px 20px", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = mod.color} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${mod.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{mod.icon}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{mod.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{mod.desc}</div></div>
                <span style={{ color: "#64748b", fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "#475569", borderTop: "1px solid #1e293b", paddingTop: 20 }}>Built for ET AI Hackathon 2026 • AI Money Mentor</div>
        </div>)}

        {/* HEALTH SCORE */}
        {screen === "module" && activeModule === "health" && !healthResult && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <div style={{ marginBottom: 24 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}><span>{healthQuestions[healthStep].dimension}</span><span>{healthStep + 1}/{healthQuestions.length}</span></div><div style={{ height: 4, borderRadius: 2, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, background: "#10B981", width: `${((healthStep + 1) / healthQuestions.length) * 100}%`, transition: "width 0.4s ease" }} /></div></div>
          <Card><p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginTop: 0, marginBottom: 20 }}>{healthQuestions[healthStep].q}</p><div style={{ display: "grid", gap: 10 }}>{healthQuestions[healthStep].options.map((opt, i) => (<button key={i} onClick={() => handleHealthAnswer(healthQuestions[healthStep].id, opt.score)} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 10, color: "#e2e8f0", fontSize: 14, cursor: "pointer", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>{opt.label}</button>))}</div></Card>
        </div>)}

        {screen === "module" && activeModule === "health" && healthResult && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <Card style={{ textAlign: "center" }}><AnimatedScore score={healthResult.overall} color={getScoreColor(healthResult.overall)} /><div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: getScoreColor(healthResult.overall) }}>{getScoreLabel(healthResult.overall)}</div><p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Your Financial Health Score</p></Card>
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>DIMENSION BREAKDOWN</h3>{Object.entries(healthResult.dimAverages).map(([d, a]) => <DimensionBar key={d} name={d} score={a} />)}</Card>
          {healthResult.recs.length > 0 && <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>AI RECOMMENDATIONS</h3>{healthResult.recs.map((r, i) => (<div key={i} style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 10, background: r.priority === "HIGH" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${r.priority === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><PriorityBadge priority={r.priority} /><span style={{ fontSize: 12, color: "#94a3b8" }}>{r.dim}</span></div><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{r.text}</p></div>))}</Card>}
          <button onClick={() => { setHealthStep(0); setHealthAnswers({}); setHealthResult(null); }} style={{ width: "100%", padding: "14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ Retake Assessment</button>
        </div>)}

        {/* TAX WIZARD */}
        {screen === "module" && activeModule === "tax" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginTop: 0, marginBottom: 4 }}>Enter Your Details</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>FY 2025-26 • Old vs New regime</p>
            <InputField label="Gross Annual Income (₹)" value={taxIncome} onChange={setTaxIncome} placeholder="e.g. 1200000" />
            <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12, marginTop: 20 }}>Deductions (Old Regime)</div>
            <InputField label="80C — ELSS, PPF, EPF, LIC (max ₹1.5L)" value={tax80c} onChange={setTax80c} placeholder="150000" />
            <InputField label="80D — Health Insurance (max ₹75K)" value={tax80d} onChange={setTax80d} placeholder="25000" />
            <InputField label="80CCD(1B) — NPS (max ₹50K)" value={taxNps} onChange={setTaxNps} placeholder="50000" />
            <InputField label="HRA Exemption" value={taxHra} onChange={setTaxHra} placeholder="180000" />
            <button onClick={runTaxWizard} style={btnStyle("#F59E0B")}>Compare Tax Regimes →</button>
          </Card>
          {taxResult && (<>
            <Card style={{ textAlign: "center" }}><div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{taxResult.better === "new" ? "New Regime saves you" : "Old Regime saves you"}</div><div style={{ fontSize: 36, fontWeight: 800, color: "#10B981" }}>{formatINR(Math.abs(taxResult.savings))}</div><div style={{ display: "inline-block", marginTop: 10, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: taxResult.better === "new" ? "rgba(96,165,250,0.1)" : "rgba(245,158,11,0.1)", color: taxResult.better === "new" ? "#60a5fa" : "#F59E0B" }}>{taxResult.better === "new" ? "NEW REGIME WINS" : "OLD REGIME WINS"}</div></Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>{[{ l: "Old Regime", d: taxResult.oldResult, c: "#F59E0B" }, { l: "New Regime", d: taxResult.newResult, c: "#60a5fa" }].map(r => (<Card key={r.l} style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: r.c, fontWeight: 700, marginBottom: 10 }}>{r.l}</div><div style={{ fontSize: 11, color: "#64748b" }}>Deductions</div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{formatINR(r.d.totalDeductions)}</div><div style={{ fontSize: 11, color: "#64748b" }}>Taxable Income</div><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{formatINR(r.d.taxableIncome)}</div><div style={{ fontSize: 11, color: "#64748b" }}>Tax</div><div style={{ fontSize: 18, fontWeight: 800, color: r.c }}>{formatINR(r.d.tax)}</div></Card>))}</div>
            {taxResult.missedDeductions.length > 0 && <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "20px" }}><h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginTop: 0, marginBottom: 14 }}>⚠ Missed Deductions</h3>{taxResult.missedDeductions.map((d, i) => (<div key={i} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{d.name}</span><span style={{ fontSize: 12, color: "#EF4444" }}>{formatINR(d.used)}/{formatINR(d.max)}</span></div><p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{d.tip}</p></div>))}</div>}
          </>)}
        </div>)}

        {/* FIRE */}
        {screen === "module" && activeModule === "fire" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginTop: 0, marginBottom: 4 }}>FIRE Calculator</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>Financial Independence, Retire Early</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><InputField label="Your Age" value={fireAge} onChange={setFireAge} placeholder="25" suffix="yrs" /><InputField label="Retire At" value={fireTargetAge} onChange={setFireTargetAge} placeholder="50" suffix="yrs" /></div>
            <InputField label="Monthly Income (₹)" value={fireIncome} onChange={setFireIncome} placeholder="100000" />
            <InputField label="Monthly Expenses (₹)" value={fireExpenses} onChange={setFireExpenses} placeholder="50000" />
            <InputField label="Current Savings (₹)" value={fireSavings} onChange={setFireSavings} placeholder="500000" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><InputField label="Inflation" value={fireInflation} onChange={setFireInflation} placeholder="6" suffix="%" /><InputField label="Return" value={fireReturn} onChange={setFireReturn} placeholder="12" suffix="%" /></div>
            <button onClick={runFIRE} style={btnStyle("#EF4444")}>Calculate FIRE Path 🔥</button>
          </Card>
          {fireResult && (<>
            <Card style={{ textAlign: "center" }}><div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Corpus needed</div><div style={{ fontSize: 34, fontWeight: 800, color: "#EF4444" }}>{formatINR(fireResult.corpusNeeded)}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>to retire at {fireTargetAge} (inflation-adjusted)</div></Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>{[{ l: "Years", v: `${fireResult.yearsToRetire} yrs`, c: "#60a5fa" }, { l: "Savings Rate", v: `${fireResult.savingsRate}%`, c: fireResult.savingsRate >= 50 ? "#10B981" : "#F59E0B" }, { l: "Savings (FV)", v: formatINR(fireResult.fvCurrentSavings), c: "#8B5CF6" }, { l: "Gap", v: formatINR(fireResult.gap), c: "#F97316" }].map(i => (<Card key={i.l} style={{ marginBottom: 0 }}><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{i.l}</div><div style={{ fontSize: 18, fontWeight: 800, color: i.c }}>{i.v}</div></Card>))}</div>
            <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: 20, textAlign: "center", marginBottom: 16 }}><div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Monthly SIP Needed</div><div style={{ fontSize: 36, fontWeight: 800, color: "#10B981" }}>{formatINR(fireResult.monthlySIP)}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>at {fireReturn}% return</div></div>
            <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 14 }}>ALLOCATION</h3>{[{ n: "Equity Index (Nifty 50/Next 50)", p: 50, c: "#60a5fa" }, { n: "Mid/Small Cap", p: 20, c: "#8B5CF6" }, { n: "Debt / PPF / EPF", p: 20, c: "#10B981" }, { n: "Gold / International", p: 10, c: "#F59E0B" }].map(a => (<div key={a.n} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "#cbd5e1" }}>{a.n}</span><span style={{ color: a.c, fontWeight: 700 }}>{formatINR(Math.round(fireResult.monthlySIP * a.p / 100))}</span></div><div style={{ height: 6, borderRadius: 3, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, background: a.c, width: `${a.p}%` }} /></div></div>))}</Card>
          </>)}
        </div>)}

        {/* MF X-RAY */}
        {screen === "module" && activeModule === "mf" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#8B5CF6", marginTop: 0, marginBottom: 4 }}>Your Mutual Funds</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>Select funds and enter invested amounts</p>
            {mfFunds.map((fund, idx) => (<div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 120px 36px", gap: 8, marginBottom: 10, alignItems: "end" }}>
              <div><label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Fund {idx + 1}</label><select value={fund.name} onChange={(e) => { const nf = [...mfFunds]; nf[idx].name = e.target.value; setMfFunds(nf); }} style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 12, outline: "none" }}><option value="">Select...</option>{ALL_FUND_NAMES.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
              <div><label style={{ display: "block", fontSize: 11, color: "#64748b", marginBottom: 4 }}>Amount (₹)</label><input type="number" value={fund.invested} onChange={(e) => { const nf = [...mfFunds]; nf[idx].invested = e.target.value; setMfFunds(nf); }} placeholder="100000" style={{ width: "100%", padding: "8px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 12, outline: "none", boxSizing: "border-box" }} /></div>
              {mfFunds.length > 1 && <button onClick={() => setMfFunds(mfFunds.filter((_, i) => i !== idx))} style={{ padding: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#EF4444", cursor: "pointer" }}>×</button>}
            </div>))}
            {mfFunds.length < 6 && <button onClick={() => setMfFunds([...mfFunds, { name: "", invested: "" }])} style={{ marginTop: 8, padding: "8px 16px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, color: "#8B5CF6", fontSize: 13, cursor: "pointer" }}>+ Add Fund</button>}
            <button onClick={runMF} style={{ ...btnStyle("#8B5CF6"), marginTop: 16 }}>Analyze Portfolio 🔬</button>
          </Card>
          {mfResult && (<>
            <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 14 }}>CATEGORY ALLOCATION</h3><div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Total: <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{formatINR(mfResult.totalInvested)}</span></div>
              {Object.entries(mfResult.categoryAlloc).map(([cat, amt]) => { const pct = (amt / mfResult.totalInvested * 100).toFixed(0); const cc = { "Large Cap": "#60a5fa", "Mid Cap": "#8B5CF6", "Small Cap": "#F59E0B", "Flexi Cap": "#10B981" }; return (<div key={cat} style={{ marginBottom: 10 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span>{cat}</span><span style={{ color: cc[cat] || "#94a3b8", fontWeight: 700 }}>{pct}% — {formatINR(amt)}</span></div><div style={{ height: 8, borderRadius: 4, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 4, background: cc[cat] || "#94a3b8", width: `${pct}%` }} /></div></div>); })}</Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <Card style={{ marginBottom: 0, textAlign: "center" }}><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Return (3Y)</div><div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>{mfResult.weightedReturn.toFixed(1)}%</div></Card>
              <Card style={{ marginBottom: 0, textAlign: "center" }}><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Alpha</div><div style={{ fontSize: 22, fontWeight: 800, color: mfResult.alpha >= 0 ? "#10B981" : "#EF4444" }}>{mfResult.alpha >= 0 ? "+" : ""}{mfResult.alpha.toFixed(1)}%</div></Card>
              <Card style={{ marginBottom: 0, textAlign: "center" }}><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Expense Ratio</div><div style={{ fontSize: 22, fontWeight: 800, color: mfResult.weightedExpense > 1.7 ? "#EF4444" : "#F59E0B" }}>{mfResult.weightedExpense.toFixed(2)}%</div></Card>
              <Card style={{ marginBottom: 0, textAlign: "center" }}><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>10Y Expense Drag</div><div style={{ fontSize: 22, fontWeight: 800, color: "#EF4444" }}>{formatINR(mfResult.expenseDrag)}</div></Card>
            </div>
            {mfResult.overlapPairs.length > 0 && <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginTop: 0, marginBottom: 14 }}>⚠ OVERLAP</h3>{mfResult.overlapPairs.map((p, i) => (<div key={i} style={{ marginBottom: 12, padding: "12px", borderRadius: 10, background: p.overlapPct >= 60 ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${p.overlapPct >= 60 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{p.fund1.split(" ").slice(0, 3).join(" ")} ↔ {p.fund2.split(" ").slice(0, 3).join(" ")}</span><span style={{ fontSize: 12, fontWeight: 700, color: p.overlapPct >= 60 ? "#EF4444" : "#F59E0B" }}>{p.overlapPct}%</span></div><div style={{ fontSize: 11, color: "#94a3b8" }}>Common: {p.commonStocks.join(", ")}</div></div>))}</Card>}
            <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#10B981", marginTop: 0, marginBottom: 14 }}>SUGGESTIONS</h3>{mfResult.suggestions.map((s, i) => (<div key={i} style={{ padding: "12px", borderRadius: 10, marginBottom: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{s}</p></div>))}</Card>
          </>)}
        </div>)}

        {/* COUPLE'S PLANNER */}
        {screen === "module" && activeModule === "couple" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          {[{ k: "p1", l: "Partner 1", d: p1, s: setP1, c: "#60a5fa" }, { k: "p2", l: "Partner 2", d: p2, s: setP2, c: "#EC4899" }].map(({ k, l, d, s, c }) => (
            <Card key={k}><h3 style={{ fontSize: 14, fontWeight: 700, color: c, marginTop: 0, marginBottom: 16 }}>{l}</h3>
              <InputField label="Annual Income (₹)" value={d.income} onChange={(v) => s({ ...d, income: v })} placeholder="1200000" />
              <InputField label="Monthly Expenses (₹)" value={d.expenses} onChange={(v) => s({ ...d, expenses: v })} placeholder="40000" />
              <InputField label="Current Savings (₹)" value={d.savings} onChange={(v) => s({ ...d, savings: v })} placeholder="500000" />
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Tax Deductions</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <InputField label="80C" value={d.sec80c} onChange={(v) => s({ ...d, sec80c: v })} placeholder="150000" />
                <InputField label="80D" value={d.sec80d} onChange={(v) => s({ ...d, sec80d: v })} placeholder="25000" />
                <InputField label="NPS" value={d.nps} onChange={(v) => s({ ...d, nps: v })} placeholder="50000" />
                <InputField label="HRA" value={d.hra} onChange={(v) => s({ ...d, hra: v })} placeholder="180000" />
              </div>
            </Card>
          ))}
          <button onClick={runCouple} style={btnStyle("#EC4899")}>Optimize Together 💑</button>
          {coupleResult && (<>
            <Card style={{ textAlign: "center", marginTop: 16 }}><div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Combined Post-Tax Income</div><div style={{ fontSize: 34, fontWeight: 800, color: "#10B981" }}>{formatINR(coupleResult.combinedPostTax)}</div><div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Tax: {formatINR(coupleResult.combinedTax)}/year</div></Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>{[{ l: "Partner 1", r: coupleResult.p1.bestRegime, t: coupleResult.p1.tax, c: "#60a5fa" }, { l: "Partner 2", r: coupleResult.p2.bestRegime, t: coupleResult.p2.tax, c: "#EC4899" }].map(p => (<Card key={p.l} style={{ marginBottom: 0 }}><div style={{ fontSize: 12, color: p.c, fontWeight: 700, marginBottom: 6 }}>{p.l}</div><div style={{ fontSize: 11, color: "#64748b" }}>Best Regime</div><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>{p.r}</div><div style={{ fontSize: 11, color: "#64748b" }}>Tax</div><div style={{ fontSize: 18, fontWeight: 800, color: p.c }}>{formatINR(p.t)}</div></Card>))}</div>
            {coupleResult.monthlySavingCapacity > 0 && <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 14 }}>MONTHLY SPLIT</h3><div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>Capacity: <span style={{ color: "#10B981", fontWeight: 700 }}>{formatINR(coupleResult.monthlySavingCapacity)}</span></div>{[{ n: "P1 Individual SIP", a: coupleResult.sipSuggestion.p1Sip, c: "#60a5fa" }, { n: "P2 Individual SIP", a: coupleResult.sipSuggestion.p2Sip, c: "#EC4899" }, { n: "Joint Goals", a: coupleResult.sipSuggestion.jointGoals, c: "#8B5CF6" }, { n: "Joint Emergency", a: coupleResult.sipSuggestion.jointEmergency, c: "#F59E0B" }].map(i => (<div key={i.n} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e293b" }}><span style={{ fontSize: 13, color: "#cbd5e1" }}>{i.n}</span><span style={{ fontSize: 14, fontWeight: 700, color: i.c }}>{formatINR(i.a)}/mo</span></div>))}</Card>}
            {(coupleResult.hraAdvice.length > 0 || coupleResult.npsAdvice.length > 0) && <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginTop: 0, marginBottom: 14 }}>TAX TIPS</h3>{[...coupleResult.hraAdvice, ...coupleResult.npsAdvice].map((t, i) => (<div key={i} style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 8, background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{t}</p></div>))}</Card>}
            <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#10B981", marginTop: 0, marginBottom: 14 }}>INSURANCE</h3>{coupleResult.insuranceAdvice.map((t, i) => (<div key={i} style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 8, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{t}</p></div>))}</Card>
          </>)}
        </div>)}

        {/* LIFE EVENT */}
        {screen === "module" && activeModule === "life" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          {!selectedEvent && (<><Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#06B6D4", marginTop: 0, marginBottom: 4 }}>What happened?</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 0 }}>Select a life event</p></Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{Object.entries(LIFE_EVENTS).map(([k, e]) => (<button key={k} onClick={() => { setSelectedEvent(k); setLifeAnswers({}); setLifeResult(null); }} style={{ padding: "20px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid #334155", borderRadius: 14, cursor: "pointer", textAlign: "center" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = "#06B6D4"} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}><div style={{ fontSize: 32, marginBottom: 8 }}>{e.icon}</div><div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{e.name}</div></button>))}</div></>)}
          {selectedEvent && !lifeResult && (<Card>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><span style={{ fontSize: 28 }}>{LIFE_EVENTS[selectedEvent].icon}</span><div><h3 style={{ fontSize: 16, fontWeight: 700, color: "#06B6D4", margin: 0 }}>{LIFE_EVENTS[selectedEvent].name}</h3><p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Tell us about your situation</p></div></div>
            {LIFE_EVENTS[selectedEvent].questions.map(q => q.type === "select" ? <SelectField key={q.id} label={q.label} value={lifeAnswers[q.id] || ""} onChange={(v) => setLifeAnswers({ ...lifeAnswers, [q.id]: v })} options={q.options} /> : <InputField key={q.id} label={q.label} value={lifeAnswers[q.id] || ""} onChange={(v) => setLifeAnswers({ ...lifeAnswers, [q.id]: v })} />)}
            <button onClick={runLife} style={btnStyle("#06B6D4")}>Get Action Plan →</button>
            <button onClick={() => { setSelectedEvent(null); setLifeAnswers({}); }} style={{ marginTop: 8, width: "100%", padding: "12px", background: "none", border: "1px solid #334155", borderRadius: 10, color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>← Different Event</button>
          </Card>)}
          {lifeResult && (<>
            <Card style={{ textAlign: "center" }}><span style={{ fontSize: 40 }}>{LIFE_EVENTS[selectedEvent].icon}</span><h3 style={{ fontSize: 18, fontWeight: 700, color: "#06B6D4", margin: "8px 0 4px" }}>Your {LIFE_EVENTS[selectedEvent].name} Plan</h3><p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{lifeResult.length} recommendations</p></Card>
            {lifeResult.map((a, i) => (<Card key={i}><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}><PriorityBadge priority={a.priority} /><span style={{ fontSize: 14, fontWeight: 700 }}>{a.title}</span></div><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.7 }}>{a.text}</p></Card>))}
            <button onClick={() => { setSelectedEvent(null); setLifeAnswers({}); setLifeResult(null); }} style={{ width: "100%", padding: "14px", background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.3)", borderRadius: 10, color: "#06B6D4", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ Try Another Event</button>
          </>)}
        </div>)}
      </div>
    </div>
  );
}
