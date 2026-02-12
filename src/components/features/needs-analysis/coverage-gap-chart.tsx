"use client";

import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/formatters/currency";
import type { CoverageGap } from "@/types";

const EXISTING_COLOR = "hsl(142.1 76.2% 36.3%)"; // green
const GAP_COLOR = "hsl(38 92% 50%)"; // amber

function labelFromCategory(category: string): string {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface CoverageGapChartProps {
  coverageGaps: CoverageGap[];
}

export function CoverageGapChart({ coverageGaps }: CoverageGapChartProps) {
  const data = coverageGaps.map((gap) => ({
    category: labelFromCategory(gap.category),
    rawCategory: gap.category,
    totalNeed: gap.totalNeed,
    existingCoverage: gap.existingCoverage,
    gap: gap.gap,
  }));

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border bg-muted/30">
        <p className="text-muted-foreground text-sm">
          No coverage gap data to display
        </p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v)}
            className="text-xs"
          />
          <YAxis
            type="category"
            dataKey="category"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value ?? 0))}
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend
            formatter={(value) => {
              const labels: Record<string, string> = {
                totalNeed: "Total Need",
                existingCoverage: "Existing Coverage",
                gap: "Coverage Gap",
              };
              return labels[value] ?? value;
            }}
          />
          <Bar dataKey="existingCoverage" stackId="a" fill={EXISTING_COLOR} name="existingCoverage" />
          <Bar dataKey="gap" stackId="a" fill={GAP_COLOR} name="gap" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
