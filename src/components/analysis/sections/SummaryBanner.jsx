import { money } from "../utils";

export default function SummaryBanner({ data }) {
  const summary = data?.summary || {};
  const score = Number(summary.overallHealthScore || 0);
  return (
    <div className="rounded-xl border bg-slate-900 p-4 text-slate-100">
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Primary issue</p>
          <p className="text-sm font-semibold">{summary.primaryIssue || "No summary returned"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Monthly flow</p>
          <p className="text-xl font-bold">
            {money(summary.monthlyDeficitOrSurplus || 0)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400">Health score</p>
          <p className="text-xl font-bold">{score}/100</p>
        </div>
      </div>
      {Array.isArray(summary.secondaryIssues) && summary.secondaryIssues.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {summary.secondaryIssues.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
