import React from "react";

const polarToCartesian = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const describeArc = (cx, cy, r, start, end) => {
  if (end <= start) return "";
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, Math.min(end, 359.9));
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
};

export default function ExposureHeader({ summary, recCount, caseData }) {
  const fmt = (n) => "$" + (n || 0).toLocaleString("en-US");

  const available = summary?.monthlyAvailable || summary?.monthly_available_surplus || 0;
  const commitment = summary?.totalMonthlyCommitment || summary?.total_monthly_committed || 0;
  const remaining = Math.max(available - commitment, 0);
  const utilPct = available > 0 ? Math.min(Math.round((commitment / available) * 100), 100) : 0;
  const surplusRemaining = summary?.surplus_remaining || summary?.surplusRemaining || remaining || 0;
  const hasUnmetNeeds =
    (Number(caseData?.emergency_fund_gap || 0) > 0)
    || (Number(caseData?.life_insurance_gap || 0) > 0)
    || (Number(caseData?.net_worth || caseData?.netWorth || 0) < 10_000);
  const remainingChipStyle = hasUnmetNeeds && surplusRemaining > 500
    ? {
        color: "#B8860B",
        bg: "rgba(212,165,32,0.12)",
        border: "1px solid rgba(212,165,32,0.35)",
        text: `⚠️ ${fmt(surplusRemaining)}/mo Still Unallocated`,
      }
    : {
        color: "#4A7C6F",
        bg: "rgba(74,124,111,0.10)",
        border: "1px solid rgba(74,124,111,0.30)",
        text: `✓ ${fmt(surplusRemaining)}/mo Remaining Flexibility`,
      };
  const deployedPct = summary?.surplus_deployed_pct || summary?.surplusDeployedPct || utilPct || 0;
  const gaugeColor = deployedPct < 50 ? "#D4A520" : deployedPct < 85 ? "#3B6CB7" : "#4A7C6F";
  const gaugeLabel = deployedPct < 50
    ? "Plan incomplete — more gaps to address"
    : deployedPct < 85
      ? "Strong foundation building"
      : "Fully deployed toward your goals";

  const firstName = caseData?.firstName || caseData?.first_name || caseData?.client_name?.split(" ")[0] || "";

  const protPct = Math.min(deployedPct * 1.2, 100);
  const retPct = Math.min(deployedPct * 0.8, 100);
  const cfPct = Math.min(deployedPct, 100);

  const cx = 80;
  const cy = 80;

  const chips = [
    { label: `\u2713  ${recCount} Opportunities Identified`, color: "#4A7C6F" },
    { label: `${fmt(commitment)}/mo  Total Investment`, color: "#3B6CB7" },
    { label: remainingChipStyle.text, color: remainingChipStyle.color, bg: remainingChipStyle.bg, border: remainingChipStyle.border },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFFFF 0%, #F0EDE8 100%)",
        border: "1px solid #E8E4DC",
        borderLeft: "4px solid #4A7C6F",
        borderRadius: 16,
        padding: "28px 32px",
        marginBottom: 24,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        display: "flex",
        gap: 32,
        alignItems: "center",
      }}
    >
      <div style={{ flex: "0 0 55%" }}>
        <div
          style={{
            fontSize: 11,
            color: "#4A7C6F",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Your Personalized Financial Blueprint
        </div>

        <h2
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1B2B4B",
            margin: "0 0 10px 0",
            lineHeight: 1.2,
          }}
        >
          {firstName ? `${firstName}'s Financial Blueprint` : "Your Financial Blueprint"}
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "#4A5568",
            lineHeight: 1.7,
            marginBottom: 20,
            fontWeight: 400,
          }}
        >
          Based on your complete financial profile, we identified{" "}
          <strong style={{ color: "#1B2B4B" }}>{recCount} high-impact opportunities</strong> to strengthen your
          financial foundation.
        </p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {chips.map((chip, i) => (
            <span
              key={i}
              style={{
                background: chip.bg || `${chip.color}1A`,
                border: chip.border || `1px solid ${chip.color}40`,
                color: chip.color,
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          flex: "0 0 45%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg width="160" height="160" viewBox="0 0 160 160">
          {[
            [60, "#E8E4DC"],
            [44, "#E8E4DC"],
            [28, "#E8E4DC"],
          ].map(([r, c], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth="10" />
          ))}
          <path d={describeArc(cx, cy, 60, 0, protPct * 3.6)} fill="none" stroke={gaugeColor} strokeWidth="10" strokeLinecap="round" />
          <path d={describeArc(cx, cy, 44, 0, retPct * 3.6)} fill="none" stroke={gaugeColor} strokeOpacity="0.8" strokeWidth="10" strokeLinecap="round" />
          <path d={describeArc(cx, cy, 28, 0, cfPct * 3.6)} fill="none" stroke={gaugeColor} strokeOpacity="0.65" strokeWidth="10" strokeLinecap="round" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#1B2B4B">
            {deployedPct}%
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#718096" letterSpacing="1">
            DEPLOYED
          </text>
        </svg>

        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#718096" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: gaugeColor }} />
            Deployment Gauge
          </div>
        </div>
        <div style={{ marginTop: 10, color: "#718096", fontSize: 12, textAlign: "center" }}>
          {gaugeLabel}
        </div>
      </div>
    </div>
  );
}
