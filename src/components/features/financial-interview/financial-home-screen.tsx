"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FileText, Shield, Scale, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFinancialHome } from "@/hooks/use-presentation-flow";
import { aiFinancialHome } from "@/lib/api/presentation-flow";

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

function LoadingState() {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      minHeight: 400, gap: 20,
    }}>
      <div style={{ fontSize: 48 }}>📊</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1B2B4B" }}>
        Preparing Your Financial Story...
      </div>
      <div style={{ fontSize: 13, color: "#718096", fontStyle: "italic" }}>
        Your virtual CFP is analyzing your complete financial profile
      </div>
      <div style={{ width: 280, height: 4, background: "#E8E4DC", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", background: "#4A7C6F", borderRadius: 4, width: "60%",
          animation: "pulse 2s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/70 p-6">
      <div className="mb-3 flex items-center gap-2 text-red-700">
        <AlertTriangle className="size-5" />
        <span className="text-sm font-semibold">Unable to load your Financial Home story.</span>
      </div>
      <p className="mb-4 text-sm text-red-700/90">The AI service may be temporarily unavailable. Please retry.</p>
      <Button onClick={onRetry} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100">Retry</Button>
    </div>
  );
}

export function FinancialHomeScreen({ caseId, onContinue }: FinancialHomeScreenProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useFinancialHome(caseId, true);
  const regenerate = useMutation({
    mutationFn: () => aiFinancialHome(caseId, true),
    onSuccess: (fresh) => {
      queryClient.setQueryData(["ai-financial-home", caseId], fresh);
    },
  });
  const sections = useMemo(() => (data?.sections ?? {}), [data]);
  const asMoney = (v: unknown) => (typeof v === "number" ? `$${v.toLocaleString()}` : asDisplayText(v));
  const urgencyLevel = String(sections?.estatePlanning?.urgencyLevel || "").toLowerCase();
  const estateBorder =
    urgencyLevel === "critical" ? "border-red-400" : urgencyLevel === "high" ? "border-amber-400" : "border-blue-400";

  return (
    <div className="relative space-y-6">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#4A7C6F", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>
            YOUR FINANCIAL STORY
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1B2B4B" }}>
            {asDisplayText(sections?.backgroundSummary?.headline) || "Your Complete Financial Picture"}
          </div>
        </div>
        <button
          onClick={() => regenerate.mutate()}
          disabled={regenerate.isPending}
          style={{
            fontSize: 12, color: "#718096", background: "none", border: "1px solid #E8E4DC",
            borderRadius: 8, padding: "6px 14px", cursor: "pointer",
          }}
        >
          ↻ {regenerate.isPending ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      <div className="space-y-5 px-4 pb-6">
        {isLoading || isFetching ? <LoadingState /> : null}
        {!isLoading && isError ? <ErrorState onRetry={() => void refetch()} /> : null}

        {!isLoading && !isError && (
          <>
            <div className="rounded-xl border border-l-4 border-l-[#4A7C6F] bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="size-5 text-[#4A7C6F]" />
                <h3 className="text-sm font-bold">Background Summary</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {asDisplayText(sections?.backgroundSummary?.narrative)}
              </p>
              {!!sections?.backgroundSummary?.keyStrengths?.length && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Key Strengths</p>
                  <ul className="space-y-1">
                    {sections.backgroundSummary.keyStrengths.map((s: unknown, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />{asDisplayText(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!sections?.backgroundSummary?.keyGaps?.length && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">Key Gaps</p>
                  <ul className="space-y-1">
                    {sections.backgroundSummary.keyGaps.map((g: unknown, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-500" />{asDisplayText(g)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!!sections?.backgroundSummary?.transition && (
                <p className="mt-4 rounded-lg bg-blue-50/50 p-3 text-sm font-medium text-blue-700">
                  {asDisplayText(sections.backgroundSummary.transition)}
                </p>
              )}
            </div>

            <div style={{
              background: "linear-gradient(135deg, #1B2B4B 0%, #243A63 100%)",
              borderRadius: 16, padding: "28px 32px", color: "#FFFFFF", marginBottom: 16,
            }}>
              <div style={{
                fontSize: 11, color: "#4A7C6F", textTransform: "uppercase",
                letterSpacing: 2, fontWeight: 700, marginBottom: 6,
              }}>
                THE FORK IN THE ROAD
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 20 }}>
                {asDisplayText(sections?.twoFutures?.headline)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{
                  background: "rgba(255,100,100,0.10)", border: "1px solid rgba(255,100,100,0.25)",
                  borderRadius: 12, padding: 20,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FF8888", marginBottom: 10 }}>
                    ⚠️ {asDisplayText(sections?.twoFutures?.inactionScenario?.title)}
                  </div>
                  <p style={{ fontSize: 13, color: "#BFD0E8", lineHeight: 1.7, marginBottom: 14 }}>
                    {asDisplayText(sections?.twoFutures?.inactionScenario?.narrative)}
                  </p>
                  {(sections?.twoFutures?.inactionScenario?.bulletConsequences ?? []).map((b: unknown, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#FF9999", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span>→</span><span>{asDisplayText(b)}</span>
                    </div>
                  ))}
                </div>
                <div style={{
                  background: "rgba(74,124,111,0.15)", border: "1px solid rgba(74,124,111,0.35)",
                  borderRadius: 12, padding: 20,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#6ECFB5", marginBottom: 10 }}>
                    ✓ {asDisplayText(sections?.twoFutures?.actionScenario?.title)}
                  </div>
                  <p style={{ fontSize: 13, color: "#BFD0E8", lineHeight: 1.7, marginBottom: 14 }}>
                    {asDisplayText(sections?.twoFutures?.actionScenario?.narrative)}
                  </p>
                  {(sections?.twoFutures?.actionScenario?.bulletWins ?? []).map((b: unknown, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#6ECFB5", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span>✓</span><span>{asDisplayText(b)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-l-4 border-l-[#4A7C6F] bg-[#f7fbf9] p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold">{asDisplayText(sections?.monthlyOpportunity?.headline)}</h3>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-[#dbe9e3] bg-white p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Available Monthly</p>
                  <p className="mt-2 text-3xl font-bold text-[#1B2B4B]">{asMoney(sections?.monthlyOpportunity?.availableMonthly)}</p>
                </div>
                <div className="rounded-lg border border-[#dbe9e3] bg-white p-4">
                  <div className="mb-2 grid grid-cols-3 text-xs font-semibold text-muted-foreground">
                    <div>Purpose</div><div>Monthly</div><div>Timeline</div>
                  </div>
                  {(sections?.monthlyOpportunity?.allocationSuggestion ?? []).map((row: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 border-t py-2 text-sm">
                      <div>{asDisplayText(row?.purpose)}</div>
                      <div>{asMoney(row?.monthlyAmount)}</div>
                      <div>{asDisplayText(row?.timeline)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-sm italic text-[#4A7C6F]">{asDisplayText(sections?.monthlyOpportunity?.narrative)}</p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-l-4 border-l-orange-500 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="size-5 text-orange-500" />
                  <h3 className="text-sm font-bold">Protection Gaps</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{asDisplayText(sections?.protectionGaps?.narrative)}</p>
                <div className="space-y-3">
                  {(sections?.protectionGaps?.items ?? []).map((item: any, i: number) => (
                    <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-sm font-medium">{asDisplayText(item?.label)}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{asDisplayText(item?.status)}</span>
                      </div>
                      {item?.gapAmount ? <p className="text-xs text-muted-foreground">Gap: {asDisplayText(item.gapAmount)}</p> : null}
                      <p className="mt-1 text-xs text-muted-foreground">{asDisplayText(item?.oneLineImpact)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cn("rounded-xl border border-l-4 bg-card p-5 shadow-sm", estateBorder)}>
                <div className="mb-3 flex items-center gap-2">
                  <Scale className="size-5 text-purple-500" />
                  <h3 className="text-sm font-bold">Estate Planning Urgency</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{asDisplayText(sections?.estatePlanning?.narrative)}</p>
                <div className="space-y-2">
                  {(sections?.estatePlanning?.documents ?? []).map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm">{asDisplayText(d?.name)}</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">{asDisplayText(d?.status)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <p className="text-xs font-bold text-red-500">Key Risk</p>
                  <p className="mt-1 text-sm text-red-700">{asDisplayText(sections?.estatePlanning?.keyRisk)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-l-4 border-l-amber-500 bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="size-5 text-amber-500" />
                <h3 className="text-sm font-bold">Financial Gaps & Observations</h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-600">Gaps Identified</p>
                  <div className="space-y-2">
                    {(sections?.financialGaps?.gaps ?? []).map((g: any, i: number) => (
                      <div key={i} className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                        <p className="text-sm font-medium">{asDisplayText(g?.icon)} {asDisplayText(g?.title)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{asDisplayText(g?.description)}</p>
                        <p className="mt-1 text-xs font-medium text-amber-700">Impact: {asDisplayText(g?.impact)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600">Positive Observations</p>
                  <div className="space-y-2">
                    {(sections?.financialGaps?.positiveObservations ?? []).map((p: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <p className="text-sm text-muted-foreground">{asDisplayText(p?.description ?? p)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-l-4 border-l-teal-500 bg-teal-50/40 p-5 shadow-sm">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-teal-700">ADVISOR NOTES — Not shown to client</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <ul className="space-y-1">
                  {(sections?.advisorInsights?.observations ?? []).map((h: unknown, i: number) => (
                    <li key={i} className="text-sm text-teal-800">• {asDisplayText(h)}</li>
                  ))}
                </ul>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-700">Conversation starters:</p>
                  <ul className="space-y-1">
                    {(sections?.advisorInsights?.conversationOpeners ?? []).map((q: unknown, i: number) => (
                      <li key={i} className="text-sm text-teal-800">- {asDisplayText(q)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
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
