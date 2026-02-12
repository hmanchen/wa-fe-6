"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { useAiExplanation } from "@/hooks/use-needs-analysis";
import { cn } from "@/lib/utils";

export interface AiExplanationProps {
  caseId: string;
  analysisId: string | null;
  explanation?: string | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export function AiExplanation({
  caseId,
  analysisId,
  explanation: initialExplanation,
  onGenerate,
  isGenerating = false,
}: AiExplanationProps) {
  const { data: fetchedExplanation, isLoading, refetch } = useAiExplanation(
    caseId,
    analysisId
  );

  const explanation =
    initialExplanation ?? fetchedExplanation ?? "";
  const loading = isLoading || isGenerating;
  const hasExplanation = !!explanation?.trim();

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50/50 to-blue-50/30 dark:border-violet-900/50 dark:from-violet-950/20 dark:to-blue-950/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/50">
            <Sparkles className="size-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-base">AI Analysis Summary</CardTitle>
            <CardDescription>
              Plain-language explanation of the needs analysis
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center gap-3 py-8">
            <LoadingSpinner size="sm" />
            <span className="text-muted-foreground text-sm">
              Generating AI summary...
            </span>
          </div>
        )}

        {!loading && hasExplanation && (
          <div
            className={cn(
              "prose prose-sm dark:prose-invert max-w-none",
              "prose-p:text-sm prose-p:leading-relaxed",
              "prose-ul:my-2 prose-li:my-0.5"
            )}
          >
            <p className="text-foreground whitespace-pre-wrap text-sm leading-relaxed">
              {explanation}
            </p>
          </div>
        )}

        {!loading && !hasExplanation && (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-sm">
              No AI explanation has been generated yet. Click the button below to
              generate a plain-language summary of this needs analysis.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (onGenerate ? onGenerate() : refetch())}
              className="border-violet-300 bg-violet-50 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:bg-violet-900/50"
            >
              <Sparkles className="mr-2 size-4" />
              Generate Explanation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
