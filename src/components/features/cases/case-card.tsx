"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/formatters/date";
import type { CaseListItem } from "@/types/case";
import { ChevronRight } from "lucide-react";

const CASE_TYPE_LABELS: Record<string, string> = {
  life_insurance: "Life Insurance",
  retirement_planning: "Retirement Planning",
  estate_planning: "Estate Planning",
  investment_review: "Investment Review",
  comprehensive: "Comprehensive",
  other: "Other",
};

export interface CaseCardProps {
  case: CaseListItem & { description?: string };
}

export function CaseCard({ case: caseItem }: CaseCardProps) {
  const description = caseItem.description ?? "No description provided.";

  return (
    <Link href={`/cases/${caseItem.id}`} className="block">
      <Card className="hover:border-primary/50 h-full transition-colors hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight line-clamp-2">
              {caseItem.clientName}
            </h3>
            <StatusBadge status={caseItem.status} />
          </div>
          <p className="text-muted-foreground text-sm">
            {caseItem.caseNumber}
          </p>
        </CardHeader>
        <CardContent className="flex-1 pb-2">
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {description}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Badge variant="outline" className="text-xs font-normal">
            {CASE_TYPE_LABELS[caseItem.caseType] ?? caseItem.caseType}
          </Badge>
          <span className="text-muted-foreground flex items-center text-xs">
            Updated {formatRelativeDate(caseItem.updatedAt)}
            <ChevronRight className="ml-1 size-4" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
