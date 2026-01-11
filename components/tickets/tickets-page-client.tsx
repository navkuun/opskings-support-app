"use client"

import * as React from "react"
import { useQuery } from "@rocicorp/zero/react"
import { useRouter, useSearchParams } from "next/navigation"

import { TicketsFilterRow } from "@/components/tickets/tickets-filter-row"
import { TicketsTable, type ClientTicketRow } from "@/components/tickets/tickets-table"
import { parseDateToUtcMs } from "@/lib/dashboard/utils"
import { fuzzySearch } from "@/lib/search/fuzzy-search"
import { isRecord, isString } from "@/lib/type-guards"
import { queries } from "@/zero/queries"

const PAGE_SIZE = 20
const SEARCH_LIMIT = 200

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedValue(value), delayMs)
    return () => window.clearTimeout(handle)
  }, [delayMs, value])

  return debouncedValue
}

function updateSearchParams(
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  patch: Record<string, string | null>,
) {
  const next = new URLSearchParams(searchParams.toString())
  for (const [key, value] of Object.entries(patch)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  router.replace(`?${next.toString()}`)
}

function parseMultiParam(value: string | null) {
  if (!value) return []
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => token !== "any")

  const unique: string[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    if (seen.has(token)) continue
    seen.add(token)
    unique.push(token)
  }

  return unique
}

function parseNumberTokens(tokens: string[]) {
  const ids: number[] = []
  for (const token of tokens) {
    const parsed = Number(token)
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) continue
    ids.push(parsed)
  }
  return ids
}

function uniqueStrings(values: readonly string[]) {
  const next: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    next.push(trimmed)
  }
  return next
}

type TicketCursor = {
  id: number
  createdAt: number | null
}

export function TicketsPageClient({
  userType,
  teamMemberId,
}: {
  userType: "internal" | "client"
  teamMemberId: number | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""
  const deptParam = searchParams.get("dept")
  const statusParam = searchParams.get("status")
  const priorityParam = searchParams.get("priority")
  const ticketTypeParam = searchParams.get("ticketTypeId")
  const assignedToParam = searchParams.get("assignedTo")
  const searchParam = searchParams.get("q") ?? ""

  const [searchInput, setSearchInput] = React.useState(searchParam)
  const debouncedSearchInput = useDebouncedValue(searchInput, 250)

  React.useEffect(() => {
    setSearchInput(searchParam)
  }, [searchParam])

  const statusValues = React.useMemo(() => parseMultiParam(statusParam), [statusParam])
  const priorityValues = React.useMemo(() => parseMultiParam(priorityParam), [priorityParam])
  const ticketTypeValues = React.useMemo(() => parseMultiParam(ticketTypeParam), [ticketTypeParam])
  const assignedToValues = React.useMemo(() => parseMultiParam(assignedToParam), [assignedToParam])

  const [ticketTypes, ticketTypesResult] = useQuery(queries.ticketTypes.list({ limit: 200 }))
  const [teamMembers, teamMembersResult] = useQuery(
    queries.teamMembers.internalList({ limit: 200 }),
  )

  const defaultDepartment = React.useMemo(() => {
    if (userType !== "internal" || !teamMemberId) return null
    const match = teamMembers.find((tm) => tm.id === teamMemberId) ?? null
    return match?.department?.trim() ? match.department : null
  }, [teamMemberId, teamMembers, userType])

  const department = React.useMemo(() => {
    if (userType !== "internal") return "all"
    if (deptParam === "all") return "all"
    if (deptParam && deptParam.trim()) return deptParam
    return defaultDepartment ?? "all"
  }, [defaultDepartment, deptParam, userType])

  const departmentOptions = React.useMemo(() => {
    const values = ticketTypes
      .map((tt) => tt.department)
      .filter(isString)
      .map((value) => value.trim())
      .filter(Boolean)
    return uniqueStrings(values)
  }, [ticketTypes])

  const createdFrom = React.useMemo(() => {
    if (!from.trim()) return undefined
    const ms = parseDateToUtcMs(from, "start")
    return ms ?? undefined
  }, [from])

  const createdTo = React.useMemo(() => {
    if (!to.trim()) return undefined
    const ms = parseDateToUtcMs(to, "end")
    return ms ?? undefined
  }, [to])

  const assignedToIds = React.useMemo(() => {
    const filtered = assignedToValues.filter((v) => v !== "none" && v !== "any")
    return parseNumberTokens(filtered)
  }, [assignedToValues])

  const includeUnassigned = React.useMemo(() => assignedToValues.includes("none"), [assignedToValues])

  const ticketTypeIds = React.useMemo(() => parseNumberTokens(ticketTypeValues), [ticketTypeValues])

  const trimmedSearch = searchInput.trim()
  const isSearchMode = trimmedSearch.length > 0

  React.useEffect(() => {
    const trimmed = debouncedSearchInput.trim()
    const next = trimmed ? trimmed : null
    const current = searchParams.get("q") ?? ""
    if (current === (next ?? "")) return
    updateSearchParams(router, searchParams, { q: next })
  }, [debouncedSearchInput, router, searchParams])

  const cursorKey = React.useMemo(() => {
    return [
      userType,
      from,
      to,
      department,
      statusValues.join("|"),
      priorityValues.join("|"),
      ticketTypeIds.join("|"),
      assignedToIds.join("|"),
      includeUnassigned ? "1" : "0",
      trimmedSearch,
    ].join("::")
  }, [
    assignedToIds,
    department,
    from,
    includeUnassigned,
    priorityValues,
    statusValues,
    ticketTypeIds,
    trimmedSearch,
    to,
    userType,
  ])

  const [pageIndex, setPageIndex] = React.useState(0)
  const [pageCursors, setPageCursors] = React.useState<Array<TicketCursor | null>>([null])

  React.useEffect(() => {
    setPageIndex(0)
    setPageCursors([null])
  }, [cursorKey])

  const cursor = isSearchMode ? null : (pageCursors[pageIndex] ?? null)

  const queryArgs = React.useMemo(() => {
    const statuses = statusValues.filter((value) => value !== "any")
    const priorities = priorityValues.filter((value) => value !== "any")
    const deptValue = userType === "internal" && department !== "all" ? department : undefined

    return {
      limit: isSearchMode ? SEARCH_LIMIT : PAGE_SIZE + 1,
      cursor: cursor ?? undefined,
      from: createdFrom,
      to: createdTo,
      department: deptValue,
      status: statuses.length ? statuses : undefined,
      priority: priorities.length ? priorities : undefined,
      ticketTypeId: ticketTypeIds.length ? ticketTypeIds : undefined,
      assignedTo: assignedToIds.length ? assignedToIds : undefined,
      includeUnassigned: includeUnassigned || undefined,
    }
  }, [
    assignedToIds,
    createdFrom,
    createdTo,
    cursor,
    department,
    includeUnassigned,
    isSearchMode,
    priorityValues,
    statusValues,
    ticketTypeIds,
    userType,
  ])

  const [tickets] = useQuery(queries.tickets.list(queryArgs))
  const hasNextPage = !isSearchMode && tickets.length > PAGE_SIZE
  const pageTickets = React.useMemo(() => tickets.slice(0, PAGE_SIZE), [tickets])

  const showClient = userType === "internal"

  const visibleTickets = React.useMemo(() => {
    if (!isSearchMode) return pageTickets

    return fuzzySearch(trimmedSearch, tickets, (ticket) => {
      const parts: string[] = [`#${ticket.id}`, ticket.title]

      if (isRecord(ticket.ticketType) && isString(ticket.ticketType.typeName)) {
        parts.push(ticket.ticketType.typeName)
      }

      if (
        showClient &&
        "client" in ticket &&
        isRecord(ticket.client) &&
        isString(ticket.client.clientName)
      ) {
        parts.push(ticket.client.clientName)
      }

      return parts.join(" ")
    })
  }, [isSearchMode, pageTickets, showClient, tickets, trimmedSearch])

  const tableTickets = React.useMemo<ClientTicketRow[]>(
    () =>
      visibleTickets.map((ticket) => {
        const ticketTypeLabel = ticket.ticketType?.typeName ?? `Type ${ticket.ticketTypeId}`
        const createdAtIso =
          typeof ticket.createdAt === "number" ? new Date(ticket.createdAt).toISOString() : null
        const clientName =
          showClient &&
          "client" in ticket &&
          isRecord(ticket.client) &&
          isString(ticket.client.clientName)
            ? ticket.client.clientName
            : null

        return {
          id: ticket.id,
          title: ticket.title,
          clientName,
          ticketType: ticketTypeLabel,
          status: ticket.status ?? null,
          priority: ticket.priority ?? null,
          createdAt: createdAtIso,
        }
      }),
    [showClient, visibleTickets],
  )

  const handleFromChange = React.useCallback(
    (next: string) => updateSearchParams(router, searchParams, { from: next }),
    [router, searchParams],
  )

  const handleToChange = React.useCallback(
    (next: string) => updateSearchParams(router, searchParams, { to: next }),
    [router, searchParams],
  )

  const handleSearchChange = React.useCallback(
    (next: string) => setSearchInput(next),
    [],
  )

  const handleDepartmentChange = React.useCallback(
    (next: string | null) => {
      if (userType !== "internal") return
      const trimmed = (next ?? "").trim()
      if (!trimmed) {
        updateSearchParams(router, searchParams, { dept: null })
        return
      }

      if (trimmed === "all") {
        updateSearchParams(router, searchParams, { dept: "all" })
        return
      }

      if (defaultDepartment && trimmed === defaultDepartment) {
        updateSearchParams(router, searchParams, { dept: null })
        return
      }

      updateSearchParams(router, searchParams, { dept: trimmed })
    },
    [defaultDepartment, router, searchParams, userType],
  )

  const handleStatusChange = React.useCallback(
    (next: string[]) => {
      if (next.includes("any")) {
        updateSearchParams(router, searchParams, { status: null })
        return
      }

      const filtered = next.map((value) => value.trim()).filter(Boolean).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, { status: filtered.length ? filtered.join(",") : null })
    },
    [router, searchParams],
  )

  const handlePriorityChange = React.useCallback(
    (next: string[]) => {
      if (next.includes("any")) {
        updateSearchParams(router, searchParams, { priority: null })
        return
      }

      const filtered = next.map((value) => value.trim()).filter(Boolean).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, { priority: filtered.length ? filtered.join(",") : null })
    },
    [router, searchParams],
  )

  const handleTicketTypeChange = React.useCallback(
    (next: string[]) => {
      if (next.includes("any")) {
        updateSearchParams(router, searchParams, { ticketTypeId: null })
        return
      }

      const filtered = next.map((value) => value.trim()).filter(Boolean).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, { ticketTypeId: filtered.length ? filtered.join(",") : null })
    },
    [router, searchParams],
  )

  const handleAssignedToChange = React.useCallback(
    (next: string[]) => {
      if (next.includes("any")) {
        updateSearchParams(router, searchParams, { assignedTo: null })
        return
      }

      const filtered = next.map((value) => value.trim()).filter(Boolean).filter((value) => value !== "any")
      updateSearchParams(router, searchParams, { assignedTo: filtered.length ? filtered.join(",") : null })
    },
    [router, searchParams],
  )

  const handleReset = React.useCallback(() => {
    setSearchInput("")
    updateSearchParams(router, searchParams, {
      from: null,
      to: null,
      dept: null,
      status: null,
      priority: null,
      ticketTypeId: null,
      assignedTo: null,
      q: null,
    })
  }, [router, searchParams])

  const handleNextPage = React.useCallback(() => {
    if (isSearchMode) return
    if (!hasNextPage) return
    const last = pageTickets[pageTickets.length - 1]
    if (!last) return

    const nextCursor: TicketCursor = { id: last.id, createdAt: last.createdAt ?? null }

    setPageCursors((prev) => {
      const base = prev.slice(0, pageIndex + 1)
      base.push(nextCursor)
      return base
    })
    setPageIndex((prev) => prev + 1)
  }, [hasNextPage, isSearchMode, pageIndex, pageTickets])

  const handlePreviousPage = React.useCallback(() => {
    if (isSearchMode) return
    setPageIndex((prev) => (prev <= 0 ? 0 : prev - 1))
  }, [isSearchMode])

  const isLoading =
    ticketTypesResult.type !== "complete" ||
    (userType === "internal" && teamMembersResult.type !== "complete")

  return (
    <div className="w-full pb-8">
      <TicketsFilterRow
        userType={userType}
        from={from}
        to={to}
        search={searchInput}
        department={department}
        departmentOptions={departmentOptions}
        statusValues={statusValues}
        priorityValues={priorityValues}
        ticketTypeValues={ticketTypeValues}
        assignedToValues={assignedToValues}
        ticketTypes={ticketTypes}
        teamMembers={teamMembers}
        onFromChange={handleFromChange}
        onToChange={handleToChange}
        onSearchChange={handleSearchChange}
        onDepartmentChange={handleDepartmentChange}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onTicketTypeChange={handleTicketTypeChange}
        onAssignedToChange={handleAssignedToChange}
        onReset={handleReset}
      />

      <div className="px-6 pt-6">
        <TicketsTable
          tickets={tableTickets}
          showClient={showClient}
          defaultSort={isSearchMode ? "none" : "createdAtDesc"}
          pagination={
            isSearchMode
              ? undefined
              : {
                  mode: "cursor",
                  pageIndex,
                  pageSize: PAGE_SIZE,
                  hasNextPage,
                  onNextPage: handleNextPage,
                  onPreviousPage: handlePreviousPage,
                }
          }
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
