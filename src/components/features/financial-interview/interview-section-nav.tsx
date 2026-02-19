"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialInterviewSection } from "@/types/financial-interview";

interface SectionDef {
  id: FinancialInterviewSection;
  label: string;
  shortLabel: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "financial-background",
    label: "Financial Background",
    shortLabel: "Background",
  },
  {
    id: "income-replacement-risk",
    label: "Income Replacement Risk",
    shortLabel: "Risk",
  },
  {
    id: "life-insurance-education",
    label: "Life Insurance & Will/Trust",
    shortLabel: "Insurance",
  },
  {
    id: "financial-home",
    label: "Financial Home",
    shortLabel: "Fin Home",
  },
  {
    id: "financial-x-curve",
    label: "Financial X Curve",
    shortLabel: "X Curve",
  },
  {
    id: "tax-diversification",
    label: "Tax Diversification",
    shortLabel: "Tax Div",
  },
];

interface InterviewSectionNavProps {
  currentSection: FinancialInterviewSection;
  completedSections: FinancialInterviewSection[];
  onSectionClick: (section: FinancialInterviewSection) => void;
}

export function InterviewSectionNav({
  currentSection,
  completedSections,
  onSectionClick,
}: InterviewSectionNavProps) {
  return (
    <nav className="overflow-x-auto [scrollbar-width:thin]">
      <div className="flex min-w-max items-center gap-0.5 rounded-lg bg-muted/40 p-1">
        {SECTIONS.map((section) => {
          const isCurrent = currentSection === section.id;
          const isCompleted = completedSections.includes(section.id);

          return (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                isCurrent
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              {isCompleted && (
                <Check className="size-3 text-primary" />
              )}
              <span className="hidden sm:inline">{section.label}</span>
              <span className="sm:hidden">{section.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { SECTIONS };
