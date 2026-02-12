"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatPercentage } from "@/lib/formatters/percentage";
import type { NeedsAnalysisResult } from "@/types";

export interface NeedsSummaryProps {
  result: NeedsAnalysisResult;
}

export function NeedsSummary({ result }: NeedsSummaryProps) {
  const { totalInsuranceNeed, totalExistingCoverage, totalGap } = result;
  const percentageCovered =
    totalInsuranceNeed > 0
      ? (totalExistingCoverage / totalInsuranceNeed) * 100
      : 0;
  const gapPercentage =
    totalInsuranceNeed > 0 ? (totalGap / totalInsuranceNeed) * 100 : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-700 dark:text-blue-400 text-base">
            Total Insurance Need
          </CardTitle>
          <CardDescription>Defensible total need</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-blue-800 dark:text-blue-300">
            {formatCurrency(totalInsuranceNeed)}
          </p>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-700 dark:text-emerald-400 text-base">
            Existing Coverage
          </CardTitle>
          <CardDescription>
            Current policies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">
            {formatCurrency(totalExistingCoverage)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatPercentage(percentageCovered)} of need covered
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-700 dark:text-amber-400 text-base">
            Coverage Gap
          </CardTitle>
          <CardDescription>Additional coverage needed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-amber-800 dark:text-amber-300">
            {formatCurrency(totalGap)}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatPercentage(gapPercentage)} unmet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
