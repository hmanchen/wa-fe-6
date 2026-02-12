"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCases } from "@/hooks/use-cases";
import { formatRelativeDate } from "@/lib/formatters/date";
import type { CaseListItem, Case } from "@/types/case";
import { ChevronRight } from "lucide-react";

function CaseRow({
  case: caseItem,
}: {
  case: Case | CaseListItem;
}) {
  const clientName = caseItem.clientName || "Unnamed Client";

  return (
    <Link
      href={`/cases/${caseItem.id}`}
      className="hover:bg-muted/50 flex items-center justify-between gap-4 border-b py-4 last:border-0 last:pb-0 transition-colors"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium truncate">{clientName}</p>
        <p className="text-muted-foreground text-sm truncate">{caseItem.caseNumber}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <StatusBadge status={caseItem.status} />
        <span className="text-muted-foreground hidden w-24 truncate text-right text-sm sm:block">
          {formatRelativeDate(caseItem.updatedAt)}
        </span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      </div>
    </Link>
  );
}

export function RecentCases() {
  const { data, isLoading, isError } = useCases({
    pageSize: 5,
  });

  const cases = (data as { data?: Case[] } | undefined)?.data ?? data ?? [];
  const caseList = Array.isArray(cases) ? cases : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Recent Cases</CardTitle>
          <CardDescription>Your most recently updated cases</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cases">
            View All
            <ChevronRight className="ml-1 size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Unable to load recent cases. Please try again later.
          </div>
        ) : caseList.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No cases yet. Create your first case to get started.
          </div>
        ) : (
          <div className="-mx-2">
            {caseList.map((caseItem) => (
              <CaseRow key={caseItem.id} case={caseItem} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
