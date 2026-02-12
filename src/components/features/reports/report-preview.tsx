"use client";

import type { ReportConfig, ReportSection } from "@/types/report";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SECTION_CONFIG: Record<
  ReportSection,
  { title: string; description: string }
> = {
  "executive-summary": {
    title: "Executive Summary",
    description: "High-level overview of client needs and recommended solutions.",
  },
  "client-profile": {
    title: "Client Profile",
    description: "Demographics, financial summary, and existing coverage.",
  },
  "needs-analysis": {
    title: "Needs Analysis",
    description: "Identified protection needs and coverage gaps by category.",
  },
  recommendations: {
    title: "Recommendations",
    description: "Insurance products recommended to address identified gaps.",
  },
  "funding-summary": {
    title: "Funding Summary",
    description: "Affordability analysis and premium allocation.",
  },
  "next-steps": {
    title: "Next Steps",
    description: "Implementation timeline and follow-up actions.",
  },
};

export interface ReportPreviewProps {
  caseId: string;
  config: ReportConfig;
  className?: string;
}

export function ReportPreview({ caseId, config, className }: ReportPreviewProps) {
  const enabledSections = (Object.entries(config.sections) as [ReportSection, boolean][])
    .filter(([, enabled]) => enabled)
    .map(([section]) => section);

  return (
    <div
      className={cn(
        "mx-auto max-w-[8.5in] overflow-hidden rounded-lg border bg-white shadow-lg",
        "aspect-[8.5/11] min-h-[600px]",
        className
      )}
    >
      <div className="relative flex h-full flex-col p-8">
        {/* Preview watermark */}
        <div className="bg-muted/80 absolute inset-0 z-10 flex items-center justify-center">
          <div
            className="flex -rotate-[-20deg] flex-col items-center gap-2"
            aria-hidden
          >
            <p className="text-4xl font-bold text-muted-foreground/60">
              PREVIEW
            </p>
            <p className="text-sm text-muted-foreground/50">
              This is a preview of your report
            </p>
          </div>
        </div>

        {/* Report content */}
        <div className="relative z-0 flex flex-1 flex-col gap-6 overflow-y-auto">
          <header className="border-b pb-6">
            <h1 className="text-2xl font-bold text-foreground">
              WealthArchitect
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Client Recommendation Report — Case #{caseId}
            </p>
            {config.companyBranding && (
              <Badge variant="secondary" className="mt-2">
                Company Branding
              </Badge>
            )}
          </header>

          <div className="flex flex-1 flex-col gap-6">
            {enabledSections.map((sectionKey) => {
              const section = SECTION_CONFIG[sectionKey];
              return (
                <Card key={sectionKey} className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                    <p className="text-muted-foreground text-sm">
                      {section.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground space-y-2 text-sm">
                      <p>[Section content will be generated when report is created]</p>
                      {config.includeCharts && sectionKey === "needs-analysis" && (
                        <p className="italic">Charts will appear here</p>
                      )}
                      {config.includeAiExplanations && (
                        <p className="italic">AI explanations will be included</p>
                      )}
                      {config.advisorSignature && sectionKey === "executive-summary" && (
                        <p className="italic">Advisor signature block</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {enabledSections.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
              Select at least one section in Report Configuration to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
