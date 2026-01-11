"use client"

import * as React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FilterOption } from "@/lib/filters/types"

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function renderValue({
  value,
  placeholder,
  labelByValue,
}: {
  value: unknown
  placeholder: string
  labelByValue: Map<string, string>
}) {
  if (!isUnknownArray(value)) {
    return <span className="text-muted-foreground/72">{placeholder}</span>
  }

  const values = value.filter(isString)
  if (values.length === 0) {
    return <span className="text-muted-foreground/72">{placeholder}</span>
  }

  const firstValue = values[0]
  const firstLabel = firstValue ? labelByValue.get(firstValue) ?? firstValue : ""
  const additional = values.length > 1 ? ` (+${values.length - 1} more)` : ""

  return `${firstLabel}${additional}`
}

export function MultiSelectDropdown({
  options,
  values,
  onValuesChange,
  placeholder,
  ariaLabel,
}: {
  options: readonly FilterOption[]
  values: string[]
  onValuesChange: (next: string[]) => void
  placeholder: string
  ariaLabel: string
}) {
  const labelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const option of options) {
      map.set(option.value, option.label)
    }
    return map
  }, [options])

  return (
    <Select aria-label={ariaLabel} multiple value={values} onValueChange={onValuesChange}>
      <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
        <SelectValue>
          {(value: unknown) =>
            renderValue({
              value,
              placeholder,
              labelByValue,
            })
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
