export default function StretchOpportunityCard({
  monthlyAvailable,
  totalNeeded,
  firstName,
}) {
  const shortage = Math.max((totalNeeded || 0) - (monthlyAvailable || 0), 0);
  const stretchAmount = Math.max((monthlyAvailable || 0) * 0.15, 50);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #FFFBF0 0%, #FFF5D6 100%)",
        border: "1px solid #D4A52040",
        borderLeft: "4px solid #D4A520",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }} role="img" aria-label="stretch">
          {"\uD83D\uDCAA"}
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1B2B4B", marginBottom: 4 }}>
            {firstName || "Client"}, Your Future Is Worth the Stretch
          </div>
          <div style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.6 }}>
            Your current available surplus is{" "}
            <strong>${(monthlyAvailable || 0).toLocaleString()}/mo</strong>. The full plan costs{" "}
            <strong>${(totalNeeded || 0).toLocaleString()}/mo</strong>. We adjusted recommendations to fit what
            you have today and showed how to close the gap over 6-12 months by redirecting just{" "}
            <strong>${stretchAmount.toLocaleString()}/mo more</strong>.
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 8,
          padding: "12px 16px",
          border: "1px solid #D4A52020",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "#D4A520", marginBottom: 8 }}>
          THREE WAYS TO FIND ${stretchAmount.toLocaleString()}/MO MORE:
        </div>
        {[
          "Reduce one dining-out occasion per week (~$60-80/mo)",
          "Cancel 2 unused subscriptions (~$30-50/mo)",
          "Redirect a small raise or bonus directly to your plan",
        ].map((tip, i) => (
          <div
            key={i}
            style={{
              fontSize: 12,
              color: "#4A5568",
              marginBottom: 4,
              display: "flex",
              gap: 8,
            }}
          >
            <span style={{ color: "#D4A520" }}>{"\u2192"}</span>
            {tip}
          </div>
        ))}
        {shortage > 0 && (
          <div style={{ fontSize: 11, color: "#718096", marginTop: 8 }}>
            Current uncovered monthly gap: ${shortage.toLocaleString()}/mo.
          </div>
        )}
      </div>
    </div>
  );
}

