"use client";

import { cn } from "@/lib/utils";

export function LevelStatusBadge({
  status,
}: {
  status: "healthy" | "attention" | "not_started";
}) {
  const map = {
    healthy: {
      dot: "bg-emerald-600",
      text: "On Track",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "✓",
    },
    attention: {
      dot: "bg-amber-500",
      text: "Needs Attention",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: "⚠",
    },
    not_started: {
      dot: "bg-slate-400",
      text: "Not Yet Started",
      cls: "bg-slate-50 text-slate-700 border-slate-200",
      icon: "○",
    },
  } as const;
  const meta = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        meta.cls
      )}
    >
      <span className={cn("inline-block h-2 w-2 rounded-full", meta.dot)} />
      <span>{meta.icon}</span>
      {meta.text}
    </span>
  );
}

