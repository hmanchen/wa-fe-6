"use client";

import { useMemo, useState } from "react";
import { ChevronRight, HelpCircle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinancialHealthScore } from "@/types/financial-interview";
import { mapPyramidData, getLevelSummary } from "./pyramidDataMapper";
import { PyramidVisualization } from "./PyramidVisualization";
import { PyramidHealthSummary } from "./PyramidHealthSummary";
import { BottomUpIndicator } from "./BottomUpIndicator";

/* eslint-disable @typescript-eslint/no-explicit-any */

const HOW_CONNECTS_ROWS = [
  {
    dot: "#2E7D32",
    arclis: "Level 1 — Defensive Planning",
    layer: "Protect",
    focus: "Life insurance, disability, umbrella, LTC",
  },
  {
    dot: "#1565C0",
    arclis: "Level 2 — Offensive Planning",
    layer: "Plan For",
    focus: "Emergency reserves, debt payoff, major purchases",
  },
  {
    dot: "#C62828",
    arclis: "Level 3 — Aggressive Planning",
    layer: "Prioritize Goals",
    focus: "Retirement funding, investment diversification",
  },
  {
    dot: "#E65100",
    arclis: "Level 4 — Progressive Planning",
    layer: "Pass Along Assets",
    focus: "Estate plan, tax strategy, business succession",
  },
  {
    dot: "#66BB6A",
    arclis: "Level 5 — Financial Freedom",
    layer: "Your Wants",
    focus: "Legacy, philanthropy, financial independence",
  },
] as const;

function FinancialPrioritizationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="prioritization-help-title"
        aria-hidden={!open}
      >
        <header className="flex-shrink-0 bg-[#0D3B6E] px-4 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="prioritization-help-title"
                className="text-lg font-bold leading-tight text-white"
              >
                Financial Prioritization
              </h3>
              <p className="mt-1 text-[13px] text-white/60">
                Start from the bottom and work your way up.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-white transition-colors hover:bg-white/10"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
            {/* === PYRAMID SECTION === */}
            <div className="px-6 pb-4 pt-5" style={{ background: "#F8F9FA" }}>
              {/* Top label */}
              <div style={{ textAlign: "center", marginBottom: "6px" }}>
                <div style={{ color: "#0D3B6E", fontSize: "11px", fontWeight: 600 }}>
                  Potential Financial Success
                </div>
                <div style={{ color: "#0D3B6E", fontSize: "16px", lineHeight: 1 }}>▲</div>
              </div>

              {/* SVG Pyramid */}
              <svg
                viewBox="0 0 500 400"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", display: "block" }}
              >
                {/* ── Layer 5 (peak): Your Wants ── */}
                <polygon points="250,10 170,75 330,75" fill="#43A047" />
                <text x="250" y="48" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                  Your Wants
                </text>
                <text
                  x="250"
                  y="63"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="10"
                  fontStyle="italic"
                >
                  Financial Freedom
                </text>

                {/* ── Layer 4: Pass Along Assets ── */}
                <polygon points="170,78 330,78 400,160 100,160" fill="#E65100" />
                <text x="250" y="100" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                  Pass Along Assets
                </text>
                <text
                  x="250"
                  y="114"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="9"
                  fontStyle="italic"
                >
                  Progressive Planning
                </text>
                <text
                  x="250"
                  y="128"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • Estate Conservation • Charitable Giving
                </text>
                <text
                  x="250"
                  y="141"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • Consider Tax Efficiency • Business Continuation Planning
                </text>

                {/* ── Layer 3: Prioritize Goals ── */}
                <polygon points="100,163 400,163 456,245 44,245" fill="#C62828" />
                <text x="250" y="184" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                  Prioritize Goals
                </text>
                <text
                  x="250"
                  y="198"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="9"
                  fontStyle="italic"
                >
                  Aggressive Planning
                </text>
                <text
                  x="250"
                  y="212"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • Diversify to Reduce Risk • Maximize Qualified Plan Contributions
                </text>
                <text
                  x="250"
                  y="225"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • Overpower Inflation
                </text>

                {/* ── Layer 2: Plan For ── */}
                <polygon points="44,248 456,248 490,320 10,320" fill="#1565C0" />
                <text x="250" y="270" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                  Plan For
                </text>
                <text
                  x="250"
                  y="284"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="9"
                  fontStyle="italic"
                >
                  Offensive Planning
                </text>
                <text
                  x="250"
                  y="299"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • Major Purchases • College Education • Emergencies • Retirement
                </text>

                {/* ── Layer 1 (base): Protect ── */}
                <polygon points="10,323 490,323 500,390 0,390" fill="#2E7D32" />
                <text x="250" y="344" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                  Protect
                </text>
                <text
                  x="250"
                  y="358"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  fontSize="9"
                  fontStyle="italic"
                >
                  Defensive Planning
                </text>
                <text
                  x="250"
                  y="373"
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.9)"
                  fontSize="9"
                >
                  • What You Earn • What You Own • What You Owe • Those You Love
                </text>
              </svg>

              {/* Bottom label */}
              <div style={{ textAlign: "center", marginTop: "6px" }}>
                <div style={{ color: "#0D3B6E", fontSize: "16px", lineHeight: 1 }}>▼</div>
                <div
                  style={{
                    color: "#0D3B6E",
                    fontSize: "11px",
                    fontWeight: 600,
                    marginTop: "2px",
                  }}
                >
                  Start Here — Potential Financial Security
                </div>
              </div>
            </div>
            {/* === END PYRAMID SECTION === */}

            <section className="mt-10 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-bold text-[#0D3B6E]">
                How This Connects to Your Arclis Analysis
              </h4>
              <ul className="mt-4 space-y-4">
                {HOW_CONNECTS_ROWS.map((row) => (
                  <li key={row.arclis} className="flex gap-3">
                    <span
                      className="mt-1.5 size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: row.dot }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900">
                        {row.arclis}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600">
                        {row.layer}
                        {" · "}
                        {row.focus}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <div
              className="mt-8 flex gap-2 border-t-2 border-[#FF9900] bg-[#FFF8E1] p-3 text-[11px] leading-snug text-gray-700"
              role="note"
            >
              <Info className="mt-0.5 size-4 shrink-0 text-[#FF9900]" aria-hidden />
              <p>
                For Educational &amp; Training Purposes Only — This financial prioritization
                framework is provided for educational purposes to help illustrate general
                financial planning concepts. It does not constitute investment advice,
                insurance recommendations, or a solicitation for the sale of any specific
                financial product. Individual circumstances vary. Please consult a licensed
                financial professional before making any financial decisions. © Arclis
                Financial Intelligence Platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function FinancialHomePyramid({
  caseData,
  healthScore,
  fullAnalysis,
  onContinue,
}: {
  caseData: any;
  healthScore: FinancialHealthScore | null | undefined;
  fullAnalysis: any;
  onContinue: () => void;
}) {
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showPrioritizationHelp, setShowPrioritizationHelp] = useState(false);
  const mapped = useMemo(
    () => mapPyramidData({ caseData, healthScore, fullAnalysis }),
    [caseData, healthScore, fullAnalysis]
  );
  const hasAnalysisData =
    !!fullAnalysis &&
    typeof fullAnalysis === "object" &&
    Object.keys(fullAnalysis).length > 0;

  const helpButton = (
    <button
      type="button"
      title="Learn about Financial Prioritization"
      onClick={() => setShowPrioritizationHelp(true)}
      className="mt-0.5 shrink-0 rounded-full p-2 text-[#0D3B6E] transition-colors hover:text-[#1F5C99]"
      aria-label="Learn about Financial Prioritization"
    >
      <HelpCircle className="size-6" strokeWidth={2} />
    </button>
  );

  if (!hasAnalysisData) {
    return (
      <>
        <div className="space-y-4 rounded-xl border bg-[#FAFAF7] p-4 text-[#2D3436]">
          <div className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold">Financial Home Pyramid</h2>
              <p className="text-sm text-muted-foreground">
                Calculating pyramid values from your latest analysis...
              </p>
            </div>
            {helpButton}
          </div>
          <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
            We are syncing your net worth, cash flow, debt, and protection calculations.
            This usually takes a few seconds.
          </div>
        </div>
        <FinancialPrioritizationDrawer
          open={showPrioritizationHelp}
          onClose={() => setShowPrioritizationHelp(false)}
        />
      </>
    );
  }

  const statuses = {
    1: mapped.level1.foundationStatus,
    2: mapped.level2.status,
    3: mapped.level3.status,
    4: mapped.level4.status,
    5: mapped.level5.status,
  } as const;

  const levelSummaries = {
    1: getLevelSummary(1, mapped),
    2: getLevelSummary(2, mapped),
    3: getLevelSummary(3, mapped),
    4: getLevelSummary(4, mapped),
    5: getLevelSummary(5, mapped),
  } as const;

  const showFoundationHint = activeLevel >= 3 && statuses[1] !== "healthy";

  return (
    <>
      <div className="space-y-4 rounded-xl border bg-[#FAFAF7] p-4 text-[#2D3436]">
        <div className="flex flex-row items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold">Financial Home Pyramid</h2>
            <p className="text-sm text-muted-foreground">
              Building your financial future from the ground up
            </p>
          </div>
          {helpButton}
        </div>

        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          &quot;A strong financial home is built from the foundation up. Let&apos;s see where your home
          stands today.&quot;
        </div>

        <PyramidVisualization
          activeLevel={activeLevel}
          onSelect={setActiveLevel}
          levelStatuses={statuses}
          levelSummaries={levelSummaries}
          levelData={{
            1: mapped.level1,
            2: mapped.level2,
            3: mapped.level3,
            4: mapped.level4,
            5: mapped.level5,
          }}
        />

        {showFoundationHint ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Strengthen your foundation first — Levels 1 and 2 support everything above.
          </div>
        ) : null}

        <PyramidHealthSummary
          complete={mapped.level5.freedom.pillarsComplete}
          total={mapped.level5.freedom.totalPillars}
          message={levelSummaries[5]}
        />

        <BottomUpIndicator />

        <div className="flex justify-end">
          <Button onClick={onContinue} className="gap-1.5">
            Continue to Financial X Curve <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
      <FinancialPrioritizationDrawer
        open={showPrioritizationHelp}
        onClose={() => setShowPrioritizationHelp(false)}
      />
    </>
  );
}
