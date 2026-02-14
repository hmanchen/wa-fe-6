"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CaseForm } from "@/components/features/cases/case-form";
import { useCreateCase } from "@/hooks/use-cases";
import { toast } from "sonner";
import type { CreateCaseInput } from "@/lib/validators/case";

export default function NewCasePage() {
  const router = useRouter();
  const createCase = useCreateCase();

  async function handleSubmit(values: CreateCaseInput) {
    try {
      const caseData = await createCase.mutateAsync(values);
      toast.success("Case created successfully");
      router.push(`/cases/${caseData.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to create case: ${message}`);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title="Create New Case"
        description="Start a new client case for insurance and financial planning"
      />
      <div className="mx-auto w-full max-w-2xl">
        <CaseForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={createCase.isPending}
        />
      </div>
    </div>
  );
}
