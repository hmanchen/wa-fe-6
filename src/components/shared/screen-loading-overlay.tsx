"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenLoadingOverlayProps {
  message?: string;
  className?: string;
}

export function ScreenLoadingOverlay({
  message = "Loading...",
  className,
}: ScreenLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center rounded-xl border bg-background/75 backdrop-blur-[2px]",
        className
      )}
      role="status"
      aria-label={message}
    >
      <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 shadow-sm">
        <Loader2 className="size-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}

