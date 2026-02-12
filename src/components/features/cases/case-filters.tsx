"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { CaseStatus } from "@/types/case";

export interface CaseFiltersValues {
  search: string;
  status: string;
  caseType: string;
}

export interface CaseFiltersProps {
  values: CaseFiltersValues;
  onChange: (values: CaseFiltersValues) => void;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...Object.values(CaseStatus).map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

const CASE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "individual", label: "Individual" },
  { value: "couple", label: "Couple" },
  { value: "family", label: "Family" },
];

export function CaseFilters({ values, onChange }: CaseFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by client name..."
          value={values.search}
          onChange={(e) =>
            onChange({ ...values, search: e.target.value })
          }
          className="pl-9"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2 sm:w-40">
          <Label htmlFor="status-filter" className="sr-only">
            Status
          </Label>
          <Select
            value={values.status}
            onValueChange={(v) => onChange({ ...values, status: v })}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:w-40">
          <Label htmlFor="type-filter" className="sr-only">
            Case Type
          </Label>
          <Select
            value={values.caseType}
            onValueChange={(v) => onChange({ ...values, caseType: v })}
          >
            <SelectTrigger id="type-filter">
              <SelectValue placeholder="Case Type" />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
