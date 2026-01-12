export const listFilterOperatorValues = ["is", "is_not", "is_any_of", "is_none_of"] as const

export type ListFilterOperator = (typeof listFilterOperatorValues)[number]

export type ListFilterState = {
  op: ListFilterOperator
  values: string[]
}

export const defaultListFilterOperator: ListFilterOperator = "is_any_of"

export const listFilterOperatorOptions = [
  { value: "is", label: "is" },
  { value: "is_not", label: "is not" },
  { value: "is_any_of", label: "is any of" },
  { value: "is_none_of", label: "is none of" },
] as const satisfies ReadonlyArray<{ value: ListFilterOperator; label: string }>

export const listFilterOperatorLabel: Record<ListFilterOperator, string> = {
  is: "is",
  is_not: "is not",
  is_any_of: "is any of",
  is_none_of: "is none of",
}

export function isListFilterOperator(value: unknown): value is ListFilterOperator {
  return (
    typeof value === "string" &&
    (listFilterOperatorValues as readonly string[]).includes(value)
  )
}

export function parseListFilterOperator(value: unknown): ListFilterOperator {
  return isListFilterOperator(value) ? value : defaultListFilterOperator
}

export function isSingleValueListFilterOperator(op: ListFilterOperator) {
  return op === "is" || op === "is_not"
}

export function normalizeListFilterValues(op: ListFilterOperator, values: readonly string[]) {
  const trimmed = values.map((value) => value.trim()).filter(Boolean)

  if (isSingleValueListFilterOperator(op)) {
    const last = trimmed[trimmed.length - 1]
    return last ? [last] : []
  }

  const unique: string[] = []
  const seen = new Set<string>()
  for (const value of trimmed) {
    if (seen.has(value)) continue
    seen.add(value)
    unique.push(value)
  }

  return unique
}

export function normalizeListFilterState(state: ListFilterState): ListFilterState {
  return {
    op: state.op,
    values: normalizeListFilterValues(state.op, state.values),
  }
}

