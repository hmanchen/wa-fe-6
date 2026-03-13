import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GraduationCap } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { recommendationsService } from "../../services/recommendationsService";

const fmt = (n) => "$" + (n || 0).toLocaleString("en-US");

export default function CollegeFundingScreen({ caseId, caseData, recommendation, onBack }) {
  const clientChildren = extractChildren(caseData);
  const defaultContribution = Math.max(
    Math.round((((caseData?.monthly_surplus || caseData?.monthlySurplus || 400) * 0.10) / 50)) * 50,
    200
  );
  const [monthlyContrib, setMonthlyContrib] = useState(defaultContribution);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await recommendationsService.fetchCollegeProjection(caseId, monthlyContrib);
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setError(e?.message || "Unable to load education projection");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (caseId) run();
    return () => {
      mounted = false;
    };
  }, [caseId, monthlyContrib]);

  const children = data?.children || [];
  const c1 = clientChildren[0];
  const c2 = clientChildren[1];

  const waitLoss = useMemo(() => {
    const childrenData = children;
    if (!childrenData.length) return { now: 0, in1y: 0, in2y: 0 };
    const baseValue = childrenData[0]?.iul_value_at_college || 0;
    const ytc = childrenData[0]?.years_to_college || 9;
    const monthly = monthlyContrib / (childrenData.length || 1);
    const annualGrowth = monthly * 12 * 0.065;
    const in1y = Math.max(baseValue - annualGrowth * 1.065 ** (ytc - 1), 0);
    const in2y = Math.max(baseValue - annualGrowth * 1.065 ** (ytc - 2) * 2, 0);
    return {
      now: baseValue,
      in1y,
      in2y,
    };
  }, [children, monthlyContrib]);

  return (
    <div style={{ background: "#F8F7F4", minHeight: "100%", padding: 24 }}>
      <button
        onClick={onBack}
        style={{
          border: "none",
          background: "none",
          color: "#4A7C6F",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={14} />
        Back to Recommendations
      </button>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E8E4DC",
          borderLeft: "4px solid #3B6CB7",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <GraduationCap size={28} color="#4A7C6F" />
          <h2 style={{ margin: 0, color: "#1B2B4B", fontSize: 24 }}>IUL Education Funding Illustration</h2>
        </div>
        <p style={{ margin: "0 0 12px 0", color: "#4A5568", lineHeight: 1.7 }}>
          {c1
            ? `${c1.name} is ${c1.age} today. You have ${Math.max(18 - c1.age, 1)} years to prepare.`
            : "Your education funding projection is being prepared."}
          {c2 ? ` ${c2.name} is ${c2.age}, with ${Math.max(18 - c2.age, 1)} years to prepare.` : ""}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {c1 && <Chip text={`${fmt(c1.iul_value_at_college)} available for ${c1.name}`} color="#4A7C6F" />}
          {c2 && <Chip text={`${fmt(c2.iul_value_at_college)} available for ${c2.name}`} color="#3B6CB7" />}
          <Chip text="Fully funded by existing cash flow" color="#D4A520" />
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>Monthly IUL Contribution for Education</div>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={monthlyContrib}
          onChange={(e) => setMonthlyContrib(Number(e.target.value))}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#718096" }}>
          <span>$100</span>
          <span style={{ color: "#1B2B4B", fontWeight: 700 }}>{fmt(monthlyContrib)}/mo</span>
          <span>$1,000</span>
        </div>
      </div>

      {loading && <Banner text="Loading updated projection..." />}
      {error && <Banner text={error} tone="error" />}

      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: children.length > 1 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: 16 }}>
            {children.map((child) => (
              <ChildCard key={child.name} child={child} />
            ))}
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderRadius: 12,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ background: "#1B2B4B", color: "#fff", padding: "10px 12px", fontWeight: 700 }}>
              Why IUL Beats a 529 for Your Family
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead style={{ background: "#F8F7F4" }}>
                <tr>
                  {["Feature", "529 Plan", "IUL - Your Strategy"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#4A5568" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows(data).map((r) => (
                  <tr key={r.feature} style={{ borderTop: "1px solid #F0ECE5" }}>
                    <td style={{ padding: "8px 12px", color: "#1B2B4B", fontWeight: 600 }}>{r.feature}</td>
                    <td style={{ padding: "8px 12px", color: r.leftBad ? "#D4A520" : "#4A5568" }}>{r.left}</td>
                    <td style={{ padding: "8px 12px", background: "#F0F7F4", color: r.rightGood ? "#4A7C6F" : "#4A5568" }}>{r.right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E8E4DC",
              borderLeft: "4px solid #D4A520",
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>The Cost of Waiting - Every Month Counts</div>
            <WaitRow label="Starting today" value={waitLoss.now} />
            <WaitRow label="Starting in 1 year" value={waitLoss.in1y} loss={waitLoss.now - waitLoss.in1y} />
            <WaitRow label="Starting in 2 years" value={waitLoss.in2y} loss={waitLoss.now - waitLoss.in2y} />
          </div>
        </>
      )}
    </div>
  );
}

function ChildCard({ child }) {
  const chartData = child.yearly_accumulation || [];
  const tuitionLine = (child.total_college_cost_projected || 0);
  const crossing = chartData.find((d) => (d.iul_value || 0) >= tuitionLine);

  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E8E4DC", borderRadius: 12, padding: 14 }}>
      <div style={{ color: "#1B2B4B", fontWeight: 700, marginBottom: 8 }}>
        {child.name} - Class of {child.college_year}
      </div>
      {hasValidProjection(child) ? (
        <div style={{ fontSize: 28, color: "#4A7C6F", fontWeight: 800 }}>{fmt(child.iul_value_at_college)}</div>
      ) : (
        <div style={{ color: "#D4A520", fontSize: 13, fontStyle: "italic", padding: "8px 0" }}>
          Calculating projection... adjusting contribution to find optimal starting amount.
        </div>
      )}
      <div style={{ fontSize: 12, color: "#718096", marginBottom: 8 }}>Available through IUL at age 18</div>
      <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 4 }}>Projected tuition cost: {fmt(child.total_college_cost_projected)}</div>
      <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 10 }}>Surplus after 4 years: {fmt(child.iul_surplus_deficit)}</div>
      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid stroke="#EFEAE0" />
            <XAxis dataKey="year" />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Area type="monotone" dataKey="iul_value" stroke="#4A7C6F" fill="rgba(74,124,111,0.16)" />
            <ReferenceLine y={tuitionLine} stroke="#D4A520" strokeDasharray="4 4" />
            {crossing && <ReferenceLine x={crossing.year} stroke="#3B6CB7" strokeDasharray="3 3" />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function comparisonRows(data) {
  const first = data?.children?.[0] || {};
  return [
    { feature: "Tax-free growth", left: "✓", right: "✓", rightGood: true },
    { feature: "Protection if parent dies", left: "✗", right: `✓ ${fmt(data?.inputs?.monthly_premium_per_child ? first.iul_value_at_college : 0)}`, leftBad: true, rightGood: true },
    { feature: "Income if parent disabled", left: "✗", right: "✓ Living benefits", leftBad: true, rightGood: true },
    { feature: "FAFSA impact", left: "Counted as asset", right: "Not counted", leftBad: true, rightGood: true },
    { feature: "Penalty if unused", left: "10% + tax", right: "None - becomes retirement", leftBad: true, rightGood: true },
    { feature: "Retirement income", left: "✗", right: "✓ Policy-loan eligible", leftBad: true, rightGood: true },
    { feature: "Market loss risk", left: "Yes", right: "No (0% floor)", leftBad: true, rightGood: true },
    { feature: "Contribution limits", left: "$18,000/yr", right: "No fixed cap", rightGood: true },
  ];
}

function Chip({ text, color }) {
  return (
    <span style={{ background: `${color}1A`, border: `1px solid ${color}40`, color, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>
      {text}
    </span>
  );
}

function Banner({ text, tone = "info" }) {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${tone === "error" ? "#D4A520" : "#E8E4DC"}`, borderRadius: 10, padding: "10px 14px", color: "#4A5568", marginBottom: 12 }}>
      {text}
    </div>
  );
}

function WaitRow({ label, value, loss }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: "#4A5568" }}>{label}: {fmt(value)} available</span>
      {typeof loss === "number" && loss > 0 ? (
        <span style={{ background: "rgba(212,165,32,0.12)", color: "#D4A520", borderRadius: 16, padding: "2px 10px", fontWeight: 700 }}>
          -{fmt(loss)}
        </span>
      ) : (
        <span style={{ color: "#718096", fontSize: 12 }}>Compounding window remains open</span>
      )}
    </div>
  );
}

function hasValidProjection(childData) {
  return (childData?.iul_value_at_college || 0) > 0;
}

function extractChildren(cd) {
  const raw =
    cd?.children ||
    cd?.dependents ||
    cd?.financial_background?.children ||
    cd?.financialBackground?.children ||
    [];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((c, i) => ({
      name: c?.name || c?.childName || `Child ${i + 1}`,
      age: parseInt(c?.age || c?.current_age || c?.childAge || 0, 10),
    }))
    .filter((c) => !Number.isNaN(c.age));
}

