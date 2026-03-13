import { money } from "../utils";

export default function ProtectionSection({ data }) {
  const p = data?.protectionAnalysis || {};
  return (
    <div className="space-y-3">
      {!p.hasLifeInsurance && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          No life insurance coverage detected.
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border p-3 text-sm">
          <p>Current coverage: <strong>{money(p.currentCoverage || 0)}</strong></p>
          <p>Recommended range: <strong>{money(p.recommendedCoverageMin || 0)} - {money(p.recommendedCoverageMax || 0)}</strong></p>
          <p>Coverage gap: <strong className="text-red-600">{money(p.coverageGap || 0)}</strong></p>
        </div>
        <div className="rounded-lg border p-3 text-sm">
          <p>Disability insurance: <strong>{p.hasDisabilityInsurance ? "Yes" : "No"}</strong></p>
          <p>Term premium range: <strong>{money(p.recommendedTermPremiumMin || 0)} - {money(p.recommendedTermPremiumMax || 0)}/mo</strong></p>
          <p>Urgency: <strong className="capitalize">{p.urgencyLevel || "medium"}</strong></p>
          <p className="text-xs text-muted-foreground">{p.urgencyReason}</p>
        </div>
      </div>
    </div>
  );
}
