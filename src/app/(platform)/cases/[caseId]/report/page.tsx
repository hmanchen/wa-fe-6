"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { FileText, Settings2 } from "lucide-react";

import { CaseNav } from "@/components/layouts/case-nav";
import { PageHeader } from "@/components/shared/page-header";
import { ReportPreview } from "@/components/features/reports/report-preview";
import { ReportActions } from "@/components/features/reports/report-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { ReportConfig, ReportSection, ReportStatus } from "@/types/report";

const SECTION_OPTIONS: { id: ReportSection; label: string; description: string }[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    description: "High-level overview of findings and recommendations",
  },
  {
    id: "client-profile",
    label: "Client Profile",
    description: "Client demographics, financial summary, and existing coverage",
  },
  {
    id: "needs-analysis",
    label: "Needs Analysis",
    description: "Detailed insurance needs computation and coverage gap analysis",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    description: "Recommended insurance products and coverage solutions",
  },
  {
    id: "funding-summary",
    label: "Funding Summary",
    description: "Premium breakdown and affordability validation",
  },
  {
    id: "next-steps",
    label: "Next Steps",
    description: "Action items and implementation timeline",
  },
];

const DEFAULT_CONFIG: ReportConfig = {
  sections: {
    "executive-summary": true,
    "client-profile": true,
    "needs-analysis": true,
    recommendations: true,
    "funding-summary": true,
    "next-steps": true,
  },
  includeCharts: true,
  includeAiExplanations: true,
  advisorSignature: true,
  companyBranding: true,
};

export default function ReportPage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [reportStatus, setReportStatus] = useState<ReportStatus>("ready");
  const [showConfig, setShowConfig] = useState(true);

  const handleSectionToggle = useCallback((section: ReportSection, enabled: boolean) => {
    setConfig((prev) => ({
      ...prev,
      sections: { ...prev.sections, [section]: enabled },
    }));
  }, []);

  const handleToggle = useCallback(
    (key: keyof Omit<ReportConfig, "sections">, value: boolean) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleGenerate = useCallback(async () => {
    setReportStatus("generating");
    try {
      // Simulated API call — replace with actual generateReport call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setReportStatus("ready");
      toast.success("Report generated successfully!");
    } catch {
      setReportStatus("error");
      toast.error("Failed to generate report. Please try again.");
    }
  }, []);

  const handleDownload = useCallback(async () => {
    toast.info("Downloading report PDF...");
    // Simulated — replace with actual downloadReport call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Report downloaded!");
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <CaseNav
        caseId={caseId}
        currentStep="report"
        completedSteps={[]}
      />

      <PageHeader
        title="Recommendation Report"
        description="Configure and generate a client-ready PDF recommendation package."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowConfig((v) => !v)}
        >
          <Settings2 className="mr-2 size-4" />
          {showConfig ? "Hide" : "Show"} Configuration
        </Button>
      </PageHeader>

      <ReportActions
        caseId={caseId}
        status={reportStatus}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Configuration Panel */}
        {showConfig && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5" />
                  Report Sections
                </CardTitle>
                <CardDescription>
                  Choose which sections to include in the report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SECTION_OPTIONS.map((section) => (
                  <div key={section.id} className="flex items-start gap-3">
                    <Checkbox
                      id={section.id}
                      checked={config.sections[section.id]}
                      onCheckedChange={(checked) =>
                        handleSectionToggle(section.id, !!checked)
                      }
                    />
                    <div className="flex flex-col gap-0.5">
                      <Label
                        htmlFor={section.id}
                        className="text-sm font-medium leading-none"
                      >
                        {section.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {section.description}
                      </span>
                    </div>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="charts" className="text-sm">
                      Include Charts
                    </Label>
                    <Switch
                      id="charts"
                      checked={config.includeCharts}
                      onCheckedChange={(v) => handleToggle("includeCharts", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ai" className="text-sm">
                      AI Explanations
                    </Label>
                    <Switch
                      id="ai"
                      checked={config.includeAiExplanations}
                      onCheckedChange={(v) =>
                        handleToggle("includeAiExplanations", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signature" className="text-sm">
                      Advisor Signature
                    </Label>
                    <Switch
                      id="signature"
                      checked={config.advisorSignature}
                      onCheckedChange={(v) =>
                        handleToggle("advisorSignature", v)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="branding" className="text-sm">
                      Company Branding
                    </Label>
                    <Switch
                      id="branding"
                      checked={config.companyBranding}
                      onCheckedChange={(v) =>
                        handleToggle("companyBranding", v)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Preview */}
        <div className={showConfig ? "lg:col-span-2" : "lg:col-span-3"}>
          <ReportPreview caseId={caseId} config={config} />
        </div>
      </div>
    </div>
  );
}
