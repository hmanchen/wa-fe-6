import { redirect } from "next/navigation";
import {
  FEATURE_FINANCIAL_HOME_SCREEN,
  FINANCIAL_HOME_SECTION_ID,
  FINANCIAL_HOME_PYRAMID_SECTION_ID,
} from "@/lib/financial-interview/workflow";

export default async function FinancialHomeRedirectPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const targetSection = FEATURE_FINANCIAL_HOME_SCREEN
    ? FINANCIAL_HOME_SECTION_ID
    : FINANCIAL_HOME_PYRAMID_SECTION_ID;
  redirect(`/cases/${caseId}/financial-interview?section=${targetSection}`);
}
