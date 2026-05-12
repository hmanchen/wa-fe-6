"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EstatePlanningGuideProps {
  clientName?: string;
  hasChildren?: boolean;
  hasHome?: boolean;
  netWorth?: number;
  state?: string;
}

type QuizAnswer = boolean | null;
type ResultType = "will" | "trust" | "both";

const STORAGE_KEY = "arclis_estate_planning_guide_expanded";

type GuideCard = {
  id: string;
  title: string;
  icon: string;
  tagline: string;
  oneLiner: string;
  borderClass: string;
  sections: Array<{ heading: string; body: string[] }>;
  advisorTalkingPoint: string;
};

const GUIDE_CARDS: GuideCard[] = [
  {
    id: "will",
    title: "Last Will & Testament",
    icon: "📜",
    tagline: "Your voice after you're gone",
    oneLiner: "Tells the court exactly who gets what",
    borderClass: "border-l-[#0D3B6E]",
    sections: [
      {
        heading: "What it is",
        body: [
          "A legal document that names who inherits your assets, who manages your estate (executor), and who raises your children (guardian) if you pass away.",
        ],
      },
      {
        heading: "What happens WITHOUT it",
        body: [
          "🚨 Your state's intestacy laws decide who inherits — not you.",
          "🚨 In Tennessee, assets typically go to a spouse first, then children in equal shares.",
          "🚨 A court appoints a guardian for your children — it may not be who you would choose.",
        ],
      },
      {
        heading: "Cost and timeline",
        body: [
          "What it costs: $300 – $1,000 with an attorney.",
          "How long it takes: 1-2 meetings, typically 2-4 weeks.",
        ],
      },
      {
        heading: "Who needs it most",
        body: [
          "✓ Anyone with children",
          "✓ Anyone who owns property",
          "✓ Anyone with strong wishes about who inherits what",
          "✓ Anyone who wants to name their own executor",
        ],
      },
    ],
    advisorTalkingPoint:
      "💬 If something happened tonight, who would a Tennessee court appoint to raise your children? Would you be comfortable with that answer?",
  },
  {
    id: "trust",
    title: "Revocable Living Trust",
    icon: "🏛️",
    tagline: "Your assets, transferred instantly — privately",
    oneLiner: "Bypasses probate court completely",
    borderClass: "border-l-purple-600",
    sections: [
      {
        heading: "What it is",
        body: [
          "A legal entity that holds your assets during your lifetime and transfers them immediately upon death without probate.",
          "You remain in control while alive and can change or revoke it at any time.",
        ],
      },
      {
        heading: "Will vs. Trust — core difference",
        body: [
          "A Will says: Here is who gets my assets.",
          "A Trust says: My assets are already held here — transfer immediately when I die.",
          "A Will goes through probate. A Trust does not.",
        ],
      },
      {
        heading: "What probate means (see full explanation above)",
        body: [
          "🚨 Probate = a public court process that:",
          "• Takes 6-18 months in most states",
          "• Costs 3-5% of your estate in fees",
          "• Makes all your financial details public record",
          "• Delays your family's access to inherited assets",
          "A Trust avoids ALL of this — assets transfer immediately and privately.",
        ],
      },
      {
        heading: "Trust advantages",
        body: [
          "✓ Assets transfer in days, not months",
          "✓ Completely private",
          "✓ Avoids probate court entirely",
          "✓ Controls timing (for example, children receive at 25 instead of 18)",
          "✓ Works across multiple states",
          "✓ Harder to contest",
        ],
      },
      {
        heading: "Important limitation",
        body: [
          "✗ Trust setup can cost more ($1,500-$5,000)",
          "✗ Requires funding — assets must be moved into the trust to get the benefit",
        ],
      },
    ],
    advisorTalkingPoint:
      "💬 Without a trust, families can wait months and lose meaningful estate value to probate costs. A funded trust usually avoids that.",
  },
  {
    id: "poa",
    title: "Durable Power of Attorney",
    icon: "⚖️",
    tagline: "Who manages your money if you can't",
    oneLiner: "Financial decisions when you're incapacitated",
    borderClass: "border-l-emerald-600",
    sections: [
      {
        heading: "What it is",
        body: [
          "A legal document naming someone you trust to make financial decisions if you become incapacitated.",
          "Durable means it remains effective through incapacity.",
        ],
      },
      {
        heading: "What your agent can do",
        body: [
          "✓ Pay bills and mortgage",
          "✓ Access bank accounts",
          "✓ File taxes",
          "✓ Manage investments and real estate transactions",
          "✓ Apply for government benefits on your behalf",
        ],
      },
      {
        heading: "What happens WITHOUT it",
        body: [
          "🚨 Family may need court conservatorship/guardianship.",
          "🚨 Typical cost can be $3,000-$10,000+, plus delays and ongoing court oversight.",
        ],
      },
      {
        heading: "Who needs it most",
        body: [
          "✓ Every adult",
          "✓ Business owners",
          "✓ Anyone with significant assets",
          "✓ Parents of adult children (18+)",
        ],
      },
    ],
    advisorTalkingPoint:
      "💬 If one spouse is suddenly incapacitated, could the other legally manage every required account immediately?",
  },
  {
    id: "healthcare",
    title: "Healthcare Directive / Living Will",
    icon: "🏥",
    tagline: "Your voice in the ICU",
    oneLiner: "Medical decisions when you can't speak for yourself",
    borderClass: "border-l-rose-500",
    sections: [
      {
        heading: "What it is",
        body: [
          "Healthcare Directive (Medical POA): names someone to make medical decisions.",
          "Living Will: states your treatment preferences and end-of-life wishes.",
        ],
      },
      {
        heading: "Why it is separate",
        body: [
          "Your Durable POA covers financial decisions only.",
          "Healthcare documents cover medical decisions.",
          "You typically need both.",
        ],
      },
      {
        heading: "What it addresses",
        body: [
          "✓ CPR / resuscitation preferences",
          "✓ Life support decisions",
          "✓ Organ donation wishes",
          "✓ HIPAA medical access",
          "✓ Comfort care vs aggressive treatment conditions",
        ],
      },
      {
        heading: "What happens WITHOUT it",
        body: [
          "🚨 Hospitals follow legal next-of-kin and policy, not necessarily your preferred decision-maker.",
          "🚨 Family disagreements may require court intervention.",
        ],
      },
    ],
    advisorTalkingPoint:
      "💬 This document removes impossible ICU decisions from family members during a crisis.",
  },
  {
    id: "beneficiaries",
    title: "Beneficiary Designations",
    icon: "👥",
    tagline: "They override your Will — always",
    oneLiner: "The documents most people forget to update",
    borderClass: "border-l-[#FF9900]",
    sections: [
      {
        heading: "What it is",
        body: [
          "Beneficiary designations on specific accounts control who receives those assets, regardless of your Will.",
        ],
      },
      {
        heading: "Accounts that use designations",
        body: [
          "✓ 401(k) and employer plans",
          "✓ IRA accounts",
          "✓ Life insurance policies",
          "✓ Annuities",
          "✓ POD/TOD bank and brokerage accounts",
        ],
      },
      {
        heading: "Critical rule",
        body: [
          "🚨 Beneficiary designations override your Will.",
          "🚨 Outdated designations can unintentionally direct assets to ex-spouses or unintended recipients.",
        ],
      },
      {
        heading: "When to review",
        body: [
          "✓ After marriage or divorce",
          "✓ After birth or adoption",
          "✓ After beneficiary death",
          "✓ After major asset changes",
          "✓ At minimum every 3-5 years",
        ],
      },
    ],
    advisorTalkingPoint:
      "💬 Many clients have not reviewed their 401(k) beneficiaries in 10+ years — even after major life changes.",
  },
];

function DecisionResultCard({ result }: { result: ResultType }) {
  const config =
    result === "will"
      ? {
          border: "border-l-[#0D3B6E]",
          text: "Based on your answers, a WILL is your priority right now.",
        }
      : result === "trust"
        ? {
            border: "border-l-purple-600",
            text: "Based on your answers, a LIVING TRUST is recommended.",
          }
        : {
            border: "border-l-[#FF9900]",
            text: "Based on your answers, you need BOTH — start with the Will to name guardians, then build the Trust.",
          };

  return (
    <div className={cn("rounded-xl border border-l-4 bg-card p-4", config.border)}>
      <p className="text-sm font-semibold text-[#0D3B6E]">{config.text}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        This is educational guidance, not legal advice. Consult a licensed estate attorney.
      </p>
    </div>
  );
}

export function EstatePlanningGuide({
  clientName,
  hasChildren,
  hasHome,
  netWorth,
  state,
}: EstatePlanningGuideProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  });
  const [visibleSteps, setVisibleSteps] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [q1, setQ1] = useState<QuizAnswer>(null);
  const [q2, setQ2] = useState<QuizAnswer>(null);
  const [q3, setQ3] = useState<QuizAnswer>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const autoPlayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, isExpanded ? "1" : "0");
  }, [isExpanded]);

  useEffect(() => {
    if (!autoPlay || visibleSteps >= 3) return;
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
    autoPlayIntervalRef.current = setInterval(() => {
      setVisibleSteps((count) => {
        if (count >= 3) {
          setAutoPlay(false);
          return count;
        }
        const next = count + 1;
        if (next >= 3) {
          setAutoPlay(false);
        }
        return next;
      });
    }, 2000);

    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, [autoPlay, visibleSteps]);

  useEffect(() => {
    return () => {
      if (autoPlayIntervalRef.current) {
        clearInterval(autoPlayIntervalRef.current);
        autoPlayIntervalRef.current = null;
      }
    };
  }, []);

  const stateLabel = state?.trim() || "your state";
  const homeOrAssetQuestion = hasHome || (netWorth ?? 0) >= 250000
    ? "Do you own a home or have $250K+ in assets? (Likely yes from your profile)"
    : "Do you own a home or have $250K+ in assets?";
  const childrenQuestion =
    hasChildren === true
      ? "Do you have children under 18? (Likely yes from your profile)"
      : "Do you have children under 18?";

  const quizComplete = q1 !== null && q2 !== null && q3 !== null;

  const result = useMemo<ResultType | null>(() => {
    if (!quizComplete) return null;
    if (q2) return "both";
    if (q3 || q1) return "trust";
    return "will";
  }, [q1, q2, q3, quizComplete]);

  const resetWalkthrough = useCallback(() => {
    setVisibleSteps(1);
    setAutoPlay(false);
    if (autoPlayIntervalRef.current) {
      clearInterval(autoPlayIntervalRef.current);
      autoPlayIntervalRef.current = null;
    }
  }, []);

  const resetQuiz = useCallback(() => {
    setQ1(null);
    setQ2(null);
    setQ3(null);
  }, []);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-[#0D3B6E] hover:text-[#1F5C99]"
      >
        📚 Learn About Estate Planning Documents →
      </button>
    );
  }

  return (
    <div className="mb-4 rounded-xl border bg-[#FAFAF7] p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h4 className="text-base font-bold text-[#0D3B6E]">
          Learn About Estate Planning
        </h4>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 text-xs"
            onClick={() => {
              resetWalkthrough();
              setAutoPlay(true);
            }}
            disabled={autoPlay}
          >
            <Play className="size-3" />
            Auto-play
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 gap-1 text-xs"
            onClick={resetWalkthrough}
          >
            <RotateCcw className="size-3" />
            Reset
          </Button>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            ▼ Hide Estate Planning Guide
          </button>
        </div>
      </div>

      <div className="mt-4 transition-all duration-300">
        <div className="space-y-5">
          <div className="rounded-lg border bg-white p-3 sm:p-4">
            <h5 className="text-sm font-semibold text-[#0D3B6E]">
              Part A — Will vs. Trust Decision Guide
            </h5>

            <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-stretch">
              <div
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500 lg:w-64",
                  "border-[#1F5C99]/40 bg-[#DEEAF1]",
                  visibleSteps >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                )}
              >
                <p className="text-xs font-bold text-[#1F5C99]">STEP 1 • 🏠</p>
                <p className="mt-1 text-sm font-semibold text-[#0D3B6E]">
                  You Have Assets & a Family
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  You&apos;ve worked hard to build savings, home, retirement accounts, and have people who depend on you.
                  Now you need a plan for what happens to all of it.
                </p>
              </div>

              <div className={cn("hidden items-center justify-center text-xs italic text-muted-foreground transition-opacity lg:flex", visibleSteps >= 2 ? "opacity-100" : "opacity-0")}>
                so you ask →
              </div>

              <div
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500 lg:w-64",
                  "border-[#FF9900]/50 bg-[#FFF3CD]",
                  visibleSteps >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                )}
              >
                <p className="text-xs font-bold text-[#A05A00]">STEP 2 • ❓</p>
                <p className="mt-1 text-sm font-semibold text-[#0D3B6E]">
                  Who Gets What, When You&apos;re Gone?
                </p>
                <p className="mt-1 text-xs text-slate-700">
                  Without documents, a court decides everything. A judge — not you — determines inheritance, guardianship,
                  and control of money. This is called dying intestate.
                </p>
              </div>

              <div className={cn("hidden items-center justify-center text-xs italic text-muted-foreground transition-opacity lg:flex", visibleSteps >= 3 ? "opacity-100" : "opacity-0")}>
                this leads to →
              </div>

              <div
                className={cn(
                  "rounded-lg border p-3 transition-all duration-500 lg:flex-1",
                  "border-[#375623]/40 bg-[#E2EFDA]",
                  visibleSteps >= 3 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                )}
              >
                <p className="text-xs font-bold text-[#375623]">STEP 3 • ⚖️</p>
                <p className="mt-1 text-sm font-semibold text-[#0D3B6E]">
                  Two Solutions: Will or Trust
                </p>
                <div className="mt-2 grid gap-3 xl:grid-cols-2">
                  <div className="rounded-md border bg-white/80 p-3">
                    <p className="text-xs font-bold text-[#0D3B6E]">WILL</p>
                    <p className="text-xs italic text-muted-foreground">Simpler. Cheaper. Goes through court.</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p>✓ Directs asset distribution</p>
                      <p>✓ Names an executor</p>
                      <p>✓ Names guardians for children</p>
                      <p>✓ Becomes public record</p>
                      <p>✗ Goes through probate court</p>
                      <p>✗ Can take 6-18 months to settle</p>
                      <p>✗ Court fees reduce the estate</p>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Best for: Simpler estates, younger couples starting out, and anyone with minor children who must name guardians.
                    </p>
                  </div>
                  <div className="rounded-md border bg-white/80 p-3">
                    <p className="text-xs font-bold text-[#5B21B6]">TRUST</p>
                    <p className="text-xs italic text-muted-foreground">More control. Avoids probate.</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p>✓ Assets transfer immediately</p>
                      <p>✓ Completely private</p>
                      <p>✓ Avoids probate court entirely</p>
                      <p>✓ Controls timing for children</p>
                      <p>✓ Works across multiple states</p>
                      <p>✓ Harder to contest</p>
                      <p>✗ More expensive to set up ($1,500-$5,000)</p>
                      <p>✗ Requires funding — moving assets in</p>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      Best for: Homeowners, $250K+ assets, blended families, multi-state properties, and privacy-focused households.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {visibleSteps < 3 && (
              <div className="mt-3 flex justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setVisibleSteps((c) => Math.min(c + 1, 3))}
                >
                  Next Step
                </Button>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-l-4 border-l-amber-500 bg-[#FEF9C3] p-4">
              <p className="text-sm font-semibold text-amber-900">
                📋 What is Probate? — A Plain-English Explanation
              </p>
              <p className="mt-2 text-xs text-amber-900/90">
                Probate is the legal process that a court uses to officially transfer your assets after you die.
              </p>

              <div className="mt-3 space-y-1 text-xs text-amber-950">
                <p>1. Your family files your Will with the probate court</p>
                <p>2. A judge officially validates that the Will is legal</p>
                <p>3. The court appoints an executor to manage your estate</p>
                <p>4. All debts and taxes are paid from estate assets</p>
                <p>5. Only after all that — remaining assets go to heirs</p>
              </div>

              <p className="mt-3 text-xs font-semibold text-amber-900">Why this matters:</p>
              <div className="mt-1 space-y-1 text-xs text-amber-950">
                <p>⏱️ Time: In most states probate takes 6 to 18 months. Families often cannot access or sell inherited assets during this period.</p>
                <p>💰 Cost: Attorney and court fees typically consume 3% to 5% of the total estate value.</p>
                <p>📢 Public: Probate is a public court record. Anyone can look up what was owned and who received it.</p>
                <p>🏠 Property: Real estate is often hard to sell until probate concludes, even when funds are urgently needed.</p>
              </div>

              <p className="mt-3 text-xs font-semibold text-amber-900">The good news:</p>
              <div className="mt-1 space-y-1 text-xs text-amber-950">
                <p>✓ A properly funded Revocable Living Trust avoids probate entirely — assets transfer immediately, privately, with no court involvement.</p>
                <p>✓ Accounts with beneficiary designations (401k, IRA, life insurance) also avoid probate.</p>
                <p>✓ Jointly owned property with right of survivorship transfers automatically outside of probate.</p>
              </div>

              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs italic text-amber-900">
                Probate is not a disaster, but it is usually slow, expensive, and public.
                Most families find it stressful at an already difficult time. Estate planning aims to avoid it wherever possible in {stateLabel}.
              </div>
            </div>

            <div className="mt-4 rounded-lg border bg-muted/20 p-4">
              <p className="text-sm font-semibold text-[#0D3B6E]">Which Do You Need Right Now?</p>
              <div className="mt-3 space-y-3">
                {[
                  { id: "q1", label: homeOrAssetQuestion, value: q1, setValue: setQ1 },
                  { id: "q2", label: childrenQuestion, value: q2, setValue: setQ2 },
                  { id: "q3", label: "Do you have properties in multiple states?", value: q3, setValue: setQ3 },
                ].map((q) => (
                  <div key={q.id} className="rounded-md border bg-white p-3">
                    <p className="text-xs font-medium">{q.label}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => q.setValue(true)}
                        className={cn(
                          "rounded-md border px-3 py-1 text-xs font-semibold",
                          q.value === true ? "border-green-500 bg-green-50 text-green-700" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => q.setValue(false)}
                        className={cn(
                          "rounded-md border px-3 py-1 text-xs font-semibold",
                          q.value === false ? "border-red-400 bg-red-50 text-red-600" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {result && (
                <div className="mt-3 space-y-2">
                  <DecisionResultCard result={result} />
                  <button
                    type="button"
                    onClick={resetQuiz}
                    className="text-xs text-muted-foreground underline"
                  >
                    Reset quiz
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-3 sm:p-4">
            <h5 className="text-sm font-semibold text-[#0D3B6E]">
              Part B — Estate Planning Document Education
            </h5>
            <p className="mt-1 text-xs text-muted-foreground">
              {clientName ? `${clientName}, t` : "T"}hese are the five core documents that usually determine whether estate transitions are smooth or stressful.
            </p>

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {GUIDE_CARDS.map((card) => {
                const isOpen = Boolean(expandedCards[card.id]);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => toggleCard(card.id)}
                    className={cn(
                      "w-full rounded-xl border border-l-4 bg-card p-3 text-left shadow-sm transition",
                      card.borderClass
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#0D3B6E]">
                          {card.icon} {card.title}
                        </p>
                        <p className="text-xs italic text-muted-foreground">{card.tagline}</p>
                        <p className="mt-1 text-xs">{card.oneLiner}</p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      )}
                    </div>

                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-300",
                        isOpen ? "mt-3 max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="space-y-3 text-xs">
                        {card.sections.map((section) => (
                          <div key={section.heading}>
                            <p className="font-semibold text-[#0D3B6E]">{section.heading}</p>
                            <div className="mt-1 space-y-1 text-muted-foreground">
                              {section.body.map((line) => (
                                <p key={line}>{line}</p>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div className="rounded-md bg-[#F8FBFF] p-2 italic text-slate-700">
                          {card.advisorTalkingPoint}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              State detail shown as: {stateLabel}. Education content is informational and does not replace legal counsel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

