"use client"

import * as React from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  className?: string
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (item: T, index: number) => void
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data found",
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.key}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No data"
        description={emptyMessage}
      />
    )
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.key} className={col.className}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow
            key={item.id ?? index}
            className={cn(onRowClick && "cursor-pointer")}
            onClick={onRowClick ? () => onRowClick(item, index) : undefined}
          >
            {columns.map((col) => (
              <TableCell key={col.key} className={col.className}>
                {col.cell(item)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}
