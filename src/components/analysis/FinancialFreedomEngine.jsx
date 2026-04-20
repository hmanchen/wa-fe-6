function toNum(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function FinancialFreedomEngine(props) {
  const xcurveData = props?.xcurveData || {};
  const xcurve =
    xcurveData?.data ||
    xcurveData ||
    props?.fullAnalysis?.xcurve?.data ||
    props?.fullAnalysis?.xcurve ||
    {};
  const crossingPointAge = toNum(
    props?.crossingPointAge ||
      xcurve.crossing_age ||
      xcurve.crossingAge ||
      xcurve.crossover_age ||
      xcurve.crossoverAge ||
      xcurve.cross_age ||
      xcurve.crossAge ||
      xcurve.crossing_point_age ||
      xcurve.crossingPointAge
  );
  const hasCrossingPoint = crossingPointAge > 0;

  return (
    <div
      style={{
        background: "#F0F7F4",
        border: "1px solid rgba(74,124,111,0.25)",
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 12, color: "#4A7C6F", fontWeight: 700 }}>
        📊 Financial Freedom Timeline
      </div>
      <div style={{ fontSize: 12, color: "#4A5568", marginTop: 4 }}>
        {hasCrossingPoint ? (
          <>
            Based on your financial profile, your money and responsibility lines cross at age{" "}
            <strong>{String(crossingPointAge)}</strong>. See your complete timeline on the{" "}
          </>
        ) : (
          <>
            At current savings rate, your financial crossing point extends beyond our 90-year planning horizon.
            Accelerating retirement savings can move this date closer. See your complete timeline on the{" "}
          </>
        )}
        <span
          onClick={() => props?.onNavigate?.("xcurve")}
          style={{ color: "#4A7C6F", cursor: "pointer", textDecoration: "underline" }}
        >
          Financial X Curve →
        </span>
      </div>
    </div>
  );
}
