"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Frame, FrameFooter, FrameHeader, FrameTitle } from "@/components/ui/frame"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ResponseTimeOverdueTicketRow } from "@/lib/response-time/metrics"
import { cn } from "@/lib/utils"

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

function getPriorityDot(priority: string | null) {
  const value = (priority ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("urgent")) return "bg-rose-500"
  if (value.includes("high")) return "bg-amber-500"
  if (value.includes("medium")) return "bg-blue-500"
  if (value.includes("low")) return "bg-emerald-500"
  return "bg-muted-foreground/50"
}

function formatHours(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(1)}h`
}

function formatDelta(value: number) {
  if (!Number.isFinite(value)) return "—"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  return `${sign}${Math.abs(value).toFixed(1)}h`
}

export function OverdueTicketsTable({
  tickets,
  totalCount,
  pageIndex,
  pageSize,
  onPageIndexChange,
  isLoading,
}: {
  tickets: readonly ResponseTimeOverdueTicketRow[]
  totalCount?: number
  pageIndex?: number
  pageSize?: number
  onPageIndexChange?: (next: number) => void
  isLoading?: boolean
}) {
  const router = useRouter()

  const isControlledPaging =
    typeof totalCount === "number" &&
    typeof pageIndex === "number" &&
    typeof pageSize === "number" &&
    typeof onPageIndexChange === "function"

  const internalPageSize = DEFAULT_PAGE_SIZE
  const internalTotal = tickets.length
  const [internalPageIndex, setInternalPageIndex] = React.useState(0)

  React.useEffect(() => {
    if (isControlledPaging) return
    setInternalPageIndex(0)
  }, [isControlledPaging, tickets])

  const effectivePageSize = isControlledPaging ? pageSize : internalPageSize
  const effectiveTotal = isControlledPaging ? totalCount : internalTotal
  const maxPageIndex = Math.max(0, Math.ceil(effectiveTotal / effectivePageSize) - 1)
  const effectivePageIndex = isControlledPaging ? pageIndex : internalPageIndex
  const clampedPageIndex = Math.min(effectivePageIndex, maxPageIndex)

  React.useEffect(() => {
    if (clampedPageIndex !== effectivePageIndex) {
      if (isControlledPaging) {
        onPageIndexChange(clampedPageIndex)
      } else {
        setInternalPageIndex(clampedPageIndex)
      }
    }
  }, [clampedPageIndex, effectivePageIndex, isControlledPaging, onPageIndexChange])

  const startIndex = clampedPageIndex * effectivePageSize
  const endIndexExclusive = Math.min(effectiveTotal, startIndex + effectivePageSize)
  const pageTickets = React.useMemo(() => {
    if (isControlledPaging) return tickets
    return tickets.slice(startIndex, endIndexExclusive)
  }, [endIndexExclusive, isControlledPaging, startIndex, tickets])

  return (
    <Frame className="w-full">
      <FrameHeader className="pb-2">
        <FrameTitle>Overdue tickets</FrameTitle>
        <div className="text-muted-foreground text-xs">
          Resolved tickets where actual resolution hours exceeded the expected hours for the ticket type.
        </div>
      </FrameHeader>

      <div className="overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px]">ID</TableHead>
              <TableHead className="w-[320px]">Title</TableHead>
              <TableHead className="w-[180px]">Client</TableHead>
              <TableHead className="w-[160px]">Type</TableHead>
              <TableHead className="w-[140px]">Priority</TableHead>
              <TableHead className="w-[200px]">Created</TableHead>
              <TableHead className="w-[110px] text-right">Expected</TableHead>
              <TableHead className="w-[110px] text-right">Actual</TableHead>
              <TableHead className="w-[110px] text-right">Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && effectiveTotal === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={9}>
                  Loading overdue tickets…
                </TableCell>
              </TableRow>
            ) : pageTickets.length ? (
              pageTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
                >
                  <TableCell>
                    <div className="font-mono text-xs text-muted-foreground">#{ticket.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="truncate font-medium">{ticket.title}</div>
                  </TableCell>
                  <TableCell>
                    {ticket.clientName ? (
                      <div className="font-medium">{ticket.clientName}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="truncate text-muted-foreground">{ticket.ticketType}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <span
                        aria-hidden="true"
                        className={cn("size-1.5 rounded-full", getPriorityDot(ticket.priority))}
                      />
                      {ticket.priority ? formatLabel(ticket.priority) : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.createdAt ? (
                      <div className="text-muted-foreground tabular-nums">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatHours(ticket.expectedHours)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatHours(ticket.actualHours)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {formatDelta(ticket.deltaHours)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={9}>
                  No overdue tickets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FrameFooter className="p-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-muted-foreground text-xs">
            Showing{" "}
            <span className="font-mono tabular-nums">
              {effectiveTotal ? startIndex + 1 : 0}-{endIndexExclusive}
            </span>{" "}
            of <span className="font-mono tabular-nums">{effectiveTotal.toLocaleString()}</span>
          </div>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={clampedPageIndex <= 0}
                      onClick={() => {
                        const next = Math.max(0, clampedPageIndex - 1)
                        if (isControlledPaging) onPageIndexChange(next)
                        else setInternalPageIndex(next)
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
                      disabled={clampedPageIndex >= maxPageIndex}
                      onClick={() => {
                        const next = Math.min(maxPageIndex, clampedPageIndex + 1)
                        if (isControlledPaging) onPageIndexChange(next)
                        else setInternalPageIndex(next)
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
