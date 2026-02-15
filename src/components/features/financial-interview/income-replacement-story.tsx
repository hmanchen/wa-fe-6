"use client";

import { useState, useEffect } from "react";
import {
  ArrowUp,
  ArrowRight,
  AlertTriangle,
  Shield,
  ScrollText,
  TrendingUp,
  Briefcase,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Story steps ──────────────────────────────────────────────

interface StoryStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  arrowLabel?: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    id: "age",
    title: "Age Increases",
    description: "As we get older and gain more experience...",
    icon: <TrendingUp className="size-5" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    arrowLabel: "leads to",
  },
  {
    id: "experience",
    title: "Work Experience Goes Up",
    description: "More years in the field, more skills, more value",
    icon: <Briefcase className="size-5" />,
    color: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    arrowLabel: "results in",
  },
  {
    id: "income",
    title: "Income Goes Up",
    description: "Higher skills = higher compensation",
    icon: <DollarSign className="size-5" />,
    color: "bg-green-500/10 text-green-600 border-green-200",
    arrowLabel: "which means",
  },
  {
    id: "expenses",
    title: "Expenses & Lifestyle Go Up",
    description:
      "Bigger house, better cars, private schools, vacations...",
    icon: <ShoppingCart className="size-5" />,
    color: "bg-amber-500/10 text-amber-600 border-amber-200",
    arrowLabel: "creating",
  },
  {
    id: "risk",
    title: "Income Replacement Risk Increases",
    description:
      "The gap between your lifestyle cost and zero income becomes HUGE",
    icon: <AlertTriangle className="size-5" />,
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
];

// ── Risk explainer ───────────────────────────────────────────

function RiskDiagram({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="mt-4 space-y-4 rounded-lg border-2 border-dashed border-red-200 bg-red-50/50 p-4 dark:border-red-900 dark:bg-red-950/20">
      <p className="text-center text-sm font-semibold text-red-700 dark:text-red-400">
        Income Replacement Risk is a function of:
      </p>

      <div className="flex items-center justify-center gap-6">
        {/* Expenses box */}
        <div className="flex flex-col items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <ShoppingCart className="size-5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            Your Expenses
          </span>
          <ArrowUp className="size-4 text-amber-600" />
        </div>

        {/* Plus */}
        <span className="text-xl font-bold text-red-500">&</span>

        {/* Salary box */}
        <div className="flex flex-col items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
          <DollarSign className="size-5 text-green-600" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            Your Salary
          </span>
          <ArrowUp className="size-4 text-green-600" />
        </div>
      </div>

      <div className="space-y-2 rounded-md bg-background/60 p-3 text-xs leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">The key insight:</strong> You are
          earning significantly more, but you are also{" "}
          <strong className="text-foreground">spending significantly</strong>.
          If the salary suddenly reduces or disappears, it will{" "}
          <strong className="text-red-600">pinch that much harder</strong>.
        </p>
        <p>
          For example: if a job loss happens due to a health condition, your
          company may cover you for 1-2 months. After that — how do you handle
          the gap?
        </p>
        <p>
          But if your expenses are very low even though your salary is high, the
          impact won&apos;t be as severe.
        </p>
      </div>

      {/* Solution boxes */}
      <p className="text-center text-xs font-semibold text-foreground">
        To overcome Income Replacement Risk, most people do 2 things:
      </p>
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <Shield className="size-4 text-primary" />
          <span className="text-sm font-medium">Life Insurance</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2">
          <ScrollText className="size-4 text-primary" />
          <span className="text-sm font-medium">Will & Trust</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Story Component ─────────────────────────────────────

export function IncomeReplacementStory() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showRisk, setShowRisk] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Auto-advance when playing
  useEffect(() => {
    if (!autoPlay) return;
    if (visibleCount >= STORY_STEPS.length) {
      // Show risk diagram after all steps
      const t = setTimeout(() => {
        setShowRisk(true);
        setAutoPlay(false);
      }, 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 2000);
    return () => clearTimeout(t);
  }, [autoPlay, visibleCount]);

  const handleAdvance = () => {
    if (visibleCount < STORY_STEPS.length) {
      setVisibleCount((c) => c + 1);
    } else {
      setShowRisk(true);
    }
  };

  const handleReset = () => {
    setVisibleCount(0);
    setShowRisk(false);
    setAutoPlay(false);
  };

  const handleAutoPlay = () => {
    handleReset();
    setTimeout(() => setAutoPlay(true), 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Income Replacement Risk</h3>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleAutoPlay}
          >
            Auto-play
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Story flow */}
      <div className="space-y-0">
        {STORY_STEPS.map((step, idx) => (
          <div key={step.id}>
            {/* Step card */}
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-all duration-500",
                idx < visibleCount
                  ? `${step.color} opacity-100 translate-y-0`
                  : "border-transparent opacity-0 translate-y-2 h-0 overflow-hidden p-0 m-0"
              )}
              style={{
                transitionProperty: "opacity, transform, height, padding, margin",
              }}
            >
              <div className="mt-0.5 shrink-0">{step.icon}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{step.title}</p>
                  <ArrowUp className="size-3.5 text-current" />
                </div>
                <p className="text-xs text-current/70">{step.description}</p>
              </div>
            </div>

            {/* Arrow between steps */}
            {idx < STORY_STEPS.length - 1 && idx < visibleCount && (
              <div className="flex items-center gap-2 py-1 pl-6">
                <div className="h-4 w-px bg-border" />
                <ArrowRight className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground italic">
                  {step.arrowLabel}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Risk explanation */}
      <RiskDiagram visible={showRisk} />

      {/* Advance button */}
      {visibleCount <= STORY_STEPS.length && !showRisk && !autoPlay && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAdvance}
            className="gap-1"
          >
            {visibleCount < STORY_STEPS.length ? "Next" : "Show Risk Analysis"}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
