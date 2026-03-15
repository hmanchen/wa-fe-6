import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, TrendingDown, Zap, Star } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Line,
} from "recharts";
import { recommendationsService } from "../../services/recommendationsService";

const fmtUSD = (n) => `$${Math.round(Number(n || 0)).toLocaleString("en-US")}`;

const STRATEGY_META = {
  "Avalanche Method": { icon: TrendingDown, color: "#4A7C6F", key: "avalanche" },
  "Snowball Method": { icon: Zap, color: "#3B6CB7", key: "snowball" },
  "Hybrid Power Method": { icon: Star, color: "#D4A520", key: "hybrid" },
};

export default function DebtFreedomScreen({ caseId, caseData, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeName, setActiveName] = useState("Hybrid Power Method");
  const [sliderExtra, setSliderExtra] = useState(200);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await recommendationsService.fetchDebtPayoffStrategies(caseId, undefined);
        if (!mounted) return;
        setData(res);
        const extra = Number(res?.summary?.extra_monthly || 200);
        setSliderExtra(extra);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || "Unable to load debt payoff strategies");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (caseId) run();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const strategies = data?.strategies || [];
  const minimumOnly = data?.minimum_only_scenario || {};
  const summary = data?.summary || {};
  const active = strategies.find((s) => s.name === activeName) || strategies.find((s) => s.name === "Hybrid Power Method") || strategies[0] || null;
  const firstName = caseData?.firstName || caseData?.first_name || "Client";

  const chartData = useMemo(() => {
    const mapByMonth = new Map();
    const byName = Object.fromEntries(strategies.map((s) => [s.name, s]));
    const names = ["Avalanche Method", "Snowball Method", "Hybrid Power Method"];
    for (const sName of names) {
      const schedule = byName[sName]?.monthly_schedule || [];
      for (const row of schedule) {
        const month = Number(row.month || 0);
        if (!mapByMonth.has(month)) mapByMonth.set(month, { month });
        mapByMonth.get(month)[STRATEGY_META[sName].key] = Number(row.remaining_balance || 0);
      }
    }
    for (const row of minimumOnly?.monthly_schedule || []) {
      const month = Number(row.month || 0);
      if (!mapByMonth.has(month)) mapByMonth.set(month, { month });
      mapByMonth.get(month).minOnly = Number(row.remaining_balance || 0);
    }
    return Array.from(mapByMonth.values())
      .sort((a, b) => a.month - b.month)
      .map((r) => ({
        month: r.month,
        avalanche: r.avalanche ?? 0,
        snowball: r.snowball ?? 0,
        hybrid: r.hybrid ?? 0,
        minOnly: r.minOnly ?? 0,
      }));
  }, [strategies, minimumOnly]);

  const debts = useMemo(() => extractDebtsFromCase(caseData), [caseData]);
  const liveResults = useMemo(() => {
    const av = computeSimplePayoff(debts, sliderExtra, "avalanche");
    const sn = computeSimplePayoff(debts, sliderExtra, "snowball");
    const hy = computeSimplePayoff(debts, sliderExtra, "hybrid");
    return { av, sn, hy };
  }, [debts, sliderExtra]);

  const fastestMonths = Number(summary?.fastest_months || 0);
  const minOnlyMonths = Number(minimumOnly?.months_to_debt_free || 0);
  const extraYears = Math.max(Math.round((minOnlyMonths - fastestMonths) / 12), 0);

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100%", padding: 24 }}>
      <button
        onClick={onBack}
        style={{ border: "none", background: "none", color: "#4A7C6F", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}
      >
        <ArrowLeft size={14} />
        Back to Recommendations
      </button>

      <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderLeft: "4px solid #D4A520", borderRadius: 16, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 11, color: "#D4A520", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, marginBottom: 6 }}>Your Debt Freedom Roadmap</div>
        <h2 style={{ margin: 0, color: "#1B2B4B", fontSize: 26 }}>{firstName}, You Can Be Completely Debt-Free</h2>
        <p style={{ color: "#4A5568", fontSize: 14, lineHeight: 1.7 }}>
          You have {fmtUSD(summary.total_debt)} in outstanding debt and {fmtUSD(summary.extra_monthly)}/mo in available cash flow. Here are 3 proven strategies - pick the one that fits your personality and we will track it to zero.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Chip color="#4A7C6F" text={`Fastest: Debt-free in ${summary.fastest_months || 0} months`} />
          <Chip color="#D4A520" text={`Max savings: ${fmtUSD(summary.max_interest_saved)}`} />
          <Chip color="#3B6CB7" text={`vs. minimum only: ${extraYears} extra years`} />
        </div>
      </div>

      {loading && <Banner text="Building debt strategy options..." />}
      {error && <Banner text={error} tone="error" />}

      {!loading && !error && active && (
        <>
          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: "10px 12px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {strategies.map((s) => {
              const meta = STRATEGY_META[s.name] || STRATEGY_META["Hybrid Power Method"];
              const Icon = meta.icon;
              const activeTab = s.name === active.name;
              return (
                <button
                  key={s.name}
                  onClick={() => setActiveName(s.name)}
                  style={{
                    border: "none",
                    borderBottom: activeTab ? `3px solid ${meta.color}` : "3px solid transparent",
                    background: "transparent",
                    padding: "8px 6px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: activeTab ? "#1B2B4B" : "#718096", fontWeight: 700, fontSize: 13 }}>
                    <Icon size={14} color={meta.color} />
                    {s.name.replace(" Method", "")}
                    {s.badge ? " ✓" : ""}
                  </div>
                  {activeTab && <div style={{ fontSize: 11, color: "#4A5568", marginTop: 4 }}>{s.tagline}</div>}
                </button>
              );
            })}
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderLeft: `4px solid ${active.color}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #F4F1EC", marginBottom: 12 }}>
              <Metric title="Debt-Free Date" value={active.debt_free_date} sub={`${active.months_to_debt_free} months from today`} />
              <Metric title="Monthly Commitment" value={`${fmtUSD(active.monthly_payment)}/mo`} sub="Includes minimums + extra payment" emphasize color={active.color} />
              <Metric title="Interest Saved" value={fmtUSD(active.interest_saved_vs_minimum)} sub="vs. paying minimums only" color="#D4A520" />
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: "#1B2B4B", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your Payoff Sequence</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(active.debt_payoff_order || []).map((name, i) => (
                  <div key={name + i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: `${active.color}15`, color: active.color, border: `1px solid ${active.color}40`, borderRadius: 18, padding: "5px 10px", fontSize: 12, fontWeight: 600 }}>
                      {name}
                    </span>
                    {i < active.debt_payoff_order.length - 1 && <span style={{ color: "#718096", fontSize: 12 }}>then {"\u2192"}</span>}
                  </div>
                ))}
                <span style={{ color: "#4A7C6F", fontSize: 13, fontWeight: 700 }}>{"\uD83C\uDF89"} FREE</span>
              </div>
            </div>

            <div>
              <div style={{ color: "#1B2B4B", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Milestones Timeline</div>
              <div style={{ borderLeft: `2px solid ${active.color}40`, paddingLeft: 12 }}>
                {(active.milestone_months || []).map((m, i) => (
                  <div key={i} style={{ marginBottom: 8, color: "#4A5568", fontSize: 12 }}>
                    <strong style={{ color: active.color }}>Month {m.month}</strong> — {m.event}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 12, marginBottom: 14, height: 300 }}>
            <div style={{ fontSize: 13, color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>Your Balance Drops to Zero</div>
            <ResponsiveContainer width="100%" height="92%">
              <AreaChart data={chartData}>
                <CartesianGrid stroke="#EFEAE0" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => fmtUSD(v)} />
                <Legend />
                <Area type="monotone" dataKey="avalanche" stroke="#4A7C6F" fill="rgba(74,124,111,0.20)" name="Avalanche" />
                <Area type="monotone" dataKey="snowball" stroke="#3B6CB7" fill="rgba(59,108,183,0.14)" name="Snowball" />
                <Area type="monotone" dataKey="hybrid" stroke="#D4A520" fill="rgba(212,165,32,0.20)" name="Hybrid" />
                <Line type="monotone" dataKey="minOnly" stroke="#FF6B6B" strokeDasharray="4 4" dot={false} name="Minimum Only" />
                {strategies.map((s) => (
                  <ReferenceLine key={s.name} x={s.months_to_debt_free} stroke={s.color} strokeDasharray="3 3" />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E8E4DC", borderRadius: 12, padding: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "#1B2B4B", marginBottom: 8 }}>What if you added a little more each month?</div>
            <input type="range" min={0} max={Math.max((summary.extra_monthly || 200) * 3, 300)} step={50} value={sliderExtra} onChange={(e) => setSliderExtra(Number(e.target.value))} style={{ width: "100%" }} />
            <div style={{ fontSize: 12, color: "#718096", marginBottom: 8 }}>Extra Monthly Payment: <strong style={{ color: "#1B2B4B" }}>{fmtUSD(sliderExtra)}/mo</strong></div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip color="#4A7C6F" text={`Avalanche: ${liveResults.av.months} months`} />
              <Chip color="#3B6CB7" text={`Snowball: ${liveResults.sn.months} months`} />
              <Chip color="#D4A520" text={`Hybrid: ${liveResults.hy.months} months`} />
            </div>
          </div>

          <div style={{ background: "#FFFBF0", border: "1px solid #D4A52040", borderLeft: "4px solid #D4A520", borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ color: "#D4A520", fontWeight: 700, marginBottom: 6 }}>{"\u26A0\uFE0F"} What Happens If You Only Pay Minimums</div>
            <div style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.6 }}>
              <div>Time to debt-free: {minimumOnly.months_to_debt_free || 0} months ({Math.round((minimumOnly.months_to_debt_free || 0) / 12)} years)</div>
              <div>Total interest paid: {fmtUSD(minimumOnly.total_interest_paid)}</div>
              <div>Additional cost vs. Hybrid: {fmtUSD((minimumOnly.total_interest_paid || 0) - (strategies.find((s) => s.name === "Hybrid Power Method")?.total_interest_paid || 0))}</div>
            </div>
            <div style={{ fontSize: 12, color: "#D4A520", fontStyle: "italic", marginTop: 8 }}>
              Paying only minimums on {fmtUSD(summary.total_debt)} in debt will cost you {fmtUSD(minimumOnly.total_interest_paid)} in interest alone over {Math.round((minimumOnly.months_to_debt_free || 0) / 12)} years.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <Insight title="The Momentum Effect" text="Every debt you eliminate permanently redirects that payment toward the next debt. Your payoff speed accelerates automatically - called the debt roll." />
            <Insight title="The Hidden Income" text={`When your last debt is paid off, ${fmtUSD(summary.total_min_payments)}/mo becomes permanent additional income with no lifestyle change.`} />
            <Insight title="The True Cost" text={`At your weighted APR, this debt costs about ${fmtUSD(weightedMonthlyInterest(debts))}/mo in interest charges alone.`} />
          </div>
        </>
      )}
    </div>
  );
}

function extractDebtsFromCase(caseData) {
  const raw = [
    ...(caseData?.financial_background?.primary_background?.debts?.entries || []),
    ...(caseData?.financial_background?.spouse_background?.debts?.entries || []),
    ...(caseData?.debts?.entries || []),
  ];
  return raw
    .map((d, i) => ({
      name: d?.name || d?.description || d?.type || `Debt ${i + 1}`,
      balance: Number(d?.balance || d?.current_balance || 0),
      apr: Number(d?.apr || d?.interest_rate || 0),
      min_payment: Number(d?.min_payment || d?.monthly_payment || 0),
      debt_type: d?.debt_type || d?.type || "other",
    }))
    .filter((d) => d.balance > 0);
}

function computeSimplePayoff(debts, extraPayment, strategy) {
  const items = debts.map((d) => ({ ...d, apr: d.apr > 1 ? d.apr / 100 : d.apr || 0.1 }));
  let month = 0;
  const maxMonths = 600;
  while (month < maxMonths && items.some((d) => d.balance > 1)) {
    month += 1;
    items.forEach((d) => {
      if (d.balance <= 0) return;
      d.balance += d.balance * (d.apr / 12);
      d.balance -= Math.min(d.balance, d.min_payment || Math.max(25, d.balance * 0.015));
    });
    const alive = items.filter((d) => d.balance > 1);
    if (!alive.length) break;
    if (strategy === "snowball") alive.sort((a, b) => a.balance - b.balance);
    else if (strategy === "avalanche") alive.sort((a, b) => b.apr - a.apr);
    else alive.sort((a, b) => b.apr - a.apr);
    if (strategy === "hybrid" && alive.length > 1) {
      alive[0].balance -= Math.min(alive[0].balance, extraPayment * 0.7);
      alive[alive.length - 1].balance -= Math.min(alive[alive.length - 1].balance, extraPayment * 0.3);
    } else {
      alive[0].balance -= Math.min(alive[0].balance, extraPayment);
    }
  }
  return { months: month };
}

function weightedMonthlyInterest(debts) {
  return debts.reduce((s, d) => {
    const apr = Number(d.apr || 0);
    const rate = apr > 1 ? apr / 100 : apr;
    return s + (Number(d.balance || 0) * rate) / 12;
  }, 0);
}

function Banner({ text, tone = "info" }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${tone === "error" ? "#D4A520" : "#E8E4DC"}`, borderRadius: 10, padding: "10px 14px", color: "#4A5568", marginBottom: 12 }}>
      {text}
    </div>
  );
}

function Chip({ text, color }) {
  return (
    <span style={{ background: `${color}1A`, border: `1px solid ${color}40`, color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
      {text}
    </span>
  );
}

function Metric({ title, value, sub, emphasize = false, color = "#1B2B4B" }) {
  return (
    <div style={{ padding: "12px 14px", borderRight: "1px solid #F4F1EC", textAlign: "center", background: emphasize ? `${color}0F` : "#fff" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: "#A0AEC0", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#718096" }}>{sub}</div>
    </div>
  );
}

function Insight({ title, text }) {
  return (
    <div style={{ background: "#FDFCFA", border: "1px solid #E8E4DC", borderRadius: 10, padding: 12 }}>
      <div style={{ color: "#1B2B4B", fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{title}</div>
      <div style={{ color: "#718096", fontSize: 12, lineHeight: 1.6 }}>{text}</div>
    </div>
  );
}

