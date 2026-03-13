import { money } from "../utils";

export default function CollegeFundingSection({ data }) {
  const c = data?.collegeFundingPlan;
  if (!c) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border p-3 text-sm">
        <p>Children: <strong>{Number(c.numberOfChildren || 0)}</strong></p>
        <p>Monthly available: <strong>{money(c.monthlyAvailableForCollege || 0)}</strong></p>
        <p>Per child: <strong>{money(c.perChildMonthly || 0)}</strong></p>
      </div>
      {Array.isArray(c.phases) && (
        <div className="grid gap-2 md:grid-cols-3">
          {c.phases.map((p, i) => (
            <div key={i} className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Phase {p.phaseNumber}</p>
              <p className="text-sm font-semibold">{p.label}</p>
              <p className="text-xs">{p.timeline}</p>
              <p className="mt-1 text-xs">Monthly: {money(p.monthlyCommitment || 0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
