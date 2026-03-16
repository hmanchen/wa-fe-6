"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCases, useDeleteCase, useUpdateCase } from "@/hooks/use-cases";
import { useDebounce } from "@/hooks/use-debounce";
import { CaseFilters, type CaseFiltersValues } from "./case-filters";
import { CaseCard } from "./case-card";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeDate } from "@/lib/formatters/date";
import type { Case } from "@/types/case";
import { LayoutGrid, Table2, FileSpreadsheet, Archive } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_FILTERS: CaseFiltersValues = {
  search: "",
  status: "all",
  caseType: "all",
};

export function CaseList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deleteCase = useDeleteCase();
  const updateCase = useUpdateCase();
  const [filters, setFilters] = useState<CaseFiltersValues>(() => ({
    ...DEFAULT_FILTERS,
    status: searchParams.get("status") ?? DEFAULT_FILTERS.status,
  }));
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [page, setPage] = useState(1);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const statusToPipeline = (status: string) => {
    if (status === "draft") return "draft";
    if (status === "analysis" || status === "discovery") return "active";
    if (status === "review") return "proposal_sent";
    if (status === "presented") return "follow_up";
    if (status === "closed") return "closed";
    return "draft";
  };
  const pipelineToStatus = (pipeline: string) => {
    if (pipeline === "draft") return "draft";
    if (pipeline === "active") return "analysis";
    if (pipeline === "proposal_sent") return "review";
    if (pipeline === "follow_up") return "presented";
    if (pipeline === "closed") return "closed";
    return "draft";
  };
  const handlePipelineUpdate = async (caseItem: Case, pipeline: string) => {
    try {
      const mappedStatus = pipelineToStatus(pipeline);
      await updateCase.mutateAsync({ id: caseItem.id, data: { status: mappedStatus } });
      toast.success("Case pipeline updated.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to update case status.";
      toast.error(message);
    }
  };

  const { data, isLoading, isError } = useCases({
    search: debouncedSearch || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    page,
    pageSize: 12,
  });

  const response = data as
    | { data?: Case[]; page?: number; totalPages?: number; totalCount?: number }
    | undefined;
  const cases = (response?.data ?? (Array.isArray(data) ? data : [])) as Case[];
  const totalPages = response?.totalPages ?? 1;
  const totalCount = response?.totalCount ?? cases.length;

  const filteredCases = useMemo(() => {
    if (filters.caseType === "all") return cases;
    return cases.filter((c) => c.caseType === filters.caseType);
  }, [cases, filters.caseType]);

  const columns = [
    {
      key: "clientName",
      header: "Client",
      cell: (item: Case) => (
        <div>
          <p className="font-medium">{item.clientName}</p>
          <p className="text-muted-foreground text-xs">
            {item.caseNumber} • {item.caseType.charAt(0).toUpperCase() + item.caseType.slice(1)}
          </p>
          <p className="text-muted-foreground text-xs">
            {item.clientPhone ? `📞 ${item.clientPhone}` : "📞 —"}
            {"  "}•{"  "}
            {item.meetingDate
              ? `Last meeting ${new Date(item.meetingDate).toLocaleDateString()}`
              : "No meeting date"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (item: Case) => (
        <div className="space-y-1">
          <StatusBadge status={item.status} />
          <Select
            value={statusToPipeline(item.status)}
            onValueChange={(v) => handlePipelineUpdate(item, v)}
            disabled={updateCase.isPending}
          >
            <SelectTrigger
              className="h-7 w-[130px] text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
              <SelectItem value="follow_up">Follow-Up</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ),
      className: "w-32",
    },
    {
      key: "updatedAt",
      header: "Updated",
      cell: (item: Case) => (
        <span className="text-muted-foreground text-sm">
          {formatRelativeDate(item.updatedAt)}
        </span>
      ),
      className: "w-28",
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item: Case) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCase(item);
            setArchiveDialogOpen(true);
          }}
          disabled={deleteCase.isPending}
        >
          <Archive className="size-3.5" />
          Archive
        </Button>
      ),
      className: "w-28",
    },
  ];

  const openArchiveDialog = useCallback((caseItem: Case) => {
    setSelectedCase(caseItem);
    setArchiveDialogOpen(true);
  }, []);

  const handleArchive = useCallback(async () => {
    if (!selectedCase?.id) return;
    try {
      const archived = await deleteCase.mutateAsync(selectedCase.id);
      toast.success(archived.message || "Case archived successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to archive case";
      toast.error(message);
      throw err;
    }
  }, [deleteCase, selectedCase]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CaseFilters values={filters} onChange={setFilters} />
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
          >
            <Table2 className="size-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        )
      ) : isError ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Unable to load cases"
          description="Something went wrong. Please try again later."
        />
      ) : filteredCases.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No cases found"
          description="Create your first case to get started."
          action={
            <Button asChild>
              <Link href="/cases/new">New Case</Link>
            </Button>
          }
        />
      ) : viewMode === "grid" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCases.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                case={{
                  ...caseItem,
                  description: caseItem.description,
                }}
                onArchive={(item) => openArchiveDialog(item as Case)}
                isArchiving={deleteCase.isPending}
                pipelineStatus={statusToPipeline(caseItem.status)}
                onPipelineChange={(v) => handlePipelineUpdate(caseItem, v)}
                isStatusUpdating={updateCase.isPending}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <Card className="overflow-hidden">
            <DataTable
              columns={columns}
              data={filteredCases}
              onRowClick={(item) => router.push(`/cases/${item.id}`)}
            />
          </Card>
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground text-sm">
                Showing page {page} of {totalPages} ({totalCount} total)
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive this case?"
        description={
          selectedCase
            ? `This will archive case ${selectedCase.caseNumber}. The data will be retained for compliance.`
            : "This will archive the selected case."
        }
        onConfirm={handleArchive}
        confirmText="Archive Case"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
