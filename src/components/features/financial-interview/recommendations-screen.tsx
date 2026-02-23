"use client";

import { useState } from "react";
import { ChevronRight, Loader2, Star, ArrowRight, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiRecommendations, useFullAnalysis } from "@/hooks/use-presentation-flow";

interface RecommendationsScreenProps {
  caseId: string;
  onContinue: () => void;
}

function fmt(n: number | undefined | null): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const TIER_COLORS = [
  { bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-emerald-400", text: "text-emerald-700 dark:text-emerald-300", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-400", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { bg: "bg-purple-50/50 dark:bg-purple-950/20", border: "border-purple-400", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
];

export function RecommendationsScreen({ caseId, onContinue }: RecommendationsScreenProps) {
  const { data: recs, isLoading, isError } = useAiRecommendations(caseId);
  const fullAnalysis = useFullAnalysis(caseId);
  const [analysisRan, setAnalysisRan] = useState(false);

  const handleRunAnalysis = () => {
    fullAnalysis.mutate();
    setAnalysisRan(true);
  };

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">Recommendations</h2>
          <span className="text-xs text-muted-foreground">AI-Powered 3-Tier Recommendation Summary</span>
        </div>
        {!analysisRan && (
          <Button size="sm" variant="outline" onClick={handleRunAnalysis} disabled={fullAnalysis.isPending}>
            {fullAnalysis.isPending ? <><Loader2 className="mr-1 size-3.5 animate-spin" /> Running Full Analysis...</> : "Run Full Analysis First"}
          </Button>
        )}
      </div>

      <div className="space-y-5 p-5">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating AI recommendations... This may take 15-30 seconds.</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertTriangle className="size-8 text-red-500" />
            <p className="text-sm text-red-600">Could not generate recommendations. Please run "Full Analysis" first, then refresh.</p>
            <Button size="sm" variant="outline" onClick={handleRunAnalysis} disabled={fullAnalysis.isPending}>
              {fullAnalysis.isPending ? "Running..." : "Run Full Analysis"}
            </Button>
          </div>
        )}

        {recs && (
          <>
            {/* Executive Summary */}
            {recs.executiveSummary && (
              <div className="rounded-xl border border-l-4 border-l-indigo-500 bg-card p-5 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-indigo-600">Executive Summary</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{recs.executiveSummary}</p>
              </div>
            )}

            {/* Money Found */}
            {recs.moneyFound && (
              <div className="rounded-xl border border-l-4 border-l-emerald-500 bg-emerald-50/50 p-5 shadow-sm dark:bg-emerald-950/20">
                <div className="mb-2 flex items-center gap-2">
                  <DollarSign className="size-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Money Found</h3>
                  {recs.moneyFound.redirectableMonthly != null && (
                    <span className="rounded-full bg-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-800/40 dark:text-emerald-200">
                      {fmt(recs.moneyFound.redirectableMonthly)}/mo available
                    </span>
                  )}
                </div>
                <p className="mb-3 text-sm text-muted-foreground">{recs.moneyFound.narrative}</p>
                {recs.moneyFound.sources?.length > 0 && (
                  <div className="space-y-2">
                    {recs.moneyFound.sources.map((s: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2 dark:bg-background/40">
                        <div>
                          <p className="text-sm font-medium">{s.source}</p>
                          <p className="text-xs text-muted-foreground">{s.justification}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{fmt(s.redirectAmountMonthly)}/mo</p>
                          <p className="text-xs text-muted-foreground">from {fmt(s.currentAmountMonthly)}/mo</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tiers */}
            {recs.tiers?.map((tier: any, idx: number) => {
              const colors = TIER_COLORS[idx] ?? TIER_COLORS[0];
              return (
                <div key={tier.tier ?? idx} className={cn("rounded-xl border border-l-4 bg-card p-5 shadow-sm", colors.border)}>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", colors.badge)}>Tier {tier.tier}</span>
                        <h3 className={cn("text-sm font-bold", colors.text)}>{tier.name}</h3>
                      </div>
                      {tier.subtitle && <p className="mt-1 text-xs text-muted-foreground">{tier.subtitle}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Monthly Cost</p>
                      <p className={cn("text-lg font-bold", colors.text)}>{fmt(tier.totalNewMonthlyCost)}</p>
                      {tier.healthScoreAfter != null && (
                        <p className="text-xs text-muted-foreground">Score → {tier.healthScoreAfter}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {tier.recommendations?.map((rec: any, j: number) => (
                      <div key={rec.id ?? j} className="rounded-lg border bg-muted/20 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {rec.priority ?? j + 1}
                          </span>
                          <h4 className="text-sm font-bold">{rec.title}</h4>
                          {rec.monthlyCost != null && (
                            <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{fmt(rec.monthlyCost)}/mo</span>
                          )}
                        </div>
                        {rec.gapAddressed && (
                          <p className="mb-1 text-xs font-medium text-amber-600">Gap: {rec.gapAddressed}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{rec.what}</p>
                        {rec.howFunded && <p className="mt-1 text-xs text-muted-foreground"><strong>How funded:</strong> {rec.howFunded}</p>}
                        {rec.why && <p className="mt-1 text-xs text-muted-foreground"><strong>Why:</strong> {rec.why}</p>}
                        {rec.whatIfNot && (
                          <div className="mt-2 flex items-start gap-1.5 rounded bg-red-50/50 p-2 text-xs text-red-700 dark:bg-red-950/20 dark:text-red-300">
                            <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                            <span><strong>If not:</strong> {rec.whatIfNot}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Key Insight */}
            {recs.keyInsight && (
              <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50/50 p-5 text-center dark:border-indigo-800 dark:bg-indigo-950/20">
                <Star className="mx-auto mb-2 size-6 text-indigo-500" />
                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{recs.keyInsight}</p>
              </div>
            )}

            {/* Next Steps Timeline */}
            {recs.nextStepsTimeline?.length > 0 && (
              <div className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold">Next Steps Timeline</h3>
                <div className="space-y-3">
                  {recs.nextStepsTimeline.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.action}</p>
                        <p className="text-xs text-muted-foreground">{step.timeframe}</p>
                      </div>
                      {i < recs.nextStepsTimeline.length - 1 && <ArrowRight className="size-4 text-muted-foreground/50" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onContinue} className="gap-1.5">
            Continue to Delivery <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
