import { describe, expect, it } from "vitest";

import {
  FINANCIAL_HOME_SECTION_ID,
  FINANCIAL_HOME_PYRAMID_SECTION_ID,
  getFinancialInterviewSections,
} from "../src/lib/financial-interview/workflow";

describe("financial interview workflow sections", () => {
  it("hides Financial Home and keeps Financial Home Pyramid when the flag is false", () => {
    const sections = getFinancialInterviewSections(false);

    expect(sections).toHaveLength(9);
    expect(sections.map((section) => section.id)).not.toContain(FINANCIAL_HOME_SECTION_ID);
    expect(sections.map((section) => section.id)).toContain(FINANCIAL_HOME_PYRAMID_SECTION_ID);
    expect(sections.map((section) => section.label)).toEqual([
      "Financial Background",
      "Goals & Discovery",
      "Income Replacement Risk",
      "Protection & Estate",
      "Analysis Dashboard",
      "Financial Home Pyramid",
      "Financial X Curve",
      "Recommendations",
      "Delivery",
    ]);
  });

  it("includes Financial Home before Pyramid when the flag is true", () => {
    const sections = getFinancialInterviewSections(true);

    expect(sections).toHaveLength(10);
    expect(sections.map((section) => section.id)).toEqual([
      "financial-background",
      "goals-discovery",
      "income-replacement-risk",
      "protection-estate",
      "analysis-dashboard",
      FINANCIAL_HOME_SECTION_ID,
      FINANCIAL_HOME_PYRAMID_SECTION_ID,
      "financial-x-curve",
      "recommendations",
      "delivery",
    ]);
  });
});
