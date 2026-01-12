"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ClientAnalysisFilterRow } from "@/components/clients/client-analysis-filter-row"
import { ClientAnalysisTable } from "@/components/clients/client-analysis-table"
import type { ClientAnalysisRow } from "@/lib/clients/analysis"
import { parseClientAnalysisResponse } from "@/lib/clients/analysis"
import { isRecord, isString } from "@/lib/type-guards"
import type { NumericFilterOp, NumericFilterState } from "@/lib/team-performance/filters"

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

function parsePage(value: string | null) {
  if (!value) return 1
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return 1
  return parsed
}

function parseNumericOp(value: string | null): NumericFilterOp {
  if (
    value === "any" ||
    value === "eq" ||
    value === "gt" ||
    value === "gte" ||
    value === "lt" ||
    value === "lte" ||
    value === "between" ||
    value === "is_empty" ||
    value === "is_not_empty"
  ) {
    return value
  }
  return "any"
}

export function ClientAnalysisPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get("q") ?? ""
  const plan = searchParams.get("plan") ?? "any"
  const page = parsePage(searchParams.get("page"))
  const pageSize = 20

  const totalSpentFilter = React.useMemo<NumericFilterState>(
    () => ({
      op: parseNumericOp(searchParams.get("spentOp")),
      a: searchParams.get("spentA") ?? "",
      b: searchParams.get("spentB") ?? "",
    }),
    [searchParams],
  )

  const [draftQuery, setDraftQuery] = React.useState(q)
  const [planOptions, setPlanOptions] = React.useState<readonly string[]>([])

  React.useEffect(() => {
    setDraftQuery(q)
  }, [q])

  React.useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function run() {
      try {
        const res = await fetch("/api/clients/options", {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) return
        const json: unknown = await res.json()
        if (!isRecord(json) || !Array.isArray(json.planTypes)) return
        const values: string[] = []
        for (const item of json.planTypes) {
          if (typeof item !== "string") return
          const trimmed = item.trim()
          if (!trimmed) continue
          values.push(trimmed)
        }
        if (cancelled) return
        setPlanOptions(Array.from(new Set(values)).sort((a, b) => a.localeCompare(b)))
      } catch {
        // Ignore; filters still work with manual values.
      }
    }

    void run()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  React.useEffect(() => {
    const trimmed = draftQuery.trim()
    const current = q.trim()
    if (trimmed === current) return

    const timeout = window.setTimeout(() => {
      updateSearchParams(router, searchParams, {
        q: trimmed ? trimmed : null,
        page: "1",
      })
    }, 250)

    return () => window.clearTimeout(timeout)
  }, [draftQuery, q, router, searchParams])

  const [rows, setRows] = React.useState<readonly ClientAnalysisRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (q.trim()) params.set("q", q.trim())
      if (plan.trim() && plan !== "any") params.set("plan", plan.trim())
      if (totalSpentFilter.op !== "any") params.set("spentOp", totalSpentFilter.op)
      if (totalSpentFilter.a.trim()) params.set("spentA", totalSpentFilter.a.trim())
      if (totalSpentFilter.b.trim()) params.set("spentB", totalSpentFilter.b.trim())
      params.set("page", String(page))
      params.set("pageSize", String(pageSize))

      try {
        const res = await fetch(`/api/clients/analysis?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        })

        if (!res.ok) {
          const body: unknown = await res.json().catch(() => null)
          const message =
            isRecord(body) && isString(body.error) && body.error.trim() ? body.error : null
          setRows([])
          setTotal(0)
          setError(message ?? `Request failed (${res.status})`)
          setLoading(false)
          return
        }

        const json: unknown = await res.json()
        const parsed = parseClientAnalysisResponse(json)
        if (!parsed) {
          setRows([])
          setTotal(0)
          setError("Unexpected response from client analysis.")
          setLoading(false)
          return
        }

        setRows(parsed.rows)
        setTotal(parsed.total)
        setLoading(false)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error("[clients] Failed to load analysis", err)
        setRows([])
        setTotal(0)
        setError("Failed to load client analysis.")
        setLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [page, pageSize, plan, q, totalSpentFilter.a, totalSpentFilter.b, totalSpentFilter.op])

  const handleReset = React.useCallback(() => {
    setDraftQuery("")
    updateSearchParams(router, searchParams, {
      q: null,
      plan: null,
      spentOp: null,
      spentA: null,
      spentB: null,
      page: null,
    })
  }, [router, searchParams])

  const handlePlanChange = React.useCallback(
    (next: string) => {
      const trimmed = next.trim()
      updateSearchParams(router, searchParams, {
        plan: trimmed && trimmed !== "any" ? trimmed : null,
        page: "1",
      })
    },
    [router, searchParams],
  )

  const handleTotalSpentChange = React.useCallback(
    (patch: Partial<Pick<NumericFilterState, "op" | "a" | "b">>) => {
      const nextOp = patch.op ?? totalSpentFilter.op
      const nextA = patch.a ?? totalSpentFilter.a
      const nextB = patch.b ?? totalSpentFilter.b
      updateSearchParams(router, searchParams, {
        spentOp: nextOp === "any" ? null : nextOp,
        spentA: nextA.trim() ? nextA : null,
        spentB: nextB.trim() ? nextB : null,
        page: "1",
      })
    },
    [router, searchParams, totalSpentFilter.a, totalSpentFilter.b, totalSpentFilter.op],
  )

  const handlePageIndexChange = React.useCallback(
    (nextIndex: number) => {
      updateSearchParams(router, searchParams, { page: String(nextIndex + 1) })
    },
    [router, searchParams],
  )

  return (
    <div className="w-full pb-8">
      <ClientAnalysisFilterRow
        query={draftQuery}
        plan={plan}
        planOptions={planOptions}
        totalSpent={totalSpentFilter}
        onQueryChange={setDraftQuery}
        onPlanChange={handlePlanChange}
        onTotalSpentChange={handleTotalSpentChange}
        onReset={handleReset}
      />
      <div className="space-y-6 px-6 pt-6">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <ClientAnalysisTable
          rows={rows}
          totalCount={total}
          pageIndex={Math.max(0, page - 1)}
          pageSize={pageSize}
          onPageIndexChange={handlePageIndexChange}
          isLoading={loading}
        />
      </div>
    </div>
  )
}
