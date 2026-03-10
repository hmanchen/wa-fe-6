"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setWidth(clamped), 20);
    return () => window.clearTimeout(t);
  }, [clamped]);

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

