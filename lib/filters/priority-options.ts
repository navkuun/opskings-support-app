import type { FilterOption } from "@/lib/filters/types"

export const priorityOptions: readonly FilterOption[] = [
  { value: "any", label: "Any" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

