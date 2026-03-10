"use client";

import { EducationalTooltip } from "./EducationalTooltip";

export function DataCard({
  title,
  subtitle,
  children,
  tooltip,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {tooltip ? <EducationalTooltip text={tooltip} /> : null}
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

