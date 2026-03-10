"use client";

import { cn } from "@/lib/utils";
import { LevelStatusBadge } from "./LevelStatusBadge";

export function PyramidLevel({
  level,
  title,
  subtitle,
  status,
  isActive,
  onClick,
  summary,
  delayMs,
}: {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  subtitle: string;
  status: "healthy" | "attention" | "not_started";
  isActive: boolean;
  onClick: () => void;
  summary: string;
  delayMs: number;
}) {
  const gradientByLevel: Record<number, string> = {
    1: "linear-gradient(135deg, #1B365D, #2C4A7C)",
    2: "linear-gradient(135deg, #00838F, #00A3A3)",
    3: "linear-gradient(135deg, #D4A84B, #E4C06B)",
    4: "linear-gradient(135deg, #6C3483, #8E5AA5)",
    5: "linear-gradient(135deg, #F4D03F, #F7DC6F)",
  };
  const textClass =
    level === 1 || level === 2 || level === 4
      ? "text-white"
      : "text-[#2D3436]";
  const subTextClass =
    level === 1 || level === 2 || level === 4
      ? "text-white/80"
      : "text-[#2D3436]/80";
  const clipByLevel: Record<number, string> = {
    1: "polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)",
    2: "polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)",
    3: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
    4: "polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)",
    5: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative block w-full text-left transition-all duration-300 hover:-translate-y-0.5"
      data-level={level}
      style={{
        opacity: 0,
        transform: "translateY(20px)",
        animation: "build-up .5s ease forwards",
        animationDelay: `${delayMs}ms`,
      }}
    >
      <div
        className={cn(
          "border px-4 py-3 shadow-sm transition-all duration-300",
          textClass,
          isActive ? "ring-2 ring-white/60 ring-offset-1" : "opacity-95 hover:opacity-100"
        )}
        style={{
          background: gradientByLevel[level],
          borderColor: "rgba(255,255,255,0.25)",
          clipPath: clipByLevel[level],
          boxShadow: isActive
            ? "0 10px 24px rgba(0,0,0,0.18)"
            : "0 4px 10px rgba(0,0,0,0.08)",
        }}
      >
        <div className="flex items-start justify-between gap-3 pl-6 md:pl-10">
          <div className="min-w-0">
            <p className={cn("text-xs uppercase tracking-widest", subTextClass)}>
              Level {level}
            </p>
            <p className="text-sm font-semibold">{title}</p>
            <p className={cn("text-xs", subTextClass)}>{subtitle}</p>
            <p className={cn("mt-1 text-xs", subTextClass)}>{summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <LevelStatusBadge status={status} />
            <span className={cn("text-xs", subTextClass)}>{isActive ? "▲" : "▼"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

