"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/formatters/date";
import type { CaseListItem } from "@/types/case";
import { ChevronRight, Archive } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onArchive?: (caseItem: CaseListItem & { description?: string }) => void;
  isArchiving?: boolean;
  pipelineStatus?: string;
  onPipelineChange?: (value: string) => void;
  isStatusUpdating?: boolean;
}

export function CaseCard({
  case: caseItem,
  onArchive,
  isArchiving = false,
  pipelineStatus,
  onPipelineChange,
  isStatusUpdating = false,
}: CaseCardProps) {
  const router = useRouter();
  const description = caseItem.description ?? "No description provided.";

  return (
    <Card
      className="hover:border-primary/50 h-full cursor-pointer transition-colors hover:shadow-md"
      onClick={() => router.push(`/cases/${caseItem.id}`)}
    >
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
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {caseItem.clientPhone && <p>Phone: {caseItem.clientPhone}</p>}
            {caseItem.meetingDate && (
              <p>
                Last Meeting: {new Date(caseItem.meetingDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              {CASE_TYPE_LABELS[caseItem.caseType] ?? caseItem.caseType}
            </Badge>
            {onPipelineChange && (
              <Select
                value={pipelineStatus ?? "draft"}
                onValueChange={onPipelineChange}
                disabled={isStatusUpdating}
              >
                <SelectTrigger
                  className="h-7 w-[140px] text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                  <SelectItem value="follow_up">Follow-Up</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
            {onArchive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                disabled={isArchiving}
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(caseItem);
                }}
              >
                <Archive className="size-3.5" />
                Archive
              </Button>
            )}
          </div>
          <span className="text-muted-foreground flex items-center text-xs">
            Updated {formatRelativeDate(caseItem.updatedAt)}
            <ChevronRight className="ml-1 size-4" />
          </span>
        </CardFooter>
      </Card>
  );
}
