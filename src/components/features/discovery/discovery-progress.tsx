"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export interface DiscoveryProgressStep {
  id: string;
  label: string;
}

export interface DiscoveryProgressProps {
  steps: DiscoveryProgressStep[];
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function DiscoveryProgress({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: DiscoveryProgressProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1">
      {steps.map((step) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick?.(step.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-all",
              isCurrent &&
                "bg-background text-foreground shadow-sm",
              !isCurrent &&
                isCompleted &&
                "text-muted-foreground hover:bg-background/50 hover:text-foreground",
              !isCurrent &&
                !isCompleted &&
                "text-muted-foreground/70 hover:bg-background/50 hover:text-muted-foreground"
            )}
            aria-current={isCurrent ? "step" : undefined}
          >
            {isCompleted && (
              <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
            )}
            <span className="truncate">{step.label}</span>
          </button>
        );
      })}
    </div>
  );
}
