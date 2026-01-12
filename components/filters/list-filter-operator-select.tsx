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
import {
  isListFilterOperator,
  type ListFilterOperator,
  listFilterOperatorLabel,
  listFilterOperatorOptions,
} from "@/lib/filters/list-filter"
import { cn } from "@/lib/utils"

export function ListFilterOperatorSelect({
  value,
  onValueChange,
  ariaLabel,
  triggerClassName,
}: {
  value: ListFilterOperator
  onValueChange: (next: ListFilterOperator) => void
  ariaLabel: string
  triggerClassName?: string
}) {
  return (
    <Select
      aria-label={ariaLabel}
      value={value}
      onValueChange={(next) => {
        if (!isListFilterOperator(next)) return
        onValueChange(next)
      }}
    >
      <SelectTrigger
        size="lg"
        className={cn(
          "h-full w-[5.5rem] shrink-0 rounded-none border-0 border-r bg-transparent px-2",
          triggerClassName,
        )}
      >
        <SelectValue>
          {(current: unknown) =>
            isListFilterOperator(current)
              ? listFilterOperatorLabel[current]
              : listFilterOperatorLabel[value]
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start">
        <SelectGroup>
          {listFilterOperatorOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

