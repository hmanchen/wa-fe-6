import type { FinancialInterviewSection } from "@/types/financial-interview";

export const FINANCIAL_HOME_SECTION_ID = "financial-home" satisfies FinancialInterviewSection;
export const FINANCIAL_HOME_PYRAMID_SECTION_ID =
  "financial-home-pyramid" satisfies FinancialInterviewSection;

export const FEATURE_FINANCIAL_HOME_SCREEN =
  (process.env.NEXT_PUBLIC_FEATURE_FINANCIAL_HOME_SCREEN ??
    process.env.FEATURE_FINANCIAL_HOME_SCREEN ??
    "false") === "true";

export interface FinancialInterviewSectionDef {
  id: FinancialInterviewSection;
  label: string;
  shortLabel: string;
}

export const FINANCIAL_INTERVIEW_SECTIONS: FinancialInterviewSectionDef[] = [
  {
    id: "financial-background",
    label: "Financial Background",
    shortLabel: "Background",
  },
  {
    id: "goals-discovery",
    label: "Goals & Discovery",
    shortLabel: "Goals",
  },
  {
    id: "income-replacement-risk",
    label: "Income Replacement Risk",
    shortLabel: "Risk",
  },
  {
    id: "protection-estate",
    label: "Protection & Estate",
    shortLabel: "Protection",
  },
  {
    id: "analysis-dashboard",
    label: "Analysis Dashboard",
    shortLabel: "Analysis",
  },
  {
    id: FINANCIAL_HOME_SECTION_ID,
    label: "Financial Home",
    shortLabel: "Fin Home",
  },
  {
    id: FINANCIAL_HOME_PYRAMID_SECTION_ID,
    label: "Financial Home Pyramid",
    shortLabel: "Pyramid",
  },
  {
    id: "financial-x-curve",
    label: "Financial X Curve",
    shortLabel: "X Curve",
  },
  {
    id: "recommendations",
    label: "Recommendations",
    shortLabel: "Recs",
  },
  {
    id: "delivery",
    label: "Delivery",
    shortLabel: "Deliver",
  },
];

export function getFinancialInterviewSections(
  includeFinancialHome = FEATURE_FINANCIAL_HOME_SCREEN
): FinancialInterviewSectionDef[] {
  if (includeFinancialHome) return FINANCIAL_INTERVIEW_SECTIONS;
  return FINANCIAL_INTERVIEW_SECTIONS.filter(
    (section) => section.id !== FINANCIAL_HOME_SECTION_ID
  );
}

export function resolveFinancialHomeSection(
  section: FinancialInterviewSection
): FinancialInterviewSection {
  if (section === FINANCIAL_HOME_SECTION_ID && !FEATURE_FINANCIAL_HOME_SCREEN) {
    return FINANCIAL_HOME_PYRAMID_SECTION_ID;
  }
  return section;
}

export function getNextSectionAfterAnalysis(): FinancialInterviewSection {
  return FEATURE_FINANCIAL_HOME_SCREEN
    ? FINANCIAL_HOME_SECTION_ID
    : FINANCIAL_HOME_PYRAMID_SECTION_ID;
}
