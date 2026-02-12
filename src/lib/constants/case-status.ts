import type { CaseStatus } from "@/types";

export interface CaseStatusConfig {
  label: string;
  color: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  description: string;
  nextSteps: string[];
}

export const caseStatusConfig: Record<CaseStatus, CaseStatusConfig> = {
  draft: {
    label: "Draft",
    color: "slate",
    variant: "secondary",
    description: "Case is being set up",
    nextSteps: ["Complete basic case details", "Assign client"],
  },
  discovery: {
    label: "Discovery",
    color: "blue",
    variant: "default",
    description: "Gathering client information",
    nextSteps: ["Complete personal info", "Collect financial data", "Document existing coverage"],
  },
  analysis: {
    label: "Analysis",
    color: "amber",
    variant: "default",
    description: "Analyzing needs and running computations",
    nextSteps: ["Run needs analysis", "Review AI insights"],
  },
  recommendation: {
    label: "Recommendation",
    color: "purple",
    variant: "default",
    description: "Preparing recommendations",
    nextSteps: ["Validate funding", "Finalize recommendations"],
  },
  report: {
    label: "Report",
    color: "indigo",
    variant: "default",
    description: "Generating report",
    nextSteps: ["Review report", "Share with client"],
  },
  completed: {
    label: "Completed",
    color: "green",
    variant: "default",
    description: "Case is complete",
    nextSteps: [],
  },
  archived: {
    label: "Archived",
    color: "gray",
    variant: "outline",
    description: "Case is archived",
    nextSteps: [],
  },
};
