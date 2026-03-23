import { useState, useEffect, useRef } from "react";

const MODULES = {
  health: {
    name: "Money Health Score",
    icon: "💊",
    desc: "5-min check-up across 6 financial dimensions",
    color: "#10B981",
  },
  tax: {
    name: "Tax Wizard",
    icon: "🧾",
    desc: "Find missing deductions, compare tax regimes",
    color: "#F59E0B",
  },
  fire: {
    name: "FIRE Path Planner",
    icon: "🔥",
    desc: "Month-by-month roadmap to financial independence",
    color: "#EF4444",
  },
  mf: {
    name: "MF Portfolio X-Ray",
    icon: "🔬",
    desc: "Overlap analysis, XIRR, rebalancing",
    color: "#8B5CF6",
    comingSoon: true,
  },
  couple: {
    name: "Couple's Money Planner",
    icon: "💑",
    desc: "Optimize across both incomes",
    color: "#EC4899",
    comingSoon: true,
  },
  life: {
    name: "Life Event Advisor",
    icon: "🎯",
    desc: "Bonus, marriage, baby — what to do with money",
    color: "#06B6D4",
    comingSoon: true,
  },
};

// ─── MONEY HEALTH SCORE MODULE ───
const healthQuestions = [
  {
    id: "emergency",
    dimension: "Emergency Preparedness",
    q: "How many months of expenses do you have saved in a liquid emergency fund?",
    options: [
      { label: "Less than 1 month", score: 1 },
      { label: "1–3 months", score: 4 },
      { label: "3–6 months", score: 7 },
      { label: "More than 6 months", score: 10 },
    ],
  },
  {
    id: "emergency2",
    dimension: "Emergency Preparedness",
    q: "Where is your emergency fund kept?",
    options: [
      { label: "Savings account only", score: 4 },
      { label: "Mix of savings + liquid/overnight fund", score: 9 },
      { label: "Fixed deposits (locked)", score: 5 },
      { label: "I don't have one", score: 1 },
    ],
  },
  {
    id: "insurance1",
    dimension: "Insurance Coverage",
    q: "Do you have a term life insurance policy?",
    options: [
      { label: "Yes, cover ≥ 10x annual income", score: 10 },
      { label: "Yes, but cover is less than 10x", score: 6 },
      { label: "Only employer-provided cover", score: 3 },
      { label: "No life insurance", score: 1 },
    ],
  },
  {
    id: "insurance2",
    dimension: "Insurance Coverage",
    q: "What's your health insurance situation?",
    options: [
      { label: "Personal policy ≥ ₹10L + top-up", score: 10 },
      { label: "Personal policy < ₹10L", score: 6 },
      { label: "Only employer coverage", score: 3 },
      { label: "No health insurance", score: 1 },
    ],
  },
  {
    id: "invest1",
    dimension: "Investment Diversification",
    q: "How are your investments spread?",
    options: [
      { label: "Equity + Debt + Gold/REITs (diversified)", score: 10 },
      { label: "Mostly equity (MF/stocks)", score: 6 },
      { label: "Only FDs and savings", score: 3 },
      { label: "I don't invest", score: 1 },
    ],
  },
  {
    id: "invest2",
    dimension: "Investment Diversification",
    q: "Do you have a Systematic Investment Plan (SIP) running?",
    options: [
      { label: "Yes, ≥ 20% of income", score: 10 },
      { label: "Yes, 10–20% of income", score: 7 },
      { label: "Yes, but < 10% of income", score: 4 },
      { label: "No SIPs", score: 1 },
    ],
  },
  {
    id: "debt1",
    dimension: "Debt Health",
    q: "What's your total EMI-to-income ratio?",
    options: [
      { label: "No EMIs / loans", score: 10 },
      { label: "Less than 30%", score: 7 },
      { label: "30–50%", score: 4 },
      { label: "More than 50%", score: 1 },
    ],
  },
  {
    id: "debt2",
    dimension: "Debt Health",
    q: "Do you carry credit card debt month to month?",
    options: [
      { label: "Never — always full payment", score: 10 },
      { label: "Occasionally", score: 5 },
      { label: "Regularly carry balance", score: 2 },
      { label: "Minimum payment only", score: 1 },
    ],
  },
  {
    id: "tax1",
    dimension: "Tax Efficiency",
    q: "Do you actively plan your taxes before March?",
    options: [
      { label: "Yes, I maximize 80C + 80D + NPS + HRA", score: 10 },
      { label: "I use some deductions but not all", score: 6 },
      { label: "I only do 80C (ELSS/PPF/LIC)", score: 4 },
      { label: "No tax planning", score: 1 },
    ],
  },
  {
    id: "tax2",
    dimension: "Tax Efficiency",
    q: "Have you compared Old vs New tax regime for your income?",
    options: [
      { label: "Yes, I chose the optimal one", score: 10 },
      { label: "I compared but wasn't sure", score: 5 },
      { label: "No, I go with the default", score: 2 },
      { label: "I don't know the difference", score: 1 },
    ],
  },
  {
    id: "retire1",
    dimension: "Retirement Readiness",
    q: "Do you have a retirement corpus target in mind?",
    options: [
      { label: "Yes, calculated with inflation", score: 10 },
      { label: "Rough idea but not calculated", score: 5 },
      { label: "I'll figure it out later", score: 2 },
      { label: "Haven't thought about it", score: 1 },
    ],
  },
  {
    id: "retire2",
    dimension: "Retirement Readiness",
    q: "Are you contributing to any retirement-specific instruments (NPS, PPF, EPF voluntary)?",
    options: [
      { label: "Yes, multiple instruments", score: 10 },
      { label: "Only EPF (mandatory)", score: 5 },
      { label: "Only PPF", score: 6 },
      { label: "Nothing beyond EPF", score: 3 },
    ],
  },
];

const dimensionWeights = {
  "Emergency Preparedness": 0.2,
  "Insurance Coverage": 0.2,
  "Investment Diversification": 0.2,
  "Debt Health": 0.15,
  "Tax Efficiency": 0.1,
  "Retirement Readiness": 0.15,
};

function computeHealthScore(answers) {
  const dimScores = {};
  const dimCounts = {};
  healthQuestions.forEach((hq) => {
    const ans = answers[hq.id];
    if (ans !== undefined) {
      if (!dimScores[hq.dimension]) {
        dimScores[hq.dimension] = 0;
        dimCounts[hq.dimension] = 0;
      }
      dimScores[hq.dimension] += ans;
      dimCounts[hq.dimension] += 1;
    }
  });
  const dimAverages = {};
  let weightedTotal = 0;
  let totalWeight = 0;
  Object.keys(dimScores).forEach((dim) => {
    dimAverages[dim] = dimScores[dim] / dimCounts[dim];
    weightedTotal += dimAverages[dim] * (dimensionWeights[dim] || 0.167);
    totalWeight += dimensionWeights[dim] || 0.167;
  });
  const overall = totalWeight > 0 ? (weightedTotal / totalWeight) * 10 : 0;
  return { overall: Math.round(overall), dimAverages };
}

function getScoreColor(score) {
  if (score >= 75) return "#10B981";
  if (score >= 50) return "#F59E0B";
  if (score >= 30) return "#F97316";
  return "#EF4444";
}

function getScoreLabel(score) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  if (score >= 20) return "At Risk";
  return "Critical";
}

function getRecommendations(dimAverages) {
  const recs = [];
  Object.entries(dimAverages).forEach(([dim, avg]) => {
    if (avg < 5) {
      switch (dim) {
        case "Emergency Preparedness":
          recs.push({ dim, priority: "HIGH", text: "Build a 6-month emergency fund in a liquid mutual fund (overnight or liquid fund). Start with ₹5,000/month SIP into a liquid fund today." });
          break;
        case "Insurance Coverage":
          recs.push({ dim, priority: "HIGH", text: "Get a term life insurance (≥10x annual income) and a personal health policy (≥₹10L with super top-up). Don't rely on employer coverage alone — it ends when you leave." });
          break;
        case "Investment Diversification":
          recs.push({ dim, priority: "HIGH", text: "Start a diversified SIP: 60% equity index fund (Nifty 50/Next 50), 20% debt fund, 20% gold ETF. Even ₹3,000/month split this way builds real wealth." });
          break;
        case "Debt Health":
          recs.push({ dim, priority: "HIGH", text: "Focus on eliminating high-interest debt first — credit cards (36%+ interest) before personal loans before home loan. Use the avalanche method." });
          break;
        case "Tax Efficiency":
          recs.push({ dim, priority: "MEDIUM", text: "Compare old vs new regime with your actual numbers. Claim all eligible deductions: 80C (₹1.5L), 80D (health insurance premium), 80CCD(1B) (₹50K NPS), and HRA if applicable." });
          break;
        case "Retirement Readiness":
          recs.push({ dim, priority: "MEDIUM", text: "Calculate your retirement corpus: monthly expenses × 12 × 25 (for 4% withdrawal rule), adjusted for inflation. Start an NPS Tier-1 account for the extra ₹50K tax benefit." });
          break;
      }
    } else if (avg < 7) {
      switch (dim) {
        case "Emergency Preparedness":
          recs.push({ dim, priority: "MEDIUM", text: "You're on the right track. Push your emergency fund to 6 months and keep it in a liquid/overnight fund for instant access." });
          break;
        case "Insurance Coverage":
          recs.push({ dim, priority: "MEDIUM", text: "Review if your cover amount is adequate. Term cover should be at least 10x income. Add a super top-up health plan for catastrophic coverage." });
          break;
        case "Investment Diversification":
          recs.push({ dim, priority: "MEDIUM", text: "Good start. Consider adding international equity exposure (Nasdaq 100 fund) and REITs for real diversification." });
          break;
        case "Tax Efficiency":
          recs.push({ dim, priority: "LOW", text: "You're using some deductions. Check if NPS (80CCD1B) and health insurance premiums (80D) are being claimed. Run the old vs new regime comparison annually." });
          break;
        default:
          break;
      }
    }
  });
  recs.sort((a, b) => {
    const p = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return p[a.priority] - p[b.priority];
  });
  return recs;
}

// ─── TAX WIZARD MODULE ───
const standardDeduction = 75000;

function computeTax(income, deductions, regime) {
  if (regime === "old") {
    const totalDeductions = (deductions.sec80c || 0) + (deductions.sec80d || 0) + (deductions.nps80ccd || 0) + (deductions.hra || 0) + standardDeduction;
    const taxableIncome = Math.max(0, income - totalDeductions);
    let tax = 0;
    if (taxableIncome > 1500000) tax += (taxableIncome - 1500000) * 0.30;
    const s5 = Math.min(taxableIncome, 1500000);
    if (s5 > 1250000) tax += (s5 - 1250000) * 0.25;
    const s4 = Math.min(s5, 1250000);
    if (s4 > 1000000) tax += (s4 - 1000000) * 0.20;
    const s3 = Math.min(s4, 1000000);
    if (s3 > 750000) tax += (s3 - 750000) * 0.15;
    const s2 = Math.min(s3, 750000);
    if (s2 > 500000) tax += (s2 - 500000) * 0.10;
    const s1 = Math.min(s2, 500000);
    if (s1 > 250000) tax += (s1 - 250000) * 0.05;
    return { taxableIncome, tax: Math.round(tax), totalDeductions };
  } else {
    // New regime FY 2025-26 slabs
    const taxableIncome = Math.max(0, income - 75000);
    let tax = 0;
    // 0-4L: nil
    // 4-8L: 5%
    // 8-12L: 10%
    // 12-16L: 15%
    // 16-20L: 20%
    // 20-24L: 25%
    // 24L+: 30%
    if (taxableIncome > 2400000) tax += (taxableIncome - 2400000) * 0.30;
    const s6 = Math.min(taxableIncome, 2400000);
    if (s6 > 2000000) tax += (s6 - 2000000) * 0.25;
    const s5 = Math.min(s6, 2000000);
    if (s5 > 1600000) tax += (s5 - 1600000) * 0.20;
    const s4 = Math.min(s5, 1600000);
    if (s4 > 1200000) tax += (s4 - 1200000) * 0.15;
    const s3 = Math.min(s4, 1200000);
    if (s3 > 800000) tax += (s3 - 800000) * 0.10;
    const s2 = Math.min(s3, 800000);
    if (s2 > 400000) tax += (s2 - 400000) * 0.05;
    // Rebate u/s 87A: if total income ≤ 12L (after standard deduction), rebate up to 60K in new regime
    if (taxableIncome <= 1200000) {
      tax = Math.max(0, tax - 60000);
    }
    return { taxableIncome, tax: Math.round(tax), totalDeductions: 75000 };
  }
}

// ─── FIRE PLANNER MODULE ───
function computeFIRE(age, monthlyIncome, monthlyExpenses, currentSavings, targetAge, inflation, returnRate) {
  const annualExpense = monthlyExpenses * 12;
  const yearsToRetire = targetAge - age;
  const futureAnnualExpense = annualExpense * Math.pow(1 + inflation / 100, yearsToRetire);
  const corpusNeeded = futureAnnualExpense * 25; // 4% rule
  const realReturn = (returnRate - inflation) / 100;
  // FV of current savings
  const fvCurrent = currentSavings * Math.pow(1 + returnRate / 100, yearsToRetire);
  const gap = corpusNeeded - fvCurrent;
  // Monthly SIP needed (future value of annuity)
  const monthlyRate = returnRate / 100 / 12;
  const months = yearsToRetire * 12;
  let monthlySIP = 0;
  if (gap > 0 && monthlyRate > 0) {
    monthlySIP = gap * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  }
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  return {
    corpusNeeded: Math.round(corpusNeeded),
    futureAnnualExpense: Math.round(futureAnnualExpense),
    fvCurrentSavings: Math.round(fvCurrent),
    gap: Math.round(Math.max(0, gap)),
    monthlySIP: Math.round(monthlySIP),
    yearsToRetire,
    savingsRate: Math.round(savingsRate),
  };
}

// ─── COMPONENTS ───

function AnimatedScore({ score, color }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= score) {
        setDisplay(score);
        clearInterval(interval);
      } else {
        setDisplay(current);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (display / 100) * circumference;

  return (
    <div style={{ position: "relative", width: 140, height: 140, margin: "0 auto" }}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a1a2e" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        textAlign: "center"
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, color }}>{display}</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: -2 }}>/100</div>
      </div>
    </div>
  );
}

function DimensionBar({ name, score, max = 10 }) {
  const pct = (score / max) * 100;
  const color = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: "#e2e8f0" }}>{name}</span>
        <span style={{ color, fontWeight: 700 }}>{score.toFixed(1)}/10</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#1a1a2e", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4, background: color,
          width: `${pct}%`, transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  );
}

function formatINR(num) {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function InputField({ label, value, onChange, type = "number", placeholder, suffix }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "10px 14px", paddingRight: suffix ? 40 : 14,
            background: "#0f172a", border: "1px solid #334155", borderRadius: 8,
            color: "#e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box",
          }}
          onFocus={(e) => e.target.style.borderColor = "#60a5fa"}
          onBlur={(e) => e.target.style.borderColor = "#334155"}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#64748b", fontSize: 13 }}>{suffix}</span>
        )}
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function MoneyMentor() {
  const [screen, setScreen] = useState("home");
  const [activeModule, setActiveModule] = useState(null);

  // Health score state
  const [healthStep, setHealthStep] = useState(0);
  const [healthAnswers, setHealthAnswers] = useState({});
  const [healthResult, setHealthResult] = useState(null);

  // Tax wizard state
  const [taxIncome, setTaxIncome] = useState("");
  const [tax80c, setTax80c] = useState("");
  const [tax80d, setTax80d] = useState("");
  const [taxNps, setTaxNps] = useState("");
  const [taxHra, setTaxHra] = useState("");
  const [taxResult, setTaxResult] = useState(null);

  // FIRE state
  const [fireAge, setFireAge] = useState("");
  const [fireIncome, setFireIncome] = useState("");
  const [fireExpenses, setFireExpenses] = useState("");
  const [fireSavings, setFireSavings] = useState("");
  const [fireTargetAge, setFireTargetAge] = useState("50");
  const [fireInflation, setFireInflation] = useState("6");
  const [fireReturn, setFireReturn] = useState("12");
  const [fireResult, setFireResult] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [healthStep, screen, healthResult, taxResult, fireResult]);

  const openModule = (key) => {
    if (MODULES[key].comingSoon) return;
    setActiveModule(key);
    setScreen("module");
    // Reset states
    setHealthStep(0);
    setHealthAnswers({});
    setHealthResult(null);
    setTaxResult(null);
    setFireResult(null);
  };

  const goHome = () => {
    setScreen("home");
    setActiveModule(null);
  };

  const handleHealthAnswer = (qId, score) => {
    const newAnswers = { ...healthAnswers, [qId]: score };
    setHealthAnswers(newAnswers);
    if (healthStep < healthQuestions.length - 1) {
      setTimeout(() => setHealthStep(healthStep + 1), 300);
    } else {
      // Compute result
      const result = computeHealthScore(newAnswers);
      const recs = getRecommendations(result.dimAverages);
      setTimeout(() => setHealthResult({ ...result, recs }), 400);
    }
  };

  const runTaxWizard = () => {
    const income = parseInt(taxIncome) || 0;
    const deductions = {
      sec80c: Math.min(parseInt(tax80c) || 0, 150000),
      sec80d: Math.min(parseInt(tax80d) || 0, 75000),
      nps80ccd: Math.min(parseInt(taxNps) || 0, 50000),
      hra: parseInt(taxHra) || 0,
    };
    const oldResult = computeTax(income, deductions, "old");
    const newResult = computeTax(income, {}, "new");
    const savings = oldResult.tax - newResult.tax;
    const missedDeductions = [];
    if ((parseInt(tax80c) || 0) < 150000) missedDeductions.push({ name: "Section 80C", max: 150000, used: parseInt(tax80c) || 0, tip: "ELSS, PPF, EPF, life insurance premium, SCSS, 5-year FD, tuition fees" });
    if ((parseInt(tax80d) || 0) < 50000) missedDeductions.push({ name: "Section 80D", max: 75000, used: parseInt(tax80d) || 0, tip: "Health insurance premiums — self (₹25K) + parents (₹25K–₹50K if senior)" });
    if ((parseInt(taxNps) || 0) < 50000) missedDeductions.push({ name: "80CCD(1B) — NPS", max: 50000, used: parseInt(taxNps) || 0, tip: "Additional ₹50K deduction for NPS contribution, over and above 80C" });
    setTaxResult({ oldResult, newResult, savings, better: savings > 0 ? "new" : "old", missedDeductions, income });
  };

  const runFIRE = () => {
    const result = computeFIRE(
      parseInt(fireAge) || 25,
      parseInt(fireIncome) || 0,
      parseInt(fireExpenses) || 0,
      parseInt(fireSavings) || 0,
      parseInt(fireTargetAge) || 50,
      parseFloat(fireInflation) || 6,
      parseFloat(fireReturn) || 12
    );
    setFireResult(result);
  };

  // ─── RENDER ───
  const containerStyle = {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #0a0a1a 0%, #0f1629 50%, #0a0a1a 100%)",
    color: "#e2e8f0",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
  };

  const glowOrb = (top, left, color, size = 300) => (
    <div style={{
      position: "fixed", top, left, width: size, height: size,
      borderRadius: "50%", background: color, filter: "blur(120px)",
      opacity: 0.07, pointerEvents: "none", zIndex: 0,
    }} />
  );

  return (
    <div style={containerStyle}>
      {glowOrb("10%", "70%", "#10B981", 400)}
      {glowOrb("60%", "10%", "#F59E0B", 350)}
      {glowOrb("80%", "80%", "#8B5CF6", 300)}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "0 20px" }} ref={scrollRef}>

        {/* HEADER */}
        <div style={{ paddingTop: 40, paddingBottom: 8, textAlign: "center" }}>
          {screen !== "home" && (
            <button onClick={goHome} style={{
              position: "absolute", left: 20, top: 44, background: "none", border: "1px solid #334155",
              color: "#94a3b8", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13,
            }}>← Back</button>
          )}
          <div style={{ fontSize: 13, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
            AI-Powered
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, margin: 0,
            background: "linear-gradient(135deg, #60a5fa, #10B981, #F59E0B)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Money Mentor
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, marginTop: 6, marginBottom: 0 }}>
            {screen === "home"
              ? "Your personal AI financial planning assistant"
              : MODULES[activeModule]?.name}
          </p>
        </div>

        {/* HOME SCREEN */}
        {screen === "home" && (
          <div style={{ paddingTop: 24, paddingBottom: 60 }}>
            <div style={{
              background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)",
              borderRadius: 12, padding: "16px 18px", marginBottom: 28, fontSize: 14, lineHeight: 1.6, color: "#94a3b8"
            }}>
              👋 <span style={{ color: "#e2e8f0" }}>Welcome!</span> I'm your AI Money Mentor. I help you understand your finances, save taxes, and plan for financial independence. Pick a tool below to get started.
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {Object.entries(MODULES).map(([key, mod]) => (
                <button
                  key={key}
                  onClick={() => openModule(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: mod.comingSoon ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${mod.comingSoon ? "#1e293b" : "#334155"}`,
                    borderRadius: 14, padding: "18px 20px",
                    cursor: mod.comingSoon ? "default" : "pointer",
                    textAlign: "left", width: "100%", position: "relative",
                    transition: "all 0.2s ease",
                    opacity: mod.comingSoon ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => { if (!mod.comingSoon) e.currentTarget.style.borderColor = mod.color; }}
                  onMouseLeave={(e) => { if (!mod.comingSoon) e.currentTarget.style.borderColor = "#334155"; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${mod.color}15`, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 24, flexShrink: 0,
                  }}>
                    {mod.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0", marginBottom: 2 }}>
                      {mod.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{mod.desc}</div>
                  </div>
                  {mod.comingSoon && (
                    <span style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 6,
                      background: "#1e293b", color: "#64748b", fontWeight: 600,
                    }}>SOON</span>
                  )}
                  {!mod.comingSoon && (
                    <span style={{ color: "#64748b", fontSize: 18 }}>→</span>
                  )}
                </button>
              ))}
            </div>

            <div style={{
              marginTop: 32, textAlign: "center", fontSize: 12, color: "#475569",
              borderTop: "1px solid #1e293b", paddingTop: 20,
            }}>
              Built for ET AI Hackathon 2026 • AI Money Mentor
            </div>
          </div>
        )}

        {/* ═══ MONEY HEALTH SCORE ═══ */}
        {screen === "module" && activeModule === "health" && !healthResult && (
          <div style={{ paddingTop: 24, paddingBottom: 60 }}>
            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                <span>{healthQuestions[healthStep].dimension}</span>
                <span>{healthStep + 1} / {healthQuestions.length}</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "#1a1a2e", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2, background: "#10B981",
                  width: `${((healthStep + 1) / healthQuestions.length) * 100}%`,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: 14, padding: "24px 20px",
            }}>
              <p style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.5, marginTop: 0, marginBottom: 20, color: "#e2e8f0" }}>
                {healthQuestions[healthStep].q}
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                {healthQuestions[healthStep].options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleHealthAnswer(healthQuestions[healthStep].id, opt.score)}
                    style={{
                      padding: "14px 16px", background: "rgba(255,255,255,0.03)",
                      border: healthAnswers[healthQuestions[healthStep].id] === opt.score
                        ? "1px solid #10B981" : "1px solid #1e293b",
                      borderRadius: 10, color: "#e2e8f0", fontSize: 14,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {screen === "module" && activeModule === "health" && healthResult && (
          <div style={{ paddingTop: 24, paddingBottom: 60 }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: 16, padding: "28px 24px", marginBottom: 20, textAlign: "center",
            }}>
              <AnimatedScore score={healthResult.overall} color={getScoreColor(healthResult.overall)} />
              <div style={{
                fontSize: 18, fontWeight: 700, marginTop: 12,
                color: getScoreColor(healthResult.overall),
              }}>
                {getScoreLabel(healthResult.overall)}
              </div>
              <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Your Financial Health Score</p>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: 14, padding: "20px 20px", marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>
                DIMENSION BREAKDOWN
              </h3>
              {Object.entries(healthResult.dimAverages).map(([dim, avg]) => (
                <DimensionBar key={dim} name={dim} score={avg} />
              ))}
            </div>

            {healthResult.recs.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                borderRadius: 14, padding: "20px 20px",
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 16 }}>
                  AI RECOMMENDATIONS
                </h3>
                {healthResult.recs.map((rec, i) => (
                  <div key={i} style={{
                    padding: "14px 16px", borderRadius: 10, marginBottom: 10,
                    background: rec.priority === "HIGH" ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                    border: `1px solid ${rec.priority === "HIGH" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)"}`,
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: rec.priority === "HIGH" ? "#EF4444" : "#F59E0B",
                        color: "#0a0a1a",
                      }}>{rec.priority}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{rec.dim}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{rec.text}</p>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setHealthStep(0); setHealthAnswers({}); setHealthResult(null); }} style={{
              marginTop: 16, width: "100%", padding: "14px", background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              ↻ Retake Assessment
            </button>
          </div>
        )}

        {/* ═══ TAX WIZARD ═══ */}
        {screen === "module" && activeModule === "tax" && (
          <div style={{ paddingTop: 24, paddingBottom: 60 }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: 14, padding: "24px 20px", marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B", marginTop: 0, marginBottom: 4 }}>
                Enter Your Details
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>
                FY 2025-26 tax comparison • Old vs New regime
              </p>

              <InputField label="Gross Annual Income (₹)" value={taxIncome} onChange={setTaxIncome} placeholder="e.g. 1200000" />

              <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 12, marginTop: 20 }}>
                Deductions (Old Regime)
              </div>
              <InputField label="Section 80C — ELSS, PPF, EPF, LIC, etc. (max ₹1.5L)" value={tax80c} onChange={setTax80c} placeholder="e.g. 150000" />
              <InputField label="Section 80D — Health Insurance Premium (max ₹75K)" value={tax80d} onChange={setTax80d} placeholder="e.g. 25000" />
              <InputField label="80CCD(1B) — NPS Contribution (max ₹50K)" value={taxNps} onChange={setTaxNps} placeholder="e.g. 50000" />
              <InputField label="HRA Exemption (calculated amount)" value={taxHra} onChange={setTaxHra} placeholder="e.g. 180000" />

              <button onClick={runTaxWizard} style={{
                marginTop: 8, width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                border: "none", borderRadius: 10, color: "#0a0a1a",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
                Compare Tax Regimes →
              </button>
            </div>

            {taxResult && (
              <>
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                  borderRadius: 14, padding: "24px 20px", marginBottom: 16, textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                    {taxResult.better === "new" ? "New Regime saves you" : "Old Regime saves you"}
                  </div>
                  <div style={{
                    fontSize: 36, fontWeight: 800,
                    color: "#10B981",
                  }}>
                    {formatINR(Math.abs(taxResult.savings))}
                  </div>
                  <div style={{
                    display: "inline-block", marginTop: 10, padding: "4px 12px",
                    borderRadius: 6, fontSize: 12, fontWeight: 700,
                    background: taxResult.better === "new" ? "rgba(96,165,250,0.1)" : "rgba(245,158,11,0.1)",
                    color: taxResult.better === "new" ? "#60a5fa" : "#F59E0B",
                    border: `1px solid ${taxResult.better === "new" ? "rgba(96,165,250,0.3)" : "rgba(245,158,11,0.3)"}`,
                  }}>
                    {taxResult.better === "new" ? "NEW REGIME WINS" : "OLD REGIME WINS"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Old Regime", data: taxResult.oldResult, color: "#F59E0B" },
                    { label: "New Regime", data: taxResult.newResult, color: "#60a5fa" },
                  ].map((r) => (
                    <div key={r.label} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                      borderRadius: 12, padding: "16px 14px",
                    }}>
                      <div style={{ fontSize: 12, color: r.color, fontWeight: 700, marginBottom: 10 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Deductions</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#e2e8f0" }}>{formatINR(r.data.totalDeductions)}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Taxable Income</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#e2e8f0" }}>{formatINR(r.data.taxableIncome)}</div>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>Tax Payable</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: r.color }}>{formatINR(r.data.tax)}</div>
                    </div>
                  ))}
                </div>

                {taxResult.missedDeductions.length > 0 && (
                  <div style={{
                    background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 14, padding: "20px 20px",
                  }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginTop: 0, marginBottom: 14 }}>
                      ⚠ Missed Deductions (Old Regime)
                    </h3>
                    {taxResult.missedDeductions.map((d, i) => (
                      <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < taxResult.missedDeductions.length - 1 ? "1px solid rgba(239,68,68,0.1)" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{d.name}</span>
                          <span style={{ fontSize: 12, color: "#EF4444" }}>
                            {formatINR(d.used)} / {formatINR(d.max)}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{d.tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ FIRE PLANNER ═══ */}
        {screen === "module" && activeModule === "fire" && (
          <div style={{ paddingTop: 24, paddingBottom: 60 }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
              borderRadius: 14, padding: "24px 20px", marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", marginTop: 0, marginBottom: 4 }}>
                FIRE Calculator
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", marginTop: 0, marginBottom: 20 }}>
                Financial Independence, Retire Early — your path to freedom
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label="Your Age" value={fireAge} onChange={setFireAge} placeholder="25" suffix="yrs" />
                <InputField label="Target Retirement Age" value={fireTargetAge} onChange={setFireTargetAge} placeholder="50" suffix="yrs" />
              </div>
              <InputField label="Monthly Income (₹)" value={fireIncome} onChange={setFireIncome} placeholder="e.g. 100000" />
              <InputField label="Monthly Expenses (₹)" value={fireExpenses} onChange={setFireExpenses} placeholder="e.g. 50000" />
              <InputField label="Current Total Savings & Investments (₹)" value={fireSavings} onChange={setFireSavings} placeholder="e.g. 500000" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label="Expected Inflation" value={fireInflation} onChange={setFireInflation} placeholder="6" suffix="%" />
                <InputField label="Expected Return" value={fireReturn} onChange={setFireReturn} placeholder="12" suffix="%" />
              </div>

              <button onClick={runFIRE} style={{
                marginTop: 8, width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #EF4444, #DC2626)",
                border: "none", borderRadius: 10, color: "#fff",
                fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
                Calculate My FIRE Path 🔥
              </button>
            </div>

            {fireResult && (
              <>
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                  borderRadius: 14, padding: "24px 20px", marginBottom: 16, textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>You need a corpus of</div>
                  <div style={{ fontSize: 34, fontWeight: 800, color: "#EF4444" }}>
                    {formatINR(fireResult.corpusNeeded)}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    to retire at age {parseInt(fireTargetAge) || 50} with current lifestyle (inflation-adjusted)
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Years to FIRE", value: `${fireResult.yearsToRetire} yrs`, color: "#60a5fa" },
                    { label: "Savings Rate", value: `${fireResult.savingsRate}%`, color: fireResult.savingsRate >= 50 ? "#10B981" : fireResult.savingsRate >= 30 ? "#F59E0B" : "#EF4444" },
                    { label: "Current Savings (FV)", value: formatINR(fireResult.fvCurrentSavings), color: "#8B5CF6" },
                    { label: "Gap to Fill", value: formatINR(fireResult.gap), color: "#F97316" },
                  ].map((item) => (
                    <div key={item.label} style={{
                      background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                      borderRadius: 12, padding: "14px",
                    }}>
                      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 14, padding: "20px 20px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Monthly SIP Needed to Reach FIRE</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "#10B981" }}>
                    {formatINR(fireResult.monthlySIP)}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                    per month at {fireReturn}% expected return
                  </div>
                </div>

                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid #1e293b",
                  borderRadius: 14, padding: "20px 20px", marginTop: 16,
                }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginTop: 0, marginBottom: 14 }}>
                    SUGGESTED ALLOCATION
                  </h3>
                  {[
                    { name: "Equity Index Fund (Nifty 50 / Next 50)", pct: 50, color: "#60a5fa" },
                    { name: "Mid/Small Cap Fund", pct: 20, color: "#8B5CF6" },
                    { name: "Debt Fund / PPF / EPF", pct: 20, color: "#10B981" },
                    { name: "Gold ETF / International Equity", pct: 10, color: "#F59E0B" },
                  ].map((a) => (
                    <div key={a.name} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: "#cbd5e1" }}>{a.name}</span>
                        <span style={{ color: a.color, fontWeight: 700 }}>{formatINR(Math.round(fireResult.monthlySIP * a.pct / 100))}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "#1a1a2e", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, background: a.color, width: `${a.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {fireResult.savingsRate < 30 && (
                  <div style={{
                    background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
                    borderRadius: 14, padding: "16px 18px", marginTop: 16,
                  }}>
                    <p style={{ fontSize: 13, color: "#f87171", margin: 0, lineHeight: 1.6 }}>
                      ⚠ Your savings rate is {fireResult.savingsRate}%. For FIRE, you ideally need 50%+. Consider reducing discretionary expenses or increasing income to accelerate your path.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
