import { money } from "../utils";

export default function CreditCardSection({ data }) {
  const c = data?.creditCardAnalysis || {};
  return (
    <div className="grid gap-2 md:grid-cols-3">
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Total balance</p><p className="font-semibold">{money(c.totalBalance)}</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">APR</p><p className="font-semibold">{Math.round(Number(c.apr || 0))}%</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Monthly interest</p><p className="font-semibold">{money(c.monthlyInterestCost)}</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Recommended payment</p><p className="font-semibold">{money(c.recommendedMonthlyPayment)}</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Recovery</p><p className="font-semibold text-emerald-600">{money(c.recoverableMonthlyCashFlow)}</p></div>
      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Payoff timeline</p><p className="font-semibold">{Math.round(Number(c.payoffTimelineMonths || 0))} months</p></div>
      {c.counterintuitiveInsight && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Insight</p>
          <p className="text-sm text-amber-900">{c.counterintuitiveInsight}</p>
        </div>
      )}
    </div>
  );
}
