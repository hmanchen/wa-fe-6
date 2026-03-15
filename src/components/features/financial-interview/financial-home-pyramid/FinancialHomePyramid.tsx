"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialHealthScore } from "@/types/financial-interview";
import { mapPyramidData, getLevelSummary } from "./pyramidDataMapper";
import { PyramidVisualization } from "./PyramidVisualization";
import { PyramidHealthSummary } from "./PyramidHealthSummary";
import { BottomUpIndicator } from "./BottomUpIndicator";

/* eslint-disable @typescript-eslint/no-explicit-any */

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
  const mapped = useMemo(
    () => mapPyramidData({ caseData, healthScore, fullAnalysis }),
    [caseData, healthScore, fullAnalysis]
  );
  const hasAnalysisData =
    !!fullAnalysis &&
    typeof fullAnalysis === "object" &&
    Object.keys(fullAnalysis).length > 0;

  if (!hasAnalysisData) {
    return (
      <div className="space-y-4 rounded-xl border bg-[#FAFAF7] p-4 text-[#2D3436]">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Financial Home Pyramid</h2>
          <p className="text-sm text-muted-foreground">
            Calculating pyramid values from your latest analysis...
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
          We are syncing your net worth, cash flow, debt, and protection calculations.
          This usually takes a few seconds.
        </div>
      </div>
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
    <div className="space-y-4 rounded-xl border bg-[#FAFAF7] p-4 text-[#2D3436]">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Financial Home Pyramid</h2>
        <p className="text-sm text-muted-foreground">
          Building your financial future from the ground up
        </p>
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
  );
}

