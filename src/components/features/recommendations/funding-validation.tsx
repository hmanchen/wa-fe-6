"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { FundingValidation } from "@/types/recommendation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatPercentage } from "@/lib/formatters/percentage";
import { cn } from "@/lib/utils";

export interface FundingValidationProps {
  validation: FundingValidation;
  className?: string;
}

type AffordabilityStatus = "affordable" | "borderline" | "not-affordable";

function getAffordabilityStatus(validation: FundingValidation): AffordabilityStatus {
  const { incomePercentage, maxRecommendedPercentage, isAffordable } = validation;
  if (isAffordable && incomePercentage <= maxRecommendedPercentage) return "affordable";
  if (incomePercentage <= maxRecommendedPercentage * 1.2) return "borderline";
  return "not-affordable";
}

const STATUS_CONFIG: Record<
  AffordabilityStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    iconClass: string;
    cardClass: string;
  }
> = {
  affordable: {
    icon: CheckCircle2,
    label: "Within Budget",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    cardClass: "border-emerald-500/30 bg-emerald-500/5",
  },
  borderline: {
    icon: AlertTriangle,
    label: "Borderline — Review Recommended",
    iconClass: "text-amber-600 dark:text-amber-400",
    cardClass: "border-amber-500/30 bg-amber-500/5",
  },
  "not-affordable": {
    icon: XCircle,
    label: "Over Budget",
    iconClass: "text-destructive",
    cardClass: "border-destructive/30 bg-destructive/5",
  },
};

export function FundingValidationDisplay({ validation, className }: FundingValidationProps) {
  const status = getAffordabilityStatus(validation);
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const progressValue = Math.min(
    100,
    (validation.incomePercentage / validation.maxRecommendedPercentage) * 100
  );

  return (
    <Card className={cn(config.cardClass, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-5", config.iconClass)} />
          <h3 className="font-semibold">{config.label}</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Total Monthly Premium
            </p>
            <p className="text-lg font-semibold">
              {formatCurrency(validation.monthlyPremiumTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              % of Income
            </p>
            <p className={cn(
              "text-lg font-semibold",
              status === "affordable" && "text-emerald-600 dark:text-emerald-400",
              status === "borderline" && "text-amber-600 dark:text-amber-400",
              status === "not-affordable" && "text-destructive"
            )}>
              {formatPercentage(validation.incomePercentage)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Max Recommended
            </p>
            <p className="text-lg font-semibold text-muted-foreground">
              {formatPercentage(validation.maxRecommendedPercentage)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Income allocation</span>
            <span className="font-medium">{formatPercentage(validation.incomePercentage)}</span>
          </div>
          <Progress
            value={progressValue}
            className={cn(
              status === "affordable" && "[&_[data-slot=progress-indicator]]:bg-emerald-500",
              status === "borderline" && "[&_[data-slot=progress-indicator]]:bg-amber-500",
              status === "not-affordable" && "[&_[data-slot=progress-indicator]]:bg-destructive"
            )}
          />
        </div>

        {(status === "borderline" || status === "not-affordable") && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Recommendations
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-700 dark:text-amber-300">
              <li>Consider reducing coverage amounts to fit within budget</li>
              <li>Review term lengths — shorter terms may lower premiums</li>
              <li>Explore alternative product types with lower premiums</li>
              <li>Stagger implementation: add critical products first</li>
            </ul>
          </div>
        )}

        {validation.notes && (
          <p className="text-sm text-muted-foreground">{validation.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
