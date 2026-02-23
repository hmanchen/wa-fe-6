"use client";

import { ChevronRight, Loader2, FileText, Heart, Shield, Scale, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useBackgroundSummary,
  useHealthNarrative,
  useProtectionGaps,
  useEstateUrgency,
  useBackgroundGaps,
} from "@/hooks/use-presentation-flow";

interface FinancialHomeScreenProps {
  caseId: string;
  onContinue: () => void;
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-5 shadow-sm">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Generating {label}...</span>
    </div>
  );
}

function ErrorCard({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-sm dark:border-red-900 dark:bg-red-950/20">
      <AlertTriangle className="size-5 text-red-500" />
      <span className="text-sm text-red-600 dark:text-red-400">Could not load {label}. The AI service may be temporarily unavailable.</span>
    </div>
  );
}

export function FinancialHomeScreen({ caseId, onContinue }: FinancialHomeScreenProps) {
  const { data: bgSummary, isLoading: loadBgSum, isError: errBgSum } = useBackgroundSummary(caseId);
  const { data: healthNarr, isLoading: loadHealth, isError: errHealth } = useHealthNarrative(caseId);
  const { data: protGaps, isLoading: loadProt, isError: errProt } = useProtectionGaps(caseId);
  const { data: estateUrg, isLoading: loadEstate, isError: errEstate } = useEstateUrgency(caseId);
  const { data: bgGaps, isLoading: loadBgGaps, isError: errBgGaps } = useBackgroundGaps(caseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Financial Home</h2>
        <span className="text-xs text-muted-foreground">AI-Powered Financial Narratives</span>
      </div>

      <div className="space-y-5 px-4 pb-6">
        {/* Background Summary */}
        {loadBgSum ? <LoadingCard label="Background Summary" /> : errBgSum ? <ErrorCard label="Background Summary" /> : bgSummary && (
          <div className="rounded-xl border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="size-5 text-blue-500" />
              <h3 className="text-sm font-bold">Background Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{bgSummary.summaryNarrative}</p>
            {bgSummary.keyStrengths?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Key Strengths</p>
                <ul className="space-y-1">
                  {bgSummary.keyStrengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bgSummary.keyGaps?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">Key Gaps</p>
                <ul className="space-y-1">
                  {bgSummary.keyGaps.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bgSummary.transitionStatement && (
              <p className="mt-4 rounded-lg bg-blue-50/50 p-3 text-sm font-medium text-blue-700 dark:bg-blue-950/20 dark:text-blue-300">
                {bgSummary.transitionStatement}
              </p>
            )}
          </div>
        )}

        {/* Health Narrative */}
        {loadHealth ? <LoadingCard label="Health Narrative" /> : errHealth ? <ErrorCard label="Health Narrative" /> : healthNarr && (
          <div className="rounded-xl border border-l-4 border-l-rose-500 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="size-5 text-rose-500" />
              <h3 className="text-sm font-bold">{healthNarr.headline || "Financial Health Narrative"}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{healthNarr.clientNarrative}</p>
            {healthNarr.positiveCallouts?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {healthNarr.positiveCallouts.map((c: string, i: number) => (
                  <span key={i} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{c}</span>
                ))}
              </div>
            )}
            {healthNarr.mostUrgent && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Most Urgent</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{healthNarr.mostUrgent}</p>
              </div>
            )}
          </div>
        )}

        {/* Protection Gaps + Estate Urgency — side by side */}
        <div className="grid gap-5 lg:grid-cols-2">
          {loadProt ? <LoadingCard label="Protection Gaps" /> : errProt ? <ErrorCard label="Protection Gaps" /> : protGaps && (
            <div className="rounded-xl border border-l-4 border-l-orange-500 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="size-5 text-orange-500" />
                <h3 className="text-sm font-bold">Protection Gaps</h3>
              </div>
              <div className="space-y-3">
                {(Array.isArray(protGaps) ? protGaps : protGaps.clientVisibleGaps ?? protGaps.alerts ?? []).map((item: any, i: number) => (
                  <div key={i} className={cn(
                    "rounded-lg border p-3",
                    item.priority === "high" || item.severity === "emergency" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                  )}>
                    <p className="text-sm font-medium">{item.icon} {item.title ?? item.message}</p>
                    {item.explanation && <p className="mt-1 text-xs text-muted-foreground">{item.explanation}</p>}
                    {item.clientImpact && <p className="mt-1 text-xs text-muted-foreground">{item.clientImpact}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadEstate ? <LoadingCard label="Estate Urgency" /> : errEstate ? <ErrorCard label="Estate Urgency" /> : estateUrg && (
            <div className="rounded-xl border border-l-4 border-l-purple-500 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Scale className="size-5 text-purple-500" />
                <h3 className="text-sm font-bold">Estate Planning Urgency</h3>
              </div>
              {estateUrg.urgencyNarrative && (
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{estateUrg.urgencyNarrative}</p>
              )}
              {estateUrg.documentsNeeded?.length > 0 && (
                <div className="space-y-2">
                  {estateUrg.documentsNeeded.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm">{d.document}</span>
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        d.urgency === "high" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        : d.urgency === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      )}>{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {estateUrg.keyRisk && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
                  <p className="text-xs font-bold text-red-500">Key Risk</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{estateUrg.keyRisk}</p>
                </div>
              )}
              {estateUrg.estimatedProbateCost && (
                <p className="mt-2 text-xs text-muted-foreground">Estimated probate cost without trust: {estateUrg.estimatedProbateCost}</p>
              )}
            </div>
          )}
        </div>

        {/* Background Gaps */}
        {loadBgGaps ? <LoadingCard label="Background Gaps" /> : errBgGaps ? <ErrorCard label="Background Gaps" /> : bgGaps && (
          <div className="rounded-xl border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="size-5 text-amber-500" />
              <h3 className="text-sm font-bold">Financial Gaps & Observations</h3>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {bgGaps.clientVisibleGaps?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">Gaps Identified</p>
                  <div className="space-y-2">
                    {bgGaps.clientVisibleGaps.map((g: any, i: number) => (
                      <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
                        <p className="text-sm font-medium">{g.icon} {g.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{g.explanation}</p>
                        {g.impact && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Impact: {g.impact}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bgGaps.positiveObservations?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Positive Observations</p>
                  <div className="space-y-2">
                    {bgGaps.positiveObservations.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-muted-foreground">{typeof p === "string" ? p : (p as any).observation ?? JSON.stringify(p)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {bgGaps.advisorOnlyHints?.length > 0 && (
              <div className="mt-4 rounded-lg bg-indigo-50/50 p-4 dark:bg-indigo-950/20">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-500">Advisor Hints (Not Shown to Client)</p>
                <ul className="space-y-1">
                  {bgGaps.advisorOnlyHints.map((h: any, i: number) => (
                    <li key={i} className="text-sm text-indigo-700 dark:text-indigo-300">{h.icon} {h.hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Continue */}
        <div className="flex justify-end pt-2">
          <Button onClick={onContinue} className="gap-1.5">
            Continue to X-Curve <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
