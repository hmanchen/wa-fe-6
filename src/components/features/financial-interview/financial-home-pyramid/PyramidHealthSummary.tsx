"use client";

import { ProgressBar } from "./ProgressBar";
import { SUMMARY_FADE_MS } from "./pyramidAnimations";

export function PyramidHealthSummary({
  complete,
  total,
  message,
}: {
  complete: number;
  total: number;
  message: string;
}) {
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
  return (
    <div
      className="rounded-xl border bg-card p-4 shadow-sm"
      style={{ animation: "fade-up .45s ease both", animationDelay: `${SUMMARY_FADE_MS}ms` }}
    >
      <p className="text-sm font-semibold">Your Pyramid Health: {complete} of {total} pillars active</p>
      <div className="mt-2"><ProgressBar value={pct} /></div>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

