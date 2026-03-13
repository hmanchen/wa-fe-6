import { Button } from "@/components/ui/button";
import { COLORS, money, severityColor } from "./utils";

export default function TriggerBanner({
  signals,
  clientName,
  estimatedRecovery,
  onRun,
}) {
  return (
    <div
      className="mb-4 rounded-xl border p-4"
      style={{ background: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }}
    >
      <h3 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif" }}>
        Before we recommend any financial products, let&apos;s find out exactly where your money is going.
      </h3>
      <p className="mt-2 text-sm" style={{ color: COLORS.sub }}>
        We detected {signals.length} financial stress signals in {clientName || "this client"}&apos;s profile.
      </p>

      <div className="mt-3 space-y-2">
        {signals.map((s) => (
          <div key={s.code} className="rounded-lg border p-2" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: severityColor(s.type) }}
              />
              <p className="text-sm font-semibold">{s.title}</p>
            </div>
            <p className="text-xs" style={{ color: COLORS.sub }}>{s.message}</p>
            {s.monthlyImpact > 0 && (
              <p className="text-xs font-semibold" style={{ color: COLORS.accent }}>
                Potential monthly impact: {money(s.monthlyImpact)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-lg border p-3" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
        <p className="text-sm">
          Based on initial signals, recoverable cash flow may exist:
          <span className="ml-1 font-semibold" style={{ color: COLORS.accent }}>
            {money(estimatedRecovery)}
          </span>
        </p>
      </div>

      <Button
        className="mt-4 h-11 w-full text-base font-semibold text-black"
        style={{ background: "linear-gradient(135deg, #00D4AA, #00A884)" }}
        onClick={onRun}
      >
        ⚡ Run Financial Freedom Analysis
      </Button>
      <p className="mt-2 text-center text-xs" style={{ color: COLORS.muted }}>
        Takes 15-20 seconds • No product recommendations yet • Just the honest math
      </p>
    </div>
  );
}
