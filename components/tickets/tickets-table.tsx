"use client"

import * as React from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Frame, FrameFooter } from "@/components/ui/frame"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
import { cn } from "@/lib/utils"

export type ClientTicketRow = {
  id: number
  title: string
  clientName?: string | null
  ticketType: string
  status: string | null
  priority: string | null
  createdAt: string | null
}

type CursorPagination = {
  mode: "cursor"
  pageIndex: number
  pageSize: number
  hasNextPage: boolean
  onNextPage: () => void
  onPreviousPage: () => void
}

const DEFAULT_PAGE_SIZE = 20

function formatLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value

  return trimmed
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusDot(status: string | null) {
  const value = (status ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("resolved") || value.includes("closed")) return "bg-emerald-500"
  if (value.includes("progress")) return "bg-amber-500"
  if (value.includes("hold") || value.includes("blocked")) return "bg-blue-500"
  if (value.includes("cancel")) return "bg-rose-500"
  return "bg-muted-foreground/50"
}

function getPriorityDot(priority: string | null) {
  const value = (priority ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("urgent")) return "bg-rose-500"
  if (value.includes("high")) return "bg-amber-500"
  if (value.includes("medium")) return "bg-blue-500"
  if (value.includes("low")) return "bg-emerald-500"
  return "bg-muted-foreground/50"
}

const columns: ColumnDef<ClientTicketRow>[] = [
  {
    id: "select",
    size: 28,
    enableSorting: false,
    header: ({ table }) => {
      const isAllSelected = table.getIsAllPageRowsSelected()
      const isSomeSelected = table.getIsSomePageRowsSelected()

      return (
        <Checkbox
          aria-label="Select all rows"
          checked={isAllSelected}
          indeterminate={isSomeSelected && !isAllSelected}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      )
    },
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    accessorKey: "id",
    header: "ID",
    size: 80,
    cell: ({ row }) => (
      <div className="font-mono text-xs text-muted-foreground">#{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 320,
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "clientName",
    header: "Client",
    size: 180,
    cell: ({ row }) => {
      const value = row.getValue("clientName") as string | null | undefined
      return value ? (
        <div className="font-medium">{value}</div>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    accessorKey: "ticketType",
    header: "Type",
    size: 160,
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("ticketType")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 150,
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null
      const label = status ? formatLabel(status) : "—"

      return (
        <Badge variant="outline">
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", getStatusDot(status))} />
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    size: 140,
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string | null
      const label = priority ? formatLabel(priority) : "—"

      return (
        <Badge variant="outline">
          <span
            aria-hidden="true"
            className={cn("size-1.5 rounded-full", getPriorityDot(priority))}
          />
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 200,
    sortingFn: (a, b) => {
      const aMs = a.original.createdAt ? Date.parse(a.original.createdAt) : 0
      const bMs = b.original.createdAt ? Date.parse(b.original.createdAt) : 0
      return aMs - bMs
    },
    cell: ({ row }) => {
      const raw = row.getValue("createdAt") as string | null
      if (!raw) return <span className="text-muted-foreground">—</span>

      return <div className="text-muted-foreground tabular-nums">{new Date(raw).toLocaleString()}</div>
    },
  },
]

export function TicketsTable({
  tickets,
  showClient = false,
  pagination,
  totalCount,
  isLoading = false,
  defaultSort = "createdAtDesc",
  activeTicketId,
  onActiveTicketIdChange,
  onOpenTicket,
}: {
  tickets: ClientTicketRow[]
  showClient?: boolean
  pagination?: CursorPagination
  totalCount?: number | null
  isLoading?: boolean
  defaultSort?: "createdAtDesc" | "none"
  activeTicketId?: number | null
  onActiveTicketIdChange?: (ticketId: number | null) => void
  onOpenTicket?: (ticketId: number) => void
}) {
  const [internalActiveTicketId, setInternalActiveTicketId] = React.useState<number | null>(null)
  const resolvedActiveTicketId =
    typeof activeTicketId === "number" ? activeTicketId : internalActiveTicketId

  const setActiveTicketId = React.useCallback(
    (ticketId: number | null) => {
      if (onActiveTicketIdChange) {
        onActiveTicketIdChange(ticketId)
        return
      }
      setInternalActiveTicketId(ticketId)
    },
    [onActiveTicketIdChange],
  )

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [sorting, setSorting] = React.useState<SortingState>(() =>
    defaultSort === "none" ? [] : [{ id: "createdAt", desc: true }],
  )

  React.useEffect(() => {
    setSorting(defaultSort === "none" ? [] : [{ id: "createdAt", desc: true }])
  }, [defaultSort])

  const pageSize =
    pagination?.mode === "cursor" ? pagination.pageSize : DEFAULT_PAGE_SIZE
  const enableClientPaging = pagination?.mode !== "cursor"

  const [clientPagination, setClientPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  })

  React.useEffect(() => {
    if (!enableClientPaging) return
    setClientPagination({ pageIndex: 0, pageSize })
  }, [enableClientPaging, pageSize])

  const tableColumns = React.useMemo(() => {
    if (showClient) return columns

    return columns.filter((col) => {
      const id =
        "id" in col && typeof col.id === "string"
          ? col.id
          : "accessorKey" in col
            ? (col.accessorKey as string | undefined)
            : undefined
      return id !== "clientName"
    })
  }, [showClient])

  const table = useReactTable({
    data: tickets,
    columns: tableColumns,
    enableSortingRemoval: false,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      rowSelection,
      sorting,
      ...(enableClientPaging ? { pagination: clientPagination } : {}),
    },
    ...(enableClientPaging
      ? {
          getPaginationRowModel: getPaginationRowModel(),
          onPaginationChange: setClientPagination,
        }
      : {}),
  })

  const total = table.getRowCount()
  const pageIndex =
    pagination?.mode === "cursor" ? pagination.pageIndex : table.getState().pagination.pageIndex

  const pageCount = enableClientPaging ? table.getPageCount() : null
  const rangeStart = total ? pageIndex * pageSize + 1 : 0
  const rangeEnd = total ? pageIndex * pageSize + tickets.length : 0

  const pageRanges = React.useMemo(() => {
    if (!enableClientPaging || pageCount == null) return []
    if (total === 0) return [{ label: "0-0", value: "1" }]

    return Array.from({ length: pageCount }, (_, i) => {
      const rangeStart = i * pageSize + 1
      const rangeEnd = Math.min((i + 1) * pageSize, total)
      const pageNum = i + 1
      return { label: `${rangeStart}-${rangeEnd}`, value: String(pageNum) }
    })
  }, [enableClientPaging, pageCount, pageSize, total])

  const visibleTicketIdsKey = table
    .getRowModel()
    .rows.map((row) => row.original.id)
    .join("|")

  React.useEffect(() => {
    const visibleTicketIds = table.getRowModel().rows.map((row) => row.original.id)
    if (visibleTicketIds.length === 0) {
      setActiveTicketId(null)
      return
    }

    if (
      typeof resolvedActiveTicketId === "number" &&
      visibleTicketIds.includes(resolvedActiveTicketId)
    ) {
      return
    }

    setActiveTicketId(visibleTicketIds[0] ?? null)
  }, [resolvedActiveTicketId, setActiveTicketId, table, visibleTicketIdsKey])

  React.useEffect(() => {
    if (!onOpenTicket) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === "enter") {
        if (typeof resolvedActiveTicketId !== "number") return
        event.preventDefault()
        onOpenTicket(resolvedActiveTicketId)
        return
      }

      if (key !== "j" && key !== "k") return
      const visibleTicketIds = table.getRowModel().rows.map((row) => row.original.id)
      if (visibleTicketIds.length === 0) return

      event.preventDefault()

      const currentIndex =
        typeof resolvedActiveTicketId === "number"
          ? visibleTicketIds.indexOf(resolvedActiveTicketId)
          : -1
      const baseIndex = currentIndex >= 0 ? currentIndex : 0

      const nextIndex =
        key === "j"
          ? Math.min(visibleTicketIds.length - 1, baseIndex + 1)
          : Math.max(0, baseIndex - 1)

      const nextId = visibleTicketIds[nextIndex]
      if (typeof nextId !== "number") return
      setActiveTicketId(nextId)

      const row = document.querySelector(`[data-ticket-row-id="${nextId}"]`)
      if (row instanceof HTMLElement) {
        row.scrollIntoView({ block: "nearest" })
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenTicket, resolvedActiveTicketId, setActiveTicketId, table, visibleTicketIdsKey])

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
              <TableCell
                className="h-24 text-center text-muted-foreground"
                colSpan={tableColumns.length}
              >
                Loading tickets…
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const ticketId = row.original.id
              const isActive =
                typeof resolvedActiveTicketId === "number" && resolvedActiveTicketId === ticketId

              return (
              <TableRow
                data-state={row.getIsSelected() || isActive ? "selected" : undefined}
                data-ticket-row-id={ticketId}
                key={row.id}
                className={cn(onOpenTicket ? "cursor-pointer" : "")}
                onClick={(event) => {
                  if (!onOpenTicket) return
                  const target = event.target
                  if (!(target instanceof Element)) return
                  if (target.closest("[role=checkbox], [data-slot=checkbox]")) return

                  event.preventDefault()
                  setActiveTicketId(ticketId)
                  onOpenTicket(ticketId)
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={tableColumns.length}>
                No tickets found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <FrameFooter className="p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {enableClientPaging ? (
              <>
                <p className="text-muted-foreground text-sm">Viewing</p>
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
                <p className="text-muted-foreground text-sm">
                  of <strong className="font-medium text-foreground">{total}</strong> results
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                Showing{" "}
                <strong className="font-medium text-foreground">
                  {rangeStart}-{rangeEnd}
                </strong>
                {pagination?.mode === "cursor" ? (
                  <>
                    {" "}
                    of{" "}
                    <strong className="font-medium text-foreground">
                      {typeof totalCount === "number" ? totalCount : "…"}
                    </strong>
                  </>
                ) : null}
              </p>
            )}
          </div>

          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={enableClientPaging ? !table.getCanPreviousPage() : pageIndex <= 0}
                      onClick={() => {
                        if (enableClientPaging) {
                          table.previousPage()
                          return
                        }
                        pagination?.onPreviousPage()
                      }}
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
                      disabled={
                        enableClientPaging
                          ? !table.getCanNextPage()
                          : !(pagination?.mode === "cursor" && pagination.hasNextPage)
                      }
                      onClick={() => {
                        if (enableClientPaging) {
                          table.nextPage()
                          return
                        }
                        pagination?.onNextPage()
                      }}
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
