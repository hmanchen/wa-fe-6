"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Static mock data avoids hydration mismatch — no Date/Math.random at module scope
const MOCK_ACTIVITY = [
  { month: "Sep", cases: 8, fullMonth: "September 2025" },
  { month: "Oct", cases: 12, fullMonth: "October 2025" },
  { month: "Nov", cases: 6, fullMonth: "November 2025" },
  { month: "Dec", cases: 10, fullMonth: "December 2025" },
  { month: "Jan", cases: 14, fullMonth: "January 2026" },
  { month: "Feb", cases: 9, fullMonth: "February 2026" },
];

export function ActivityChart() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Case Activity</CardTitle>
        <CardDescription>New cases by month (last 6 months)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {!mounted ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading chart...
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={MOCK_ACTIVITY}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.fullMonth ?? ""
                }
                formatter={(value) => [`${value ?? 0} cases`, "Cases"]}
              />
              <Bar
                dataKey="cases"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
