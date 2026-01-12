import { expect, type Page } from "@playwright/test"

type ZeroTransformOk = [
  "transformed",
  Array<
    | { id: string; name: string; ast: unknown }
    | { error: "app" | "parse"; id: string; name: string; message?: string }
  >,
]

export type ZeroAst = {
  table: string
  where?: unknown
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function assertZeroAst(value: unknown): asserts value is ZeroAst {
  if (!isObject(value) || typeof value.table !== "string") {
    throw new Error("Expected Zero AST")
  }
}

export function hasSimpleColumnEquals(where: unknown, column: string, value: number): boolean {
  if (!isObject(where)) return false
  const type = where.type
  if (type === "simple") {
    if (where.op !== "=") return false
    const left = where.left
    const right = where.right
    if (!isObject(left) || left.type !== "column" || left.name !== column) return false
    if (!isObject(right) || right.type !== "literal" || right.value !== value) return false
    return true
  }

  if (type === "and" || type === "or") {
    const conditions = where.conditions
    if (!Array.isArray(conditions)) return false
    return conditions.some((cond) => hasSimpleColumnEquals(cond, column, value))
  }

  if (type === "correlatedSubquery") {
    const related = where.related
    if (!isObject(related)) return false
    const subquery = related.subquery
    if (!isObject(subquery)) return false
    return hasSimpleColumnEquals(subquery.where, column, value)
  }

  return false
}

export function hasCorrelatedSubquery(
  where: unknown,
  table: string,
  column: string,
  value: number,
): boolean {
  if (!isObject(where)) return false
  const type = where.type
  if (type === "correlatedSubquery") {
    const related = where.related
    if (!isObject(related)) return false
    const subquery = related.subquery
    if (!isObject(subquery) || subquery.table !== table) return false
    return hasSimpleColumnEquals(subquery.where, column, value)
  }

  if (type === "and" || type === "or") {
    const conditions = where.conditions
    if (!Array.isArray(conditions)) return false
    return conditions.some((cond) => hasCorrelatedSubquery(cond, table, column, value))
  }

  return false
}

export async function fetchQueryAst(
  page: Page,
  name: string,
  args: Record<string, unknown>,
): Promise<ZeroAst> {
  const res = await page.request.post("/api/zero/query", {
    data: [
      "transform",
      [
        {
          id: "q1",
          name,
          args: [args],
        },
      ],
    ],
  })
  expect(res.ok()).toBeTruthy()

  const json: unknown = await res.json()
  if (!Array.isArray(json) || json[0] !== "transformed") {
    throw new Error("Unexpected Zero transform response")
  }

  const ok = json as ZeroTransformOk
  const first = ok[1][0]

  if (isObject(first) && "error" in first) {
    throw new Error(
      `Zero query error for ${name}: ${String(first.error)} ${String(first.message ?? "")}`,
    )
  }

  if (!isObject(first) || !("ast" in first)) {
    throw new Error("Missing AST in transform response")
  }

  const ast = first.ast
  assertZeroAst(ast)
  return ast
}

