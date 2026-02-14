"use client";

import { MessageSquareText, ShieldCheck, Lightbulb, AlertTriangle } from "lucide-react";
import type { DiscoveryStep } from "@/types/discovery";

interface TalkingPoint {
  icon: "tip" | "trust" | "question" | "caution";
  text: string;
}

interface StepGuidance {
  subtitle: string;
  points: TalkingPoint[];
}

const STEP_GUIDANCE: Record<DiscoveryStep, StepGuidance> = {
  "personal-info": {
    subtitle: "Building trust & basics",
    points: [
      { icon: "trust", text: "All details shared are strictly confidential." },
      { icon: "tip", text: "Approximate ranges are fine if exact info feels uncomfortable." },
      { icon: "trust", text: "As fiduciaries, we're legally bound to protect client data." },
      { icon: "tip", text: "Info can be updated anytime — nothing is locked in." },
      { icon: "question", text: '"Any recent changes — marriage, new child, job change?"' },
      { icon: "tip", text: "Personalized recommendations require an accurate profile." },
    ],
  },
  "financial-profile": {
    subtitle: "Financial picture",
    points: [
      { icon: "tip", text: "Reasonable estimates work — exact figures aren't required." },
      { icon: "question", text: '"Any big changes ahead — raise, inheritance, retirement?"' },
      { icon: "tip", text: "Debt-to-income ratio is key for insurers and lenders." },
      { icon: "caution", text: "Emergency fund: guideline is 3-6 months of expenses." },
      { icon: "tip", text: "Focus on net worth trends, not the absolute number." },
      { icon: "question", text: '"Any commitments not captured — family support, business?"' },
    ],
  },
  "existing-coverage": {
    subtitle: "Current protection review",
    points: [
      { icon: "tip", text: "Review prevents duplication and identifies gaps." },
      { icon: "question", text: '"When was each policy last reviewed?"' },
      { icon: "caution", text: "Employer coverage is often insufficient and not portable." },
      { icon: "tip", text: "Check beneficiary designations — outdated ones are costly." },
      { icon: "question", text: '"Any coverage declined, cancelled, or lapsed?"' },
      { icon: "tip", text: "Existing riders may already cover some needs." },
    ],
  },
  "goals-priorities": {
    subtitle: "Defining priorities",
    points: [
      { icon: "tip", text: "Focus on what to protect, not which product to buy." },
      { icon: "question", text: '"What keeps you up at night financially?"' },
      { icon: "tip", text: "Prioritizing helps target the most impactful areas first." },
      { icon: "caution", text: "Discuss trade-offs: full coverage now vs. phased approach." },
      { icon: "tip", text: "Goals should be specific and time-bound when possible." },
      { icon: "trust", text: "This is a living plan — we'll revisit and adjust together." },
    ],
  },
};

const ICON_MAP = {
  tip: Lightbulb,
  trust: ShieldCheck,
  question: MessageSquareText,
  caution: AlertTriangle,
};

const ICON_COLOR_MAP = {
  tip: "text-blue-500",
  trust: "text-emerald-500",
  question: "text-violet-500",
  caution: "text-amber-500",
};

export interface AdvisorTalkingPointsProps {
  step: DiscoveryStep;
}

export function AdvisorTalkingPoints({ step }: AdvisorTalkingPointsProps) {
  const guidance = STEP_GUIDANCE[step];

  return (
    <div>
      <div className="mb-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Session Guide
        </h3>
        <p className="text-[11px] text-muted-foreground/70">{guidance.subtitle}</p>
      </div>

      <div className="space-y-2">
        {guidance.points.map((point, i) => {
          const Icon = ICON_MAP[point.icon];
          const colorClass = ICON_COLOR_MAP[point.icon];

          return (
            <div key={i} className="flex gap-2">
              <Icon className={`size-3.5 shrink-0 mt-[3px] ${colorClass}`} />
              <p className="text-xs leading-snug text-muted-foreground">
                {point.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
