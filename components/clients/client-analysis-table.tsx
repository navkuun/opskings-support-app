"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Frame, FrameFooter } from "@/components/ui/frame"
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
import type { ClientAnalysisRow } from "@/lib/clients/analysis"

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function ClientAnalysisTable({
  rows,
  totalCount,
  pageIndex,
  pageSize,
  onPageIndexChange,
  isLoading,
}: {
  rows: readonly ClientAnalysisRow[]
  totalCount: number
  pageIndex: number
  pageSize: number
  onPageIndexChange: (next: number) => void
  isLoading?: boolean
}) {
  const router = useRouter()

  const maxPageIndex = Math.max(0, Math.ceil(totalCount / pageSize) - 1)
  const clampedPageIndex = Math.min(pageIndex, maxPageIndex)

  const startIndex = clampedPageIndex * pageSize
  const endIndexExclusive = Math.min(totalCount, startIndex + pageSize)

  return (
    <Frame className="w-full">
      <div className="overflow-x-auto">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[260px]">Client</TableHead>
              <TableHead className="w-[140px]">Plan</TableHead>
              <TableHead className="w-[140px] text-right">Total tickets</TableHead>
              <TableHead className="w-[140px] text-right">Open tickets</TableHead>
              <TableHead className="w-[160px] text-right">Total spent</TableHead>
              <TableHead className="w-[220px]">Last ticket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && totalCount === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                  Loading clients…
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tickets?clientId=${row.id}`)}
                >
                  <TableCell>
                    <div className="truncate font-medium">{row.clientName}</div>
                  </TableCell>
                  <TableCell>
                    {row.planType ? (
                      <div className="text-muted-foreground">{row.planType}</div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {row.totalTickets.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {row.openTickets.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatUsd(row.totalSpentUsd)}
                  </TableCell>
                  <TableCell>
                    {row.lastTicketAt ? (
                      <div className="text-muted-foreground tabular-nums">
                        {new Date(row.lastTicketAt).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                  No clients found.
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
              {totalCount ? startIndex + 1 : 0}-{endIndexExclusive}
            </span>{" "}
            of <span className="font-mono tabular-nums">{totalCount.toLocaleString()}</span>
          </div>
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  className="sm:*:[svg]:hidden"
                  render={
                    <Button
                      disabled={clampedPageIndex <= 0}
                      onClick={() => onPageIndexChange(Math.max(0, clampedPageIndex - 1))}
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
                      onClick={() => onPageIndexChange(Math.min(maxPageIndex, clampedPageIndex + 1))}
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
