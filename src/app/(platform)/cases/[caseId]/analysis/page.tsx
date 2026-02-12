"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function AnalysisRedirectPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const router = useRouter();
  useEffect(() => {
    router.replace(`/cases/${caseId}/needs-analysis`);
  }, [caseId, router]);
  return null;
}
