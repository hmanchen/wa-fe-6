"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Briefcase,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  iconClassName?: string;
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  iconClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <Icon className={cn("text-muted-foreground size-5", iconClassName)} />
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold sm:text-2xl">{value}</div>
        {change !== undefined && (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            {change >= 0 ? (
              <ArrowUpRight className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowDownRight className="size-3.5 text-destructive" />
            )}
            <span
              className={cn(
                change >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {Math.abs(change)}%
            </span>
            <span>vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const MOCK_STATS = {
  totalCases: { value: 42, change: 12 },
  activeCases: { value: 18, change: 8 },
  pendingReview: { value: 7, change: -3 },
  completedThisMonth: { value: 9, change: 22 },
};

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Cases"
        value={MOCK_STATS.totalCases.value}
        change={MOCK_STATS.totalCases.change}
        icon={Briefcase}
        iconClassName="text-primary"
      />
      <StatCard
        label="Active Cases"
        value={MOCK_STATS.activeCases.value}
        change={MOCK_STATS.activeCases.change}
        icon={TrendingUp}
        iconClassName="text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="Pending Review"
        value={MOCK_STATS.pendingReview.value}
        change={MOCK_STATS.pendingReview.change}
        icon={Clock}
        iconClassName="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        label="Completed This Month"
        value={MOCK_STATS.completedThisMonth.value}
        change={MOCK_STATS.completedThisMonth.change}
        icon={CheckCircle2}
        iconClassName="text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}
