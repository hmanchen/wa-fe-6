import { money } from "../utils";

function ScenarioCard({ title, data, recommended }) {
  return (
    <div className={`rounded-lg border p-3 ${recommended ? "border-emerald-400" : ""}`}>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-sm font-semibold">{data?.label || "Scenario"}</p>
      <p className="mt-1 text-xs">Additional take-home: {money(data?.additionalTakeHome || 0)}</p>
      {Array.isArray(data?.pros) && <p className="mt-1 text-xs text-emerald-700">Pros: {data.pros.join(", ")}</p>}
      {Array.isArray(data?.cons) && <p className="mt-1 text-xs text-amber-700">Cons: {data.cons.join(", ")}</p>}
      {recommended && <p className="mt-2 text-xs font-bold text-emerald-700">★ RECOMMENDED</p>}
    </div>
  );
}

export default function K401Section({ data }) {
  const k = data?.k401Analysis || {};
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <ScenarioCard title="Scenario A" data={k.scenarioA} />
        <ScenarioCard title="Scenario B" data={k.scenarioB} recommended />
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommendation</p>
        <p className="text-sm">{k.recommendation || "No recommendation returned."}</p>
        {k.breakEvenAnalysis && <p className="mt-1 text-xs text-muted-foreground">{k.breakEvenAnalysis}</p>}
      </div>
    </div>
  );
}
