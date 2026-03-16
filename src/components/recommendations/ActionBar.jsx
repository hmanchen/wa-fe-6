export default function ActionBar({
  totalCommitment,
  monthlyAvailable,
  onContinue,
  onRegenerate,
  summary,
  caseData,
}) {
  const fmt = (n) => "$" + (n || 0).toLocaleString("en-US");
  const remaining = Math.max((monthlyAvailable || 0) - (totalCommitment || 0), 0);
  const pct =
    monthlyAvailable > 0 ? Math.min(Math.round((totalCommitment / monthlyAvailable) * 100), 100) : 0;
  const firstName = caseData?.firstName || caseData?.first_name || caseData?.client_name?.split(" ")[0] || "Your";
  const totalExposure = summary?.totalExposureWithoutAction || 0;

  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: "#FFFFFF",
        borderTop: "2px solid #4A7C6F",
        padding: "14px 28px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
        zIndex: 5,
      }}
    >
      <div style={{ flex: "0 0 auto", minWidth: 200 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2B4B" }}>
          {firstName}'s plan: {fmt(totalCommitment)}/mo secures {fmt(totalExposure)} in financial protection
        </div>
        <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>{fmt(remaining)}/mo of your surplus stays available</div>
      </div>

      <div style={{ flex: 1, maxWidth: 300 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#A0AEC0",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 5,
              textAlign: "center",
            }}
          >
            {pct}% of monthly capacity invested in your future
          </div>
          <div style={{ height: 6, background: "#F4F1EC", borderRadius: 4, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: pct >= 90 ? "linear-gradient(90deg, #4A7C6F, #D4A520)" : "#4A7C6F",
                borderRadius: 4,
                transition: "width 800ms ease",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          onClick={onRegenerate}
          style={{
            background: "#fff",
            border: "1px solid #E8E4DC",
            borderRadius: 8,
            color: "#4A5568",
            fontSize: 12,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          {"\u21BB"} Recalculate
        </button>
        <button
          onClick={onContinue}
          style={{
            background: "#4A7C6F",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(74,124,111,0.35)",
          }}
        >
          Continue to Delivery {"\u2192"}
        </button>
      </div>
    </div>
  );
}
