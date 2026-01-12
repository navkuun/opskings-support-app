"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Frame, FrameFooter } from "@/components/ui/frame"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatHours, formatRating, formatTeamMemberLabel } from "@/lib/dashboard/utils"
import type { TeamPerformanceRow } from "@/lib/team-performance/types"
import { cn } from "@/lib/utils"

const DEFAULT_PAGE_SIZE = 20

function formatStatusLabel(status: string | null) {
  const value = (status ?? "").trim()
  if (!value) return "—"
  return formatTeamMemberLabel(value)
}

function getStatusBadgeVariant(status: string | null) {
  const value = (status ?? "").toLowerCase()
  if (value.includes("active")) return "outline"
  if (value.includes("inactive") || value.includes("disabled")) return "destructive"
  return "secondary"
}

const columns: ColumnDef<TeamPerformanceRow>[] = [
  {
    accessorKey: "username",
    header: "Team Member",
    size: 220,
    cell: ({ row }) => (
      <div className="font-medium">{formatTeamMemberLabel(row.original.username)}</div>
    ),
  },
  {
    accessorKey: "ticketsAssigned",
    header: "Tickets Assigned",
    size: 150,
    cell: ({ row }) => (
      <div className="font-mono tabular-nums">{row.original.ticketsAssigned}</div>
    ),
  },
  {
    accessorKey: "ticketsResolved",
    header: "Tickets Resolved",
    size: 150,
    cell: ({ row }) => (
      <div className="font-mono tabular-nums">{row.original.ticketsResolved}</div>
    ),
  },
  {
    accessorKey: "avgResolutionHours",
    header: "Avg Resolution Time",
    size: 170,
    sortingFn: (a, b) => (a.original.avgResolutionHours ?? Infinity) - (b.original.avgResolutionHours ?? Infinity),
    cell: ({ row }) => (
      <div className="font-mono tabular-nums text-muted-foreground">
        {row.original.avgResolutionHours == null ? "—" : formatHours(row.original.avgResolutionHours)}
      </div>
    ),
  },
  {
    accessorKey: "avgRating",
    header: "Avg Rating",
    size: 110,
    sortingFn: (a, b) => (a.original.avgRating ?? -Infinity) - (b.original.avgRating ?? -Infinity),
    cell: ({ row }) => (
      <div className="font-mono tabular-nums text-muted-foreground">
        {row.original.avgRating == null ? "—" : formatRating(row.original.avgRating)}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({ row }) => (
      <Badge variant={getStatusBadgeVariant(row.original.status)}>
        {formatStatusLabel(row.original.status)}
      </Badge>
    ),
  },
]

export function TeamsTable({
  rows,
  isLoading,
}: {
  rows: TeamPerformanceRow[]
  isLoading?: boolean
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "ticketsResolved", desc: true },
  ])

  const [clientPagination, setClientPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })

  React.useEffect(() => {
    setClientPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [rows])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns closures by design.
  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      pagination: clientPagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setClientPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const total = rows.length
  const rangeStart = total ? pageIndex * pageSize + 1 : 0
  const rangeEnd = total ? Math.min(total, (pageIndex + 1) * pageSize) : 0

  const pageRanges = React.useMemo(() => {
    const pages = Math.max(1, Math.ceil(total / pageSize))
    const ranges: Array<{ value: string; label: string }> = []
    for (let i = 0; i < pages; i += 1) {
      const start = total ? i * pageSize + 1 : 0
      const end = total ? Math.min(total, (i + 1) * pageSize) : 0
      ranges.push({ value: String(i + 1), label: `${start}-${end}` })
    }
    return ranges
  }, [pageSize, total])

  return (
    <Frame className="w-full">
      <Table className="table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const columnSize = header.column.getSize()
                const canSort = header.column.getCanSort()
                const sort = header.column.getIsSorted()

                return (
                  <TableHead
                    key={header.id}
                    style={columnSize ? { width: `${columnSize}px` } : undefined}
                    className={cn(canSort ? "cursor-pointer select-none" : "")}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    onKeyDown={(e) => {
                      if (!canSort) return
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        header.column.getToggleSortingHandler()?.(e)
                      }
                    }}
                    role={canSort ? "button" : undefined}
                    tabIndex={canSort ? 0 : undefined}
                  >
                    <div className={cn("flex items-center justify-between gap-2", canSort ? "h-full" : "")}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort
                        ? {
                            asc: (
                              <ChevronUpIcon aria-hidden="true" className="size-4 shrink-0 opacity-80" />
                            ),
                            desc: (
                              <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 opacity-80" />
                            ),
                          }[(sort as string) ?? ""] ?? null
                        : null}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {isLoading && table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
                Loading team performance…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={columns.length}>
                No team members found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <FrameFooter className="p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <p className="text-muted-foreground text-sm">
              Showing{" "}
              <strong className="font-medium text-foreground">
                {rangeStart}-{rangeEnd}
              </strong>{" "}
              of <strong className="font-medium text-foreground">{total}</strong>
            </p>
            <Select
              items={pageRanges}
              value={String(pageIndex + 1)}
              onValueChange={(value) => {
                const page = Number(value)
                if (!Number.isFinite(page) || page < 1) return
                table.setPageIndex(page - 1)
              }}
            >
              <SelectTrigger aria-label="Select result range" className="w-fit" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {pageRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                      size="sm"
                      variant="outline"
                    />
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </FrameFooter>
    </Frame>
  )
}
