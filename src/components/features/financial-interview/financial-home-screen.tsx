"use client";

import { ChevronRight, Loader2, FileText, Heart, Shield, Scale, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScreenLoadingOverlay } from "@/components/shared/screen-loading-overlay";
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

function asDisplayText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => asDisplayText(v)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Prefer concise estate-summary fields when provider returns structured objects.
    const parts: string[] = [];
    if (obj.estimatedTotalAvoidableCosts != null) {
      parts.push(`Estimated avoidable costs: ${asDisplayText(obj.estimatedTotalAvoidableCosts)}`);
    }
    if (obj.totalWorstCaseExposure != null) {
      parts.push(`Worst-case exposure: ${asDisplayText(obj.totalWorstCaseExposure)}`);
    }
    if (obj.probateTimeline != null) {
      parts.push(`Probate timeline: ${asDisplayText(obj.probateTimeline)}`);
    }
    if (parts.length > 0) return parts.join(" | ");
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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
  // Stagger AI calls so we do not burst 5 concurrent requests and trigger provider 429s.
  const { data: bgSummary, isLoading: loadBgSum, isError: errBgSum } = useBackgroundSummary(caseId, true);
  const { data: healthNarr, isLoading: loadHealth, isError: errHealth } = useHealthNarrative(
    caseId,
    Boolean(bgSummary) || errBgSum
  );
  const { data: protGaps, isLoading: loadProt, isError: errProt } = useProtectionGaps(
    caseId,
    Boolean(healthNarr) || errHealth
  );
  const { data: estateUrg, isLoading: loadEstate, isError: errEstate } = useEstateUrgency(
    caseId,
    Boolean(protGaps) || errProt
  );
  const { data: bgGaps, isLoading: loadBgGaps, isError: errBgGaps } = useBackgroundGaps(
    caseId,
    Boolean(estateUrg) || errEstate
  );
  const isScreenLoading = loadBgSum || loadHealth || loadProt || loadEstate || loadBgGaps;
  const providerList = Array.from(new Set(
    [bgSummary, healthNarr, protGaps, estateUrg, bgGaps]
      .map((x: any) => x?.__provider)
      .filter((p): p is string => Boolean(p))
  ));
  const providerLabel = providerList.length === 0
    ? "Provider: —"
    : providerList.length === 1
    ? `Provider: ${providerList[0]}`
    : `Providers: ${providerList.join(", ")}`;

  return (
    <div className="relative space-y-6">
      <div className="flex items-center gap-3 rounded-t-xl border-b bg-muted/30 px-4 py-2.5">
        <h2 className="text-base font-bold">Financial Home</h2>
        <span className="text-xs text-muted-foreground">AI-Powered Financial Narratives</span>
        <span className="text-xs text-muted-foreground">{providerLabel}</span>
      </div>

      <div className="space-y-5 px-4 pb-6">
        {/* Background Summary */}
        {loadBgSum ? <LoadingCard label="Background Summary" /> : errBgSum ? <ErrorCard label="Background Summary" /> : bgSummary && (
          <div className="rounded-xl border border-l-4 border-l-blue-500 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="size-5 text-blue-500" />
              <h3 className="text-sm font-bold">Background Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{asDisplayText(bgSummary.summaryNarrative)}</p>
            {bgSummary.keyStrengths?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Key Strengths</p>
                <ul className="space-y-1">
                  {bgSummary.keyStrengths.map((s: unknown, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />{asDisplayText(s)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bgSummary.keyGaps?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">Key Gaps</p>
                <ul className="space-y-1">
                  {bgSummary.keyGaps.map((g: unknown, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />{asDisplayText(g)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {bgSummary.transitionStatement && (
              <p className="mt-4 rounded-lg bg-blue-50/50 p-3 text-sm font-medium text-blue-700 dark:bg-blue-950/20 dark:text-blue-300">
                {asDisplayText(bgSummary.transitionStatement)}
              </p>
            )}
          </div>
        )}

        {/* Health Narrative */}
        {loadHealth ? <LoadingCard label="Health Narrative" /> : errHealth ? <ErrorCard label="Health Narrative" /> : healthNarr && (
          <div className="rounded-xl border border-l-4 border-l-rose-500 bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <Heart className="size-5 text-rose-500" />
              <h3 className="text-sm font-bold">{asDisplayText(healthNarr.headline) || "Financial Health Narrative"}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{asDisplayText(healthNarr.clientNarrative)}</p>
            {healthNarr.positiveCallouts?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {healthNarr.positiveCallouts.map((c: unknown, i: number) => (
                  <span key={i} className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{asDisplayText(c)}</span>
                ))}
              </div>
            )}
            {healthNarr.mostUrgent && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/20">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Most Urgent</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-300">{asDisplayText(healthNarr.mostUrgent)}</p>
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
                    <p className="text-sm font-medium">{asDisplayText(item.icon)} {asDisplayText(item.title ?? item.message)}</p>
                    {item.explanation && <p className="mt-1 text-xs text-muted-foreground">{asDisplayText(item.explanation)}</p>}
                    {item.clientImpact && <p className="mt-1 text-xs text-muted-foreground">{asDisplayText(item.clientImpact)}</p>}
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
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{asDisplayText(estateUrg.urgencyNarrative)}</p>
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
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{asDisplayText(estateUrg.keyRisk)}</p>
                </div>
              )}
              {estateUrg.estimatedProbateCost && (
                <p className="mt-2 text-xs text-muted-foreground">Estimated probate cost without trust: {asDisplayText(estateUrg.estimatedProbateCost)}</p>
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
                        <p className="text-sm font-medium">{asDisplayText(g.icon)} {asDisplayText(g.title)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{asDisplayText(g.explanation)}</p>
                        {g.impact && <p className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-300">Impact: {asDisplayText(g.impact)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {bgGaps.positiveObservations?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Positive Observations</p>
                  <div className="space-y-2">
                    {bgGaps.positiveObservations.map((p: unknown, i: number) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-muted-foreground">{typeof p === "string" ? p : asDisplayText((p as Record<string, unknown>).observation ?? p)}</p>
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
                    <li key={i} className="text-sm text-indigo-700 dark:text-indigo-300">{asDisplayText(h.icon)} {asDisplayText(h.hint)}</li>
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
      {isScreenLoading && (
        <ScreenLoadingOverlay message="Loading Financial Home..." />
      )}
    </div>
  );
}
