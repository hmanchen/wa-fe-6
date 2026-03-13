const fmt = (n) => n?.toLocaleString("en-US") ?? "0";

export default function RecommendationsSummaryBar({ summary }) {
  const pct = Math.min(summary.budgetUtilizationPercent || 0, 100);
  const barColor = pct < 80 ? "#4A7C6F" : pct < 100 ? "#D48B2E" : "#3B6CB7";

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E4DC",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <p
        style={{
          color: "#1B2B4B",
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {summary.overallNarrative}
      </p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ color: "#6B7280", fontSize: 13 }}>Monthly commitment</span>
          <span style={{ color: "#1B2B4B", fontSize: 13, fontWeight: 600 }}>
            ${fmt(summary.totalMonthlyCommitment)}/mo of ${fmt(summary.monthlyAvailable)} available
          </span>
        </div>
        <div style={{ height: 6, background: "#F4F1EC", borderRadius: 4 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: barColor,
              borderRadius: 4,
              transition: "width 800ms ease",
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {summary.recoverableCashFlowCoversAll && (
          <span
            style={{
              background: "rgba(74,124,111,0.10)",
              border: "1px solid rgba(74,124,111,0.25)",
              color: "#4A7C6F",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Funded from recovered cash flow ✓
          </span>
        )}
        <span
          style={{
            background: "#F8F7F4",
            color: "#4A5568",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
          }}
        >
          {summary.urgencyStatement}
        </span>
      </div>
    </div>
  );
}
