import { money } from "../utils";

export default function BudgetAuditSection({ data }) {
  const rows = Array.isArray(data?.budgetAudit) ? data.budgetAudit : [];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="py-2">Category</th>
            <th className="py-2">Your Amount</th>
            <th className="py-2">Benchmark</th>
            <th className="py-2">% Income</th>
            <th className="py-2">Status</th>
            <th className="py-2">Recovery</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{r.category}</td>
              <td className="py-2">{money(r.monthlyAmount)}</td>
              <td className="py-2">{money(r.benchmarkAmount)}</td>
              <td className="py-2">{Math.round(Number(r.percentOfTakeHome || 0))}%</td>
              <td className="py-2 capitalize">{r.status || "ok"}</td>
              <td className="py-2 text-emerald-600">{money(r.recoverableMonthly || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
