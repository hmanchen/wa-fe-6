import { money } from "../utils";

export default function HiddenMoneySection({ data }) {
  const h = data?.hiddenMoneyReport || {};
  const items = Array.isArray(h.items) ? h.items : [];
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2">Source</th>
              <th className="py-2">Category</th>
              <th className="py-2">Monthly Recovery</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{it.isQuickWin ? "⚡ " : ""}{it.isHousingSpecific ? "🏠 " : ""}{it.source}</td>
                <td className="py-2">{it.category}</td>
                <td className="py-2 font-semibold text-emerald-600">{money(it.monthlyRecovery || 0)}</td>
                <td className="py-2">{it.specificAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border p-3 text-sm">
        <p>Before: <strong>{money(h.currentMonthlyFlow || 0)}</strong></p>
        <p>Recovery: <strong className="text-emerald-600">{money(h.totalMonthlyRecovery || 0)}</strong></p>
        <p>After: <strong>{money(h.netCashFlowAfterAllChanges || 0)}</strong></p>
      </div>
    </div>
  );
}
