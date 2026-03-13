import { money } from "../utils";

export default function HousingAnalysisSection({ data }) {
  const h = data?.housingAnalysis || {};
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border p-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Housing type</p>
        <p className="text-sm font-semibold">{h.housingType || "Not provided"}</p>
        <p className="mt-2 text-xs text-muted-foreground">Monthly housing</p>
        <p className="font-semibold">{money(h.monthlyHousingCost || 0)}</p>
        <p className="text-xs text-muted-foreground">Percent of income: {Math.round(Number(h.percentOfIncome || 0))}%</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Insight</p>
        <p className="text-sm">{h.keyInsight || "No housing insight returned."}</p>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Action</p>
        <p className="text-sm">{h.actionableAdvice || "No action returned."}</p>
      </div>
    </div>
  );
}
