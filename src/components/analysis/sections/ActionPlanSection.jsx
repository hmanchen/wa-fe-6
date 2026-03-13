import { money } from "../utils";

export default function ActionPlanSection({ data }) {
  const actions = Array.isArray(data?.actionPlan) ? data.actionPlan : [];
  return (
    <div className="space-y-2">
      {actions.map((a, i) => (
        <div key={i} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">
              {a.priorityRank || i + 1}. {a.action}
            </p>
            <span className="text-xs font-semibold text-emerald-700">
              {money(a.monthlyImpact || 0)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{a.whyItMatters}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span>{a.timeline}</span>
            <span>•</span>
            <span className="capitalize">{a.difficulty || "medium"}</span>
            {a.isQuickWin ? <span>• ⚡ Quick win</span> : null}
            {a.isHousingSpecific ? <span>• 🏠 Housing</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
