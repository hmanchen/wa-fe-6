"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/formatters/currency";
import { cn } from "@/lib/utils";

export interface NeedsChartDataItem {
  category: string;
  amount: number;
  color?: string;
}

export interface NeedsChartProps {
  data: NeedsChartDataItem[];
  className?: string;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function NeedsChart({ data, className }: NeedsChartProps) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground",
          className
        )}
      >
        No data to display
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const renderCustomLabel = () => (
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground text-sm font-semibold"
    >
      {formatCurrency(total)}
    </text>
  );

  return (
    <div className={cn("h-[300px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={2}
            label={renderCustomLabel}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.category}`}
                fill={entry.color ?? CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            formatter={(value, _name, props) => {
              const val = Number(value ?? 0);
              const payload = props?.payload as NeedsChartDataItem | undefined;
              const pct =
                total > 0 ? ((val / total) * 100).toFixed(1) : "0";
              return [
                formatCurrency(val),
                `${payload?.category ?? ""} (${pct}%)`,
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (
              <span className="text-foreground">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
