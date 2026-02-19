"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUp,
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Shield,
  ScrollText,
  TrendingUp,
  Briefcase,
  DollarSign,
  ShoppingCart,
  Heart,
  Home,
  GraduationCap,
  Car,
  SkipForward,
  ChevronRight,
  Play,
  RotateCcw,
  Lightbulb,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Story step data ──────────────────────────────────────────

interface StoryStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgGradient: string;
  arrowLabel?: string;
}

const STORY_STEPS: StoryStep[] = [
  {
    id: "age",
    title: "Age Increases",
    subtitle: "The journey begins",
    description:
      "As we get older, we accumulate years of education, training, and real-world experience. Every year adds to our professional value.",
    icon: TrendingUp,
    color: "text-blue-600",
    bgGradient: "from-blue-500/10 to-blue-500/5 border-blue-200 dark:border-blue-800",
    arrowLabel: "leads to",
  },
  {
    id: "experience",
    title: "Work Experience Goes Up",
    subtitle: "Building expertise",
    description:
      "More years in the field means more skills, deeper expertise, bigger networks, and greater value to employers. You become harder to replace.",
    icon: Briefcase,
    color: "text-indigo-600",
    bgGradient: "from-indigo-500/10 to-indigo-500/5 border-indigo-200 dark:border-indigo-800",
    arrowLabel: "results in",
  },
  {
    id: "income",
    title: "Income Goes Up",
    subtitle: "Higher earning power",
    description:
      "Higher skills and experience command higher compensation. Promotions, raises, and better opportunities increase your earning power significantly.",
    icon: DollarSign,
    color: "text-green-600",
    bgGradient: "from-green-500/10 to-green-500/5 border-green-200 dark:border-green-800",
    arrowLabel: "which means",
  },
  {
    id: "expenses",
    title: "Expenses & Lifestyle Go Up",
    subtitle: "Lifestyle inflation",
    description:
      "As income rises, so do expectations. A bigger home, better cars, private schools, family vacations, dining out — the lifestyle expands to match (or exceed) income.",
    icon: ShoppingCart,
    color: "text-amber-600",
    bgGradient: "from-amber-500/10 to-amber-500/5 border-amber-200 dark:border-amber-800",
    arrowLabel: "creating",
  },
  {
    id: "risk",
    title: "Income Replacement Risk Increases",
    subtitle: "The hidden danger",
    description:
      "The gap between your lifestyle cost and zero income becomes ENORMOUS. This is the Income Replacement Risk — and most people don't realize how big it is until it's too late.",
    icon: AlertTriangle,
    color: "text-red-600",
    bgGradient: "from-red-500/10 to-red-500/5 border-red-200 dark:border-red-800",
  },
];

// ── Lifestyle cost breakdown ─────────────────────────────────

const LIFESTYLE_ITEMS = [
  { icon: Home, label: "Mortgage / Rent", color: "text-orange-500" },
  { icon: Car, label: "Car Payments", color: "text-blue-500" },
  { icon: GraduationCap, label: "Education", color: "text-purple-500" },
  { icon: Heart, label: "Healthcare", color: "text-red-500" },
  { icon: ShoppingCart, label: "Daily Living", color: "text-amber-500" },
  { icon: DollarSign, label: "Investments", color: "text-green-500" },
];

// ── Components ───────────────────────────────────────────────

function StepCard({
  step,
  index,
  visible,
}: {
  step: StoryStep;
  index: number;
  visible: boolean;
}) {
  const Icon = step.icon;
  return (
    <div
      className={cn(
        "flex-1 min-w-0 transition-all duration-700 ease-out",
        visible
          ? "opacity-100 scale-100"
          : "opacity-0 scale-90 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "h-full rounded-xl border-2 bg-gradient-to-br p-3 sm:p-4",
          step.bgGradient
        )}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm",
              step.color
            )}
          >
            <Icon className="size-5" />
          </div>
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Step {index + 1}
          </span>
          <h3 className={cn("text-sm font-bold leading-tight", step.color)}>
            {step.title}
          </h3>
          <ArrowUp className={cn("size-3.5", step.color)} />
          <p className="text-[11px] leading-snug text-foreground/70">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConnectorArrow({
  label,
  visible,
}: {
  label: string;
  visible: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center px-1 transition-all duration-500",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      <ArrowRight className="size-5 text-muted-foreground/50" />
      <span className="text-[9px] font-medium italic text-muted-foreground/60 whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}

function RiskExplainer({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "transition-all duration-700 ease-out",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none h-0 overflow-hidden"
      )}
    >
      <div className="space-y-8">
        {/* Risk function diagram — compact */}
        <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50/60 px-4 py-4 dark:border-red-800 dark:bg-red-950/20">
          <p className="mb-3 text-center text-sm font-bold text-red-700 dark:text-red-400">
            Income Replacement Risk is a function of two things:
          </p>

          <div className="flex items-center justify-center gap-6">
            {/* Expenses */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-5 py-3 dark:border-amber-800 dark:bg-amber-950/30">
              <ShoppingCart className="size-5 text-amber-600" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                Your Expenses
              </span>
              <div className="flex items-center gap-0.5">
                <ArrowUp className="size-3.5 text-amber-600" />
                <span className="text-[11px] text-amber-600">Going UP</span>
              </div>
            </div>

            {/* Ampersand */}
            <span className="text-xl font-black text-red-500">&</span>

            {/* Salary */}
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-green-300 bg-green-50/80 px-5 py-3 dark:border-green-800 dark:bg-green-950/30">
              <DollarSign className="size-5 text-green-600" />
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                Your Salary
              </span>
              <div className="flex items-center gap-0.5">
                <ArrowUp className="size-3.5 text-green-600" />
                <span className="text-[11px] text-green-600">Going UP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key insight callout — compact */}
        <div className="rounded-xl border bg-gradient-to-r from-background to-muted/30 p-4">
          <div className="flex gap-3">
            <Quote className="size-6 shrink-0 text-primary/30" />
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground">
                You are earning a{" "}
                <strong>significantly higher amount</strong>,
                but also{" "}
                <strong>spending significantly</strong>.
                If the salary suddenly disappears, it will{" "}
                <strong className="text-red-600">pinch you that much harder</strong>.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-foreground">Real-world scenario</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Job loss due to health — employer covers 1-2 months. After that, how do you handle
                    mortgage, car, education, and daily expenses?
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">The silver lining</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-emerald-600 dark:text-emerald-300">
                    If expenses are low even when salary is high, the impact is less severe.
                    Financial planning helps you prepare for the unexpected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solutions — compact */}
        <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb className="size-4 text-primary" />
            <h3 className="text-sm font-bold">
              To overcome this risk, most people do 2 things:
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-background p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="size-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold">Life Insurance</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Replaces income for your family — covers mortgage, education, and daily expenses.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Term Life", "Permanent", "IUL"].map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-background p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ScrollText className="size-4.5 text-primary" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold">Will & Trust</h4>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Ensures assets are distributed per your wishes — protects from probate and minimizes taxes.
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {["Last Will", "Living Trust", "Power of Attorney"].map((tag) => (
                    <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Screen Component ────────────────────────────────────

interface IncomeReplacementScreenProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function IncomeReplacementScreen({
  onContinue,
  onSkip,
}: IncomeReplacementScreenProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showRisk, setShowRisk] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const allStepsShown = visibleCount >= STORY_STEPS.length;
  const fullyRevealed = allStepsShown && showRisk;

  useEffect(() => {
    if (!autoPlay) return;
    if (visibleCount >= STORY_STEPS.length) {
      const t = setTimeout(() => {
        setShowRisk(true);
        setAutoPlay(false);
      }, 1500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, 1800);
    return () => clearTimeout(t);
  }, [autoPlay, visibleCount]);

  const handleAdvance = useCallback(() => {
    if (visibleCount < STORY_STEPS.length) {
      setVisibleCount((c) => c + 1);
    } else {
      setShowRisk(true);
    }
  }, [visibleCount]);

  const handleReset = useCallback(() => {
    setVisibleCount(0);
    setShowRisk(false);
    setAutoPlay(false);
  }, []);

  const handleAutoPlay = useCallback(() => {
    handleReset();
    setTimeout(() => setAutoPlay(true), 100);
  }, [handleReset]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Understanding Income Replacement Risk
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            An interactive walkthrough to help you understand why protecting your income matters
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleAutoPlay}
            disabled={autoPlay}
          >
            <Play className="size-3.5" />
            Auto-play
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Story flow — horizontal left-to-right */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {STORY_STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center">
            <StepCard
              step={step}
              index={idx}
              visible={idx < visibleCount}
            />
            {idx < STORY_STEPS.length - 1 && step.arrowLabel && (
              <ConnectorArrow
                label={step.arrowLabel}
                visible={idx < visibleCount && idx + 1 < visibleCount}
              />
            )}
          </div>
        ))}
      </div>

      {/* Advance button (when not all steps shown yet) */}
      {!fullyRevealed && !autoPlay && (
        <div className="flex justify-center">
          <Button
            size="lg"
            variant="outline"
            onClick={handleAdvance}
            className="gap-2 px-8"
          >
            {visibleCount === 0
              ? "Start the Story"
              : allStepsShown
                ? "Reveal the Risk Analysis"
                : "Next Step"}
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Risk explainer — full width */}
      <RiskExplainer visible={showRisk} />

      {/* Navigation buttons */}
      <div className="flex items-center justify-between border-t pt-6">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="gap-1.5 text-muted-foreground"
        >
          <SkipForward className="size-4" />
          Skip this section
        </Button>
        <Button onClick={onContinue} className="gap-1.5 px-6">
          Continue to Life Insurance
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
