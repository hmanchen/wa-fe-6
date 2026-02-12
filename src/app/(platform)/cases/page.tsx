import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CaseList } from "@/components/features/cases/case-list";
import { Plus } from "lucide-react";

export default function CasesPage() {
  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <PageHeader
        title="Cases"
        description="Manage and track your client cases"
      >
        <Button asChild>
          <Link href="/cases/new">
            <Plus className="size-4" />
            New Case
          </Link>
        </Button>
      </PageHeader>
      <CaseList />
    </div>
  );
}
