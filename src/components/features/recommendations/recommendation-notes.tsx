"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { cn } from "@/lib/utils";

const MAX_NOTES_LENGTH = 5000;

export interface RecommendationNotesProps {
  notes: string;
  onChange: (notes: string) => void;
  aiSummary?: string;
  onGenerateAiSummary?: () => Promise<void>;
  className?: string;
}

export function RecommendationNotes({
  notes,
  onChange,
  aiSummary,
  onGenerateAiSummary,
  className,
}: RecommendationNotesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const charCount = notes.length;
  const isOverLimit = charCount > MAX_NOTES_LENGTH;

  const handleGenerate = async () => {
    if (!onGenerateAiSummary) return;
    setIsGenerating(true);
    try {
      await onGenerateAiSummary();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Advisor Notes</h3>
          <p className="text-sm text-muted-foreground">
            Add your observations, rationale, and any client-specific context for this recommendation.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your notes for this recommendation..."
            rows={5}
            className={cn(isOverLimit && "border-destructive focus-visible:ring-destructive/20")}
            maxLength={MAX_NOTES_LENGTH + 100}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={cn(
              "text-muted-foreground",
              isOverLimit && "text-destructive font-medium"
            )}>
              {charCount.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()} characters
            </span>
          </div>
        </CardContent>
      </Card>

      {aiSummary && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-semibold">AI Summary</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-generated summary of your recommendation for client communications.
            </p>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      {onGenerateAiSummary && (
        <Button
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating || !notes.trim()}
        >
          {isGenerating ? (
            <>
              <LoadingSpinner size="sm" />
              Generating AI Summary...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Generate AI Summary
            </>
          )}
        </Button>
      )}
    </div>
  );
}
