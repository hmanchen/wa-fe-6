"use client";

import { Download, FileText, Mail, Share2 } from "lucide-react";
import type { ReportStatus } from "@/types/report";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ReportActionsProps {
  caseId: string;
  reportId?: string;
  status: ReportStatus;
  onGenerate: () => void | Promise<void>;
  onDownload: () => void | Promise<void>;
  className?: string;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  generating: "Generating report...",
  ready: "Report ready",
  error: "Generation failed",
};

export function ReportActions({
  caseId,
  reportId,
  status,
  onGenerate,
  onDownload,
  className,
}: ReportActionsProps) {
  const isGenerating = status === "generating";
  const isReady = status === "ready";

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center", className)}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="size-4" />
                Generate Report
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onDownload}
            disabled={!isReady}
          >
            <Download className="size-4" />
            Download PDF
          </Button>
        </div>

        <div className="flex items-center gap-2 border-t pt-4 sm:border-l sm:border-t-0 sm:pt-0 sm:pl-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" disabled>
                <Share2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Coming Soon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" disabled>
                <Mail className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Email to Client — Coming Soon</TooltipContent>
          </Tooltip>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-sm",
            status === "generating" && "text-muted-foreground",
            status === "ready" && "text-emerald-600 dark:text-emerald-400",
            status === "error" && "text-destructive"
          )}
        >
          {isGenerating && <LoadingSpinner size="sm" />}
          <span>{STATUS_LABELS[status]}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
