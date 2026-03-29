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

function BackToChatBtn({ onClick, label = "← Back to Chat — What's next?" }) {
  return (
    <button onClick={onClick} style={{ marginTop: 16, width: "100%", padding: "16px", background: "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 14, color: "#60a5fa", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(37,99,235,0.2), rgba(124,58,237,0.2))"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.1))"; }}>
      🧠 {label}
    </button>
  );
}

const MODULE_PURPOSE = {
  health: { title: "💊 Money Health Score", what: "A 5-minute financial check-up that scores you across 6 critical dimensions — emergency fund, insurance, investments, debt, taxes, and retirement.", why: "Most people don't know where they stand financially. This gives you a clear picture and tells you exactly what to fix first.", time: "2 min • 12 questions" },
  tax: { title: "🧾 Tax Wizard", what: "Compares your tax under Old vs New regime with your actual numbers, and finds deductions you might be missing.", why: "Picking the wrong tax regime can cost you ₹15,000-₹50,000 per year. Most people guess instead of calculating.", time: "1 min • 5 inputs" },
  fire: { title: "🔥 FIRE Path Planner", what: "Calculates exactly how much money you need to retire, and the monthly SIP required to get there — adjusted for inflation.", why: "Without a number, retirement planning is just wishful thinking. This gives you a concrete, actionable target.", time: "1 min • 5 inputs" },
  mf: { title: "🔬 MF Portfolio X-Ray", what: "Checks if your mutual funds are secretly holding the same stocks, how much fees are eating your returns, and whether you're actually beating the market.", why: "70% of investors own overlapping funds without knowing. You think you're diversified — but your money is concentrated in the same 10 stocks.", time: "1 min • Select your funds" },
  couple: { title: "💑 Couple's Money Planner", what: "Optimizes tax regime, deductions, SIP splits, and insurance across both partners' incomes to maximize savings.", why: "Two-income households can save ₹50,000-₹2,00,000 per year in taxes alone by splitting deductions smartly. Most couples don't optimize.", time: "3 min • Both partners' data" },
  life: { title: "🎯 Life Event Advisor", what: "Gives you a priority-ordered financial action plan for major life events — bonus, marriage, new baby, or inheritance.", why: "When big money moments happen, most people either panic-spend or freeze. This tells you exactly what to do, in what order, with specific amounts.", time: "1 min • Pick event + 4 questions" },
};

function ModulePurpose({ moduleKey }) {
  const p = MODULE_PURPOSE[moduleKey];
  if (!p) return null;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 14, padding: "20px", marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", marginTop: 0, marginBottom: 10 }}>{p.title}</h3>
      <p style={{ fontSize: 13, color: "#cbd5e1", margin: "0 0 10px", lineHeight: 1.6 }}>{p.what}</p>
      <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 10px", lineHeight: 1.6, fontStyle: "italic" }}>Why it matters: {p.why}</p>
      <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
        {p.time}
      </div>
    </div>
  );
}

function AIInsightCard({ insight, loading }) {
  if (!loading && !insight) return null;
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 14, padding: "20px", marginTop: 16, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>🧠</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>AI Analysis</span>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(96,165,250,0.15)", color: "#60a5fa", fontWeight: 600 }}>Powered by Gemini</span>
      </div>
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 16, height: 16, border: "2px solid #334155", borderTopColor: "#60a5fa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#94a3b8" }}>Generating personalized analysis...</span>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{insight}</p>
      )}
    </div>
  );
}

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
  const [aiInsight, setAiInsight] = useState(""); const [aiInsightLoading, setAiInsightLoading] = useState(false);
  // AI Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const scrollRef = useRef(null);

  const initChat = (profile) => {
    const concernMap = { "saving_tax": "tax optimization", "retirement": "retirement planning", "investing": "investment strategy", "debt": "debt management", "insurance": "insurance gaps", "general": "overall financial health" };
    const concern = concernMap[profile.concern] || "your finances";
    setChatMessages([{ role: "assistant", content: `Hey ${profile.name}! 👋 Great to meet you.\n\nI can see ${concern} is on your mind. I'm here to help — just tell me what you'd like to do. For example:\n\n• "Help me plan retirement"\n• "Compare my tax regimes"\n• "I got a 5 lakh bonus"\n• "Check my financial health"\n• Or just ask me any money question!` }]);
  };

  const getAIInsight = async (prompt) => {
    setAiInsight(""); setAiInsightLoading(true);
    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=AIzaSyC6kLXxDF89EWXsUZvlqeoKZ9iOOErCfjk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are AI Money Mentor. Give a personalized, conversational financial analysis in 3-4 short paragraphs. Be specific with numbers. Use plain English, no jargon. Use rupee sign. Reference Indian instruments where relevant. No markdown formatting. Address the user as " + (userProfile.name || "friend") + ", age " + (userProfile.age || "unknown") + "." }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setAiInsight(text);
    } catch (e) {
      setAiInsight("");
    }
    setAiInsightLoading(false);
  };

  // Parse natural language amounts: "1 lakh", "50k", "1.5 crore", "12,00,000", "one lakh", typos
  const parseINR = (text) => {
    const t = text.toLowerCase().replace(/,/g, '').replace(/rs\.?|₹|inr/g, '').replace(/per month|monthly|per year|annual|yearly|pm|pa/g, '').trim();
    // Zero/none/no
    if (t.match(/^(0|zero|none|no|nil|nahi|nah|na|nothing|dont have|don't have|kuch nahi|kuch ni)$/)) return 0;
    // Word numbers
    if (t.match(/\b(one|ek)\b.*\b(lakh|lac|l)\b/)) return 100000;
    if (t.match(/\b(two|do)\b.*\b(lakh|lac|l)\b/)) return 200000;
    if (t.match(/\b(five|panch|paanch)\b.*\b(lakh|lac|l)\b/)) return 500000;
    if (t.match(/\b(ten|das)\b.*\b(lakh|lac|l)\b/)) return 1000000;
    if (t.match(/\b(one|ek)\b.*\b(crore|cr)\b/)) return 10000000;
    // Numeric patterns
    let match;
    match = t.match(/([\d.]+)\s*(crore|cr|cror|crr)/);
    if (match) return Math.round(parseFloat(match[1]) * 10000000);
    match = t.match(/([\d.]+)\s*(lakh|lac|l|lkh|lak|lakhs)\b/);
    if (match) return Math.round(parseFloat(match[1]) * 100000);
    match = t.match(/([\d.]+)\s*(k|thousand|hazar|hazaar)/);
    if (match) return Math.round(parseFloat(match[1]) * 1000);
    match = t.match(/([\d.]+)\s*(lpa|lakhs? per annum)/);
    if (match) return Math.round(parseFloat(match[1]) * 100000);
    // Plain number
    const num = parseFloat(t.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) return Math.round(num);
    // Age-like single/double digit
    const ageNum = parseInt(t.replace(/[^0-9]/g, ''));
    if (!isNaN(ageNum) && ageNum > 0) return ageNum;
    return null;
  };

  // Conversational flow state
  const [chatFlow, setChatFlow] = useState(null); // { type: 'fire'|'tax'|..., step: 0, data: {} }

  const CHAT_FLOWS = {
    fire: {
      steps: [
        { key: "age", q: `What's your current age?`, prefill: () => userProfile.age || null },
        { key: "income", q: "What's your monthly income?  (e.g. '1.2 lakh', '80k', '50000')" },
        { key: "expenses", q: "And your monthly expenses?" },
        { key: "savings", q: "How much do you have saved/invested currently? (total across all investments)" },
        { key: "retireAge", q: "At what age do you want to retire?" },
      ],
    },
    tax: {
      steps: [
        { key: "income", q: "What's your gross annual income? (e.g. '12 lakh', '18 lpa')" },
        { key: "sec80c", q: "How much do you invest under Section 80C? (PPF, ELSS, EPF, LIC — max ₹1.5L)\n\nType 0 if none." },
        { key: "sec80d", q: "Health insurance premium under Section 80D? (self + parents — max ₹75K)\n\nType 0 if none." },
        { key: "nps", q: "Any NPS contribution under 80CCD(1B)? (max ₹50K extra deduction)\n\nType 0 if none." },
        { key: "hra", q: "HRA exemption amount? If you don't pay rent or aren't sure, type 0." },
      ],
    },
    health: { steps: [] },
  };

  const startFlow = (type, msgs) => {
    const flow = CHAT_FLOWS[type];
    if (!flow || flow.steps.length === 0) {
      // For health score and modules without chat flow, open directly
      openModule(type);
      return;
    }
    const prefillVal = flow.steps[0].prefill ? flow.steps[0].prefill() : null;
    if (prefillVal) {
      const data = { [flow.steps[0].key]: prefillVal };
      if (flow.steps.length > 1) {
        setChatFlow({ type, step: 1, data });
        setChatMessages([...msgs, { role: "assistant", content: `Got it, you're ${prefillVal} years old. ${flow.steps[1].q}` }]);
      }
    } else {
      setChatFlow({ type, step: 0, data: {} });
      setChatMessages([...msgs, { role: "assistant", content: flow.steps[0].q }]);
    }
  };

  const processFlowStep = (userMsg, newMessages) => {
    const flow = CHAT_FLOWS[chatFlow.type];
    const currentStep = flow.steps[chatFlow.step];
    const parsed = currentStep.key === "age" || currentStep.key === "retireAge" 
      ? parseInt(userMsg.replace(/[^0-9]/g, '')) 
      : parseINR(userMsg);
    
    if (!parsed && parsed !== 0) {
      setChatMessages([...newMessages, { role: "assistant", content: `Hmm, I didn't catch that. Could you enter a number? For example: "1.2 lakh" or "50000" or "80k"` }]);
      return;
    }

    const newData = { ...chatFlow.data, [currentStep.key]: parsed };
    const nextStep = chatFlow.step + 1;

    if (nextStep < flow.steps.length) {
      const nextQ = flow.steps[nextStep];
      const prefillVal = nextQ.prefill ? nextQ.prefill() : null;
      if (prefillVal) {
        newData[nextQ.key] = prefillVal;
        // Skip prefilled step
        const stepAfter = nextStep + 1;
        if (stepAfter < flow.steps.length) {
          setChatFlow({ ...chatFlow, step: stepAfter, data: newData });
          setChatMessages([...newMessages, { role: "assistant", content: `Got it! ${flow.steps[stepAfter].q}` }]);
        }
      } else {
        setChatFlow({ ...chatFlow, step: nextStep, data: newData });
        setChatMessages([...newMessages, { role: "assistant", content: `Got it! ${nextQ.q}` }]);
      }
    } else {
      // Flow complete — trigger the module
      setChatFlow(null);
      if (chatFlow.type === "fire") {
        setFireAge(String(newData.age || "25"));
        setFireIncome(String(newData.income || "0"));
        setFireExpenses(String(newData.expenses || "0"));
        setFireSavings(String(newData.savings || "0"));
        setFireTargetAge(String(newData.retireAge || "50"));
        const result = computeFIRE(newData.age || 25, newData.income || 0, newData.expenses || 0, newData.savings || 0, newData.retireAge || 50, 6, 12);
        setFireResult(result);
        setChatMessages([...newMessages, { role: "assistant", content: `Crunching your numbers... Here's your FIRE plan! 🔥` }]);
        setAiInsight(""); setAiInsightLoading(false);
        setTimeout(() => { 
          setActiveModule("fire"); setScreen("module"); 
          getAIInsight(`Analyze this FIRE retirement plan for an Indian aged ${newData.age}: Monthly income ${newData.income}, expenses ${newData.expenses}, current savings ${newData.savings}, wants to retire at ${newData.retireAge}. Corpus needed: ${result.corpusNeeded}, monthly SIP needed: ${result.monthlySIP}, savings rate: ${result.savingsRate}%, gap: ${result.gap}. Give personalized advice on whether this is realistic and what they should do.`);
        }, 800);
      }
      if (chatFlow.type === "tax") {
        setTaxIncome(String(newData.income || "0"));
        setTax80c(String(newData.sec80c || "0"));
        setTax80d(String(newData.sec80d || "0"));
        setTaxNps(String(newData.nps || "0"));
        setTaxHra(String(newData.hra || "0"));
        const d = { sec80c: Math.min(newData.sec80c || 0, 150000), sec80d: Math.min(newData.sec80d || 0, 75000), nps80ccd: Math.min(newData.nps || 0, 50000), hra: newData.hra || 0 };
        const o = computeTax(newData.income || 0, d, "old");
        const n = computeTax(newData.income || 0, {}, "new");
        const s = o.tax - n.tax;
        const md = [];
        if ((newData.sec80c || 0) < 150000) md.push({ name: "Section 80C", max: 150000, used: newData.sec80c || 0, tip: "ELSS, PPF, EPF, LIC, SCSS, 5-year FD, tuition fees" });
        if ((newData.sec80d || 0) < 50000) md.push({ name: "Section 80D", max: 75000, used: newData.sec80d || 0, tip: "Health insurance — self (₹25K) + parents (₹25K-₹50K)" });
        if ((newData.nps || 0) < 50000) md.push({ name: "80CCD(1B) — NPS", max: 50000, used: newData.nps || 0, tip: "Additional ₹50K for NPS, over and above 80C" });
        setTaxResult({ oldResult: o, newResult: n, savings: s, better: s > 0 ? "new" : "old", missedDeductions: md });
        setChatMessages([...newMessages, { role: "assistant", content: `Analyzing your tax situation... Here's the comparison! 🧾` }]);
        setAiInsight(""); setAiInsightLoading(false);
        setTimeout(() => { 
          setActiveModule("tax"); setScreen("module"); 
          getAIInsight(`Analyze this tax situation for an Indian aged ${userProfile.age || "25-30"}: Annual income ${newData.income}. Old regime tax: ${o.tax}, New regime tax: ${n.tax}. Better regime: ${s > 0 ? "new" : "old"}, saves ${Math.abs(s)}. Deductions used — 80C: ${newData.sec80c || 0}/150000, 80D: ${newData.sec80d || 0}/75000, NPS: ${newData.nps || 0}/50000, HRA: ${newData.hra || 0}. Missed deductions: ${md.length}. Give specific advice on optimizing their tax.`);
        }, 800);
      }
    }
  };

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const generateFallbackResponse = (msg) => {
    const m = msg.toLowerCase();
    const name = userProfile.name || "there";
    if (m.match(/^(hi|hello|hey|namaste)/)) return `Hey ${name}! What's on your mind financially?`;
    if (m.match(/tax|regime|80c|deduction/)) return `Great question about taxes! The key is comparing old vs new regime with your actual numbers.\n\n👉 Try our Tax Wizard for a precise comparison!`;
    if (m.match(/retire|fire|corpus|pension/)) return `Retirement planning is all about starting early. The 4% rule says you need 25x your annual expenses.\n\n👉 Try our FIRE Path Planner to calculate your exact target!`;
    if (m.match(/sip|mutual fund|invest|portfolio/)) return `Smart move thinking about investments! A diversified portfolio across equity, debt and gold is key.\n\n👉 Try our MF Portfolio X-Ray if you already have mutual funds!`;
    if (m.match(/bonus|windfall|extra money/)) return `Congrats on the bonus! Clear high-interest debt first, then build emergency fund, then invest.\n\n👉 Try our Life Event Advisor for a personalized bonus action plan!`;
    if (m.match(/marr|wedding|couple|spouse/)) return `Financial planning as a couple can save you lakhs in taxes!\n\n👉 Try our Couple's Money Planner to optimize across both incomes!`;
    if (m.match(/baby|child|kid|education/)) return `With a child, increase life cover to 15-20x income and start an education SIP early.\n\n👉 Try our Life Event Advisor — select "New Baby" for your action plan!`;
    if (m.match(/insurance|term plan|health cover/)) return `Insurance is the foundation — term life (10x income) + health cover (₹10L+) are non-negotiable.\n\n👉 Take our Money Health Score to check if you're adequately covered!`;
    return `I'd love to help with that, ${name}! I can assist with tax planning, investments, retirement, insurance, or any financial question. What specifically would you like to know?`;
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user", content: userMsg }];
    setChatMessages(newMessages);

    // If we're in a conversational flow, process the step
    if (chatFlow) {
      processFlowStep(userMsg, newMessages);
      return;
    }

    // Detect intent to start a flow
    const m = userMsg.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    if (m.match(/retir|fire|retiremnt|retierment|retrie|pension|old age|stop work|corpus need|plan for future|how much.*(need|save)|financial independence|freedm|freedome/)) {
      startFlow("fire", newMessages);
      return;
    }
    if (m.match(/tax|regim|regime|80c|80d|deducti|itr|save tax|incometax|income tax|old regim|new regim|which regime|tex|taxs|taks/)) {
      startFlow("tax", newMessages);
      return;
    }
    if (m.match(/health score|financial health|check ?up|how am i doing|financial check|score|diagnos|checkup|helth|my financ|am i ok/)) {
      setChatMessages([...newMessages, { role: "assistant", content: "Let's check your financial health! I'll ask you 12 quick questions across 6 dimensions. Launching now..." }]);
      setTimeout(() => openModule("health"), 800);
      return;
    }
    if (m.match(/mutual fund|mf |portfolio|overlap|x ?ray|fund analysis|my funds|sip check|which fund/)) {
      setChatMessages([...newMessages, { role: "assistant", content: "Let's analyze your mutual fund portfolio! I'll open the X-Ray tool where you can select your funds." }]);
      setTimeout(() => openModule("mf"), 800);
      return;
    }
    if (m.match(/couple|partner|spouse|joint|married|both income|husband|wife|dual income|two income|2 income/)) {
      setChatMessages([...newMessages, { role: "assistant", content: "Smart! Let's optimize finances across both incomes. Opening the Couple's Planner..." }]);
      setTimeout(() => openModule("couple"), 800);
      return;
    }
    if (m.match(/bonus|inheritance|baby|wedding|marr|life event|new ?born|got money|inhertance|lump ?sum|received money|gift money|windfall/)) {
      setChatMessages([...newMessages, { role: "assistant", content: "Life events need special financial planning! Let me open the Life Event Advisor where you can pick your situation." }]);
      setTimeout(() => openModule("life"), 800);
      return;
    }

    // General AI chat via Gemini
    setChatLoading(true);
    try {
      const conversationHistory = newMessages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=AIzaSyC6kLXxDF89EWXsUZvlqeoKZ9iOOErCfjk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are AI Money Mentor, a personal finance advisor for Indian users. Warm, friendly tone. Concise responses (3-4 short paragraphs max). Use rupee sign. Reference Indian instruments: PPF, NPS, ELSS, SIPs, EPF, 80C/80D, HRA, old vs new tax regime. Suggest these tools when relevant: Money Health Score, Tax Wizard, FIRE Path Planner, MF Portfolio X-Ray, Couple's Money Planner, Life Event Advisor. Give actionable advice with specific numbers. No markdown formatting like ** or ##. User's name is " + (userProfile.name || "friend") + ", age " + (userProfile.age || "unknown") + "." }] },
          contents: conversationHistory,
        }),
      });
      const data = await response.json();
      const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiReply) {
        setChatMessages([...newMessages, { role: "assistant", content: aiReply }]);
      } else {
        setChatMessages([...newMessages, { role: "assistant", content: generateFallbackResponse(userMsg) }]);
      }
    } catch (err) {
      setChatMessages([...newMessages, { role: "assistant", content: generateFallbackResponse(userMsg) }]);
    }
    setChatLoading(false);
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [healthStep, screen, healthResult, taxResult, fireResult, mfResult, coupleResult, lifeResult, selectedEvent]);

  const openModule = (key) => { 
    setActiveModule(key); setScreen("module"); setHealthStep(0); setHealthAnswers({}); setHealthResult(null); setTaxResult(null); setFireResult(null); setMfResult(null); setCoupleResult(null); setLifeResult(null); setSelectedEvent(null); setLifeAnswers({}); setMfFunds([{ name: "", invested: "" }]); 
    // Pre-fill age from onboarding
    if (key === "fire" && userProfile.age) setFireAge(userProfile.age);
  };
  
  const returnToChat = (moduleName, followUp) => {
    setChatMessages(prev => [...prev, { role: "assistant", content: followUp }]);
    setScreen("home");
    setActiveModule(null);
  };

  const goHome = () => { setScreen("home"); setActiveModule(null); };
  const handleHealthAnswer = (qId, score) => { const na = { ...healthAnswers, [qId]: score }; setHealthAnswers(na); if (healthStep < healthQuestions.length - 1) setTimeout(() => setHealthStep(healthStep + 1), 300); else { const r = computeHealthScore(na); const recs = getRecommendations(r.dimAverages); setTimeout(() => { setHealthResult({ ...r, recs }); getAIInsight(`Analyze this person's financial health score. Overall: ${r.overall}/100. Dimensions: ${Object.entries(r.dimAverages).map(([d,v]) => d + ": " + v.toFixed(1) + "/10").join(", ")}. Weak areas: ${recs.filter(r=>r.priority==="HIGH").map(r=>r.dim).join(", ") || "none"}. Give specific actionable advice for an Indian aged ${userProfile.age || "25-30"}.`); }, 400); } };
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
        <div style={{ paddingTop: 40, paddingBottom: 8, textAlign: "center", display: screen === "landing" || screen === "onboard" || screen === "tools" ? "none" : "block" }}>
          {screen !== "home" && screen !== "landing" && screen !== "onboard" && screen !== "tools" && <button onClick={goHome} style={{ position: "absolute", left: 20, top: 44, background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Back</button>}
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
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Type your exact age.</p>
              <input value={userProfile.age} onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="e.g. 25"
                style={{ width: "100%", padding: "16px 20px", background: "#0f172a", border: "2px solid #334155", borderRadius: 14, color: "#e2e8f0", fontSize: 18, outline: "none", boxSizing: "border-box", textAlign: "center" }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"} onBlur={(e) => e.target.style.borderColor = "#334155"}
                onKeyDown={(e) => { if (e.key === "Enter" && userProfile.age) setOnboardStep(2); }}
                autoFocus />
              <button onClick={() => { if (userProfile.age) setOnboardStep(2); }}
                style={{ marginTop: 20, width: "100%", padding: "14px", background: userProfile.age ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "#1e293b", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: userProfile.age ? "pointer" : "default", transition: "all 0.3s" }}>
                Continue
              </button>
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

        {/* HOME — CHAT FIRST */}
        {screen === "home" && (<div style={{ paddingTop: 16, paddingBottom: 80, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 120px)" }}>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } } @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }`}</style>
          
          {/* Chat Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "8px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>AI Money Mentor</span>
            </div>
            <button onClick={() => { 
              setChatMessages([{ role: "assistant", content: `Fresh start! What would you like to help with, ${userProfile.name || "friend"}?\n\nYou can ask me about taxes, retirement, investments, or any money question.` }]); 
              setChatFlow(null); 
            }}
              style={{ padding: "4px 12px", background: "none", border: "1px solid #334155", borderRadius: 8, color: "#64748b", fontSize: 11, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#64748b"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}>
              ↻ Clear Chat
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
                {msg.role !== "user" && <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, marginRight: 10, marginTop: 2 }}>🧠</div>}
                <div style={{ maxWidth: "80%" }}>
                  <div style={{
                    padding: "14px 18px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user" ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.05)",
                    border: msg.role === "user" ? "none" : "1px solid #1e293b",
                    fontSize: 14, lineHeight: 1.7, color: "#e2e8f0", whiteSpace: "pre-wrap",
                  }}>{msg.content}</div>
                  {/* Inline tool buttons — show after AI messages that mention tools */}
                  {msg.role === "assistant" && (() => {
                    const t = msg.content.toLowerCase();
                    const tools = [];
                    if (t.includes("tax wizard") || t.includes("tax regime") || t.includes("compare old")) tools.push({ key: "tax", label: "Open Tax Wizard", icon: "🧾", color: "#F59E0B" });
                    if (t.includes("fire") || t.includes("retirement") || t.includes("corpus") || t.includes("sip target")) tools.push({ key: "fire", label: "Open FIRE Planner", icon: "🔥", color: "#EF4444" });
                    if (t.includes("health score") || t.includes("financial check") || t.includes("check-up") || t.includes("coverage")) tools.push({ key: "health", label: "Take Health Score", icon: "💊", color: "#10B981" });
                    if (t.includes("x-ray") || t.includes("portfolio") || t.includes("overlap") || t.includes("mutual fund")) tools.push({ key: "mf", label: "Open MF X-Ray", icon: "🔬", color: "#8B5CF6" });
                    if (t.includes("couple") || t.includes("both incomes") || t.includes("partner")) tools.push({ key: "couple", label: "Open Couple's Planner", icon: "💑", color: "#EC4899" });
                    if (t.includes("life event") || t.includes("bonus") || t.includes("new baby") || t.includes("action plan")) tools.push({ key: "life", label: "Open Life Advisor", icon: "🎯", color: "#06B6D4" });
                    if (tools.length === 0) return null;
                    return (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {tools.map(tool => (
                          <button key={tool.key} onClick={() => openModule(tool.key)}
                            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: `${tool.color}15`, border: `1px solid ${tool.color}40`, borderRadius: 10, color: tool.color, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = `${tool.color}25`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = `${tool.color}15`; }}>
                            <span>{tool.icon}</span> {tool.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, marginRight: 10 }}>🧠</div>
                <div style={{ padding: "14px 18px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.05)", border: "1px solid #1e293b", display: "flex", gap: 6 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#64748b", animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestion chips — only show when few messages */}
          {chatMessages.length <= 2 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {["Help me plan retirement", "Compare my tax regimes", "Check my financial health", "I got a bonus"].map(s => (
                <button key={s} onClick={() => { 
                  const newMsgs = [...chatMessages, { role: "user", content: s }];
                  setChatMessages(newMsgs);
                  // Detect intent
                  const m = s.toLowerCase();
                  if (m.match(/retire/)) { startFlow("fire", newMsgs); }
                  else if (m.match(/tax/)) { startFlow("tax", newMsgs); }
                  else if (m.match(/health/)) { setChatMessages([...newMsgs, { role: "assistant", content: "Let's check your financial health! Launching the quiz now..." }]); setTimeout(() => openModule("health"), 800); }
                  else if (m.match(/bonus/)) { setChatMessages([...newMsgs, { role: "assistant", content: "Let's plan what to do with your bonus! Opening the advisor..." }]); setTimeout(() => openModule("life"), 800); }
                }}
                  style={{ padding: "8px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid #334155", borderRadius: 20, color: "#94a3b8", fontSize: 12, cursor: "pointer", transition: "all 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#60a5fa"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input — fixed at bottom feel */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setScreen("tools")}
              style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid #334155", color: "#94a3b8", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              title="All Tools">⚡</button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              placeholder="Ask me anything..."
              style={{ flex: 1, padding: "12px 16px", background: "#0f172a", border: "1px solid #334155", borderRadius: 14, color: "#e2e8f0", fontSize: 14, outline: "none" }}
              onFocus={(e) => e.target.style.borderColor = "#60a5fa"} onBlur={(e) => e.target.style.borderColor = "#334155"}
            />
            <button onClick={sendChat} disabled={chatLoading}
              style={{ width: 42, height: 42, borderRadius: 12, background: chatLoading ? "#334155" : "linear-gradient(135deg, #2563eb, #1d4ed8)", border: "none", color: "#fff", fontSize: 16, cursor: chatLoading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ↑
            </button>
          </div>
        </div>)}

        {/* TOOLS SCREEN */}
        {screen === "tools" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#e2e8f0" }}>All Tools</h2>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "1px solid #334155", color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>← Back to Chat</button>
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(MODULES).map(([key, mod]) => (
              <button key={key} onClick={() => openModule(key)} style={{ display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.04)", border: "1px solid #334155", borderRadius: 14, padding: "18px 20px", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.borderColor = mod.color} onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${mod.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{mod.icon}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>{mod.name}</div><div style={{ fontSize: 12, color: "#64748b" }}>{mod.desc}</div></div>
                <span style={{ color: "#64748b", fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>
        </div>)}

        {/* HEALTH SCORE */}
        {screen === "module" && activeModule === "health" && !healthResult && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="health" />
          <div style={{ marginBottom: 24 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}><span>{healthQuestions[healthStep].dimension}</span><span>{healthStep + 1}/{healthQuestions.length}</span></div><div style={{ height: 4, borderRadius: 2, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 2, background: "#10B981", width: `${((healthStep + 1) / healthQuestions.length) * 100}%`, transition: "width 0.4s ease" }} /></div></div>
          <Card><p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginTop: 0, marginBottom: 20 }}>{healthQuestions[healthStep].q}</p><div style={{ display: "grid", gap: 10 }}>{healthQuestions[healthStep].options.map((opt, i) => (<button key={i} onClick={() => handleHealthAnswer(healthQuestions[healthStep].id, opt.score)} style={{ padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b", borderRadius: 10, color: "#e2e8f0", fontSize: 14, cursor: "pointer", textAlign: "left" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>{opt.label}</button>))}</div></Card>
        </div>)}

        {screen === "module" && activeModule === "health" && healthResult && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <Card style={{ textAlign: "center" }}><AnimatedScore score={healthResult.overall} color={getScoreColor(healthResult.overall)} /><div style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: getScoreColor(healthResult.overall) }}>{getScoreLabel(healthResult.overall)}</div><p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Your Financial Health Score</p></Card>
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>DIMENSION BREAKDOWN</h3>{Object.entries(healthResult.dimAverages).map(([d, a]) => <DimensionBar key={d} name={d} score={a} />)}</Card>
          {healthResult.recs.length > 0 && <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>AI RECOMMENDATIONS</h3>{healthResult.recs.map((r, i) => (<div key={i} style={{ padding: "14px 16px", borderRadius: 10, marginBottom: 10, background: r.priority === "HIGH" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)", border: `1px solid ${r.priority === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}` }}><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><PriorityBadge priority={r.priority} /><span style={{ fontSize: 12, color: "#94a3b8" }}>{r.dim}</span></div><p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{r.text}</p></div>))}</Card>}
          <AIInsightCard insight={aiInsight} loading={aiInsightLoading} />
          <button onClick={() => { setHealthStep(0); setHealthAnswers({}); setHealthResult(null); }} style={{ width: "100%", padding: "14px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ Retake Assessment</button>
          <BackToChatBtn onClick={() => returnToChat("health", `Your Money Health Score is ${healthResult.overall}/100 (${getScoreLabel(healthResult.overall)}). ${healthResult.recs.length > 0 ? "I noticed some areas to improve — " + healthResult.recs[0].dim + " needs attention." : "Looking solid!"}\n\nWhat would you like to explore next? I can help with tax optimization, retirement planning, or investment analysis.`)} />
        </div>)}

        {/* TAX WIZARD */}
        {screen === "module" && activeModule === "tax" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="tax" />
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
            <BackToChatBtn onClick={() => returnToChat("tax", `Tax analysis done! The ${taxResult.better === "new" ? "New" : "Old"} regime saves you ${formatINR(Math.abs(taxResult.savings))}. ${taxResult.missedDeductions.length > 0 ? "You're also leaving money on the table with " + taxResult.missedDeductions.length + " unused deductions." : ""}\n\nNow that taxes are sorted, want to check your retirement readiness or analyze your investments?`)} />
            <AIInsightCard insight={aiInsight} loading={aiInsightLoading} />
          </>)}
        </div>)}

        {/* FIRE */}
        {screen === "module" && activeModule === "fire" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="fire" />
          <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginTop: 0, marginBottom: 4 }}>FIRE Calculator</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>Financial Independence, Retire Early</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><InputField label="Your Age" value={fireAge} onChange={setFireAge} placeholder="25" suffix="yrs" /><InputField label="Retire At" value={fireTargetAge} onChange={setFireTargetAge} placeholder="50" suffix="yrs" /></div>
            <InputField label="Monthly Income (₹)" value={fireIncome} onChange={setFireIncome} placeholder="100000" />
            <InputField label="Monthly Expenses (₹)" value={fireExpenses} onChange={setFireExpenses} placeholder="50000" />
            <InputField label="Current Savings (₹)" value={fireSavings} onChange={setFireSavings} placeholder="500000" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><InputField label="Inflation" value={fireInflation} onChange={setFireInflation} placeholder="6" suffix="%" /><InputField label="Return" value={fireReturn} onChange={setFireReturn} placeholder="12" suffix="%" /></div>
            <button onClick={runFIRE} style={btnStyle("#EF4444")}>Calculate FIRE Path 🔥</button>
          </Card>
          {fireResult && (<>
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Total money you need to retire</div>
              <div style={{ fontSize: 34, fontWeight: 800, color: "#EF4444" }}>{formatINR(fireResult.corpusNeeded)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, lineHeight: 1.6, textAlign: "left" }}>This is the total amount you need saved up by age {fireTargetAge}. It accounts for inflation — your ₹{fireExpenses ? parseInt(fireExpenses).toLocaleString("en-IN") : "0"}/month expenses today will cost {formatINR(Math.round(fireResult.futureAnnualExpense / 12))}/month by then. The "25x rule" means this corpus can fund your lifestyle for 30+ years in retirement.</div>
            </Card>
            
            <Card>
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#e2e8f0" }}>Time to retirement</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#60a5fa" }}>{fireResult.yearsToRetire} years</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>From your current age to your target retirement age of {fireTargetAge}. This is how long your money has to grow.</div>
              </div>
              
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#e2e8f0" }}>Your savings rate</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: fireResult.savingsRate >= 50 ? "#10B981" : fireResult.savingsRate >= 30 ? "#F59E0B" : "#EF4444" }}>{fireResult.savingsRate}%</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>This is how much of your income you're saving (income minus expenses). {fireResult.savingsRate >= 50 ? "Excellent! 50%+ is the gold standard for FIRE." : fireResult.savingsRate >= 30 ? "Decent, but pushing to 50% would accelerate your timeline significantly." : "This is low. Try to cut expenses or increase income to reach at least 30%."}</div>
              </div>
              
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#e2e8f0" }}>Your current savings will grow to</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#8B5CF6" }}>{formatINR(fireResult.fvCurrentSavings)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Your existing ₹{fireSavings ? parseInt(fireSavings).toLocaleString("en-IN") : "0"} invested at {fireReturn}% for {fireResult.yearsToRetire} years will compound to this amount. Compounding does the heavy lifting!</div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: "#e2e8f0" }}>Gap still to fill</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#F97316" }}>{formatINR(fireResult.gap)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>This is the difference between what you need ({formatINR(fireResult.corpusNeeded)}) and what your current savings will become ({formatINR(fireResult.fvCurrentSavings)}). Your monthly SIP needs to fill this gap.</div>
              </div>
            </Card>

            <Card style={{ textAlign: "center", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Start this monthly SIP to retire on time</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#10B981" }}>{formatINR(fireResult.monthlySIP)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8, lineHeight: 1.6, textAlign: "left" }}>If you invest {formatINR(fireResult.monthlySIP)} every month in a diversified portfolio earning ~{fireReturn}% annually, you'll build the {formatINR(fireResult.gap)} gap over {fireResult.yearsToRetire} years. Set up an auto-debit SIP so you never miss a month.</div>
            </Card>

            <Card><h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 6 }}>WHERE TO INVEST YOUR SIP</h3><p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 14 }}>Split your {formatINR(fireResult.monthlySIP)}/month across these categories:</p>{[{ n: "Equity Index (Nifty 50/Next 50)", p: 50, c: "#60a5fa", why: "Your core — low-cost, market-matching returns" }, { n: "Mid/Small Cap Fund", p: 20, c: "#8B5CF6", why: "Higher growth potential, more volatility" }, { n: "Debt / PPF / EPF", p: 20, c: "#10B981", why: "Stability and capital protection" }, { n: "Gold / International", p: 10, c: "#F59E0B", why: "Hedge against INR depreciation and inflation" }].map(a => (<div key={a.n} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}><span style={{ color: "#cbd5e1" }}>{a.n}</span><span style={{ color: a.c, fontWeight: 700 }}>{formatINR(Math.round(fireResult.monthlySIP * a.p / 100))}/mo</span></div><div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{a.why}</div><div style={{ height: 6, borderRadius: 3, background: "#1a1a2e", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, background: a.c, width: `${a.p}%` }} /></div></div>))}</Card>
            <BackToChatBtn onClick={() => returnToChat("fire", `FIRE plan ready! You need ${formatINR(fireResult.corpusNeeded)} to retire at ${fireTargetAge}. That means a monthly SIP of ${formatINR(fireResult.monthlySIP)}. ${fireResult.savingsRate < 30 ? "Your savings rate is low — we should look at ways to optimize." : "Your savings rate looks healthy!"}\n\nWant to check if your current mutual funds are on track, or optimize your taxes to free up more for investing?`)} />
            <AIInsightCard insight={aiInsight} loading={aiInsightLoading} />
          </>)}
        </div>)}

        {/* MF X-RAY */}
        {screen === "module" && activeModule === "mf" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="mf" />
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
            <BackToChatBtn onClick={() => returnToChat("mf", `Portfolio analysis complete! Your portfolio has a ${mfResult.weightedReturn.toFixed(1)}% return with ${mfResult.alpha >= 0 ? "positive" : "negative"} alpha of ${mfResult.alpha.toFixed(1)}%. ${mfResult.overlapPairs.length > 0 ? "I found some overlap between your funds that's worth addressing." : "Diversification looks reasonable."}\n\nWant to plan your retirement target or check your overall financial health?`)} />
          </>)}
        </div>)}

        {/* COUPLE'S PLANNER */}
        {screen === "module" && activeModule === "couple" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="couple" />
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
            <BackToChatBtn onClick={() => returnToChat("couple", `Joint plan done! Combined post-tax income is ${formatINR(coupleResult.combinedPostTax)} with ${formatINR(coupleResult.monthlySavingCapacity)}/month saving capacity. Each partner should use the ${coupleResult.p1.bestRegime === coupleResult.p2.bestRegime ? coupleResult.p1.bestRegime : "different optimal"} tax regime.\n\nWant to plan your retirement together, or check how your mutual funds are doing?`)} />
          </>)}
        </div>)}

        {/* LIFE EVENT */}
        {screen === "module" && activeModule === "life" && (<div style={{ paddingTop: 24, paddingBottom: 60 }}>
          <ModulePurpose moduleKey="life" />
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
            <BackToChatBtn onClick={() => returnToChat("life", `Your ${LIFE_EVENTS[selectedEvent].name} action plan is ready with ${lifeResult.length} steps! The most urgent: ${lifeResult[0]?.title}.\n\nLife events often trigger tax implications too. Want to check your tax situation, or do a full financial health check-up?`)} />
          </>)}
        </div>)}
      </div>
    </div>
  );
}
