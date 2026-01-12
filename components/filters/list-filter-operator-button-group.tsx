"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Group, GroupSeparator } from "@/components/ui/group"
import {
  type ListFilterOperator,
  listFilterOperatorLabel,
  listFilterOperatorOptions,
} from "@/lib/filters/list-filter"
import { cn } from "@/lib/utils"

const buttonLabelByOperator: Record<ListFilterOperator, string> = {
  is: "is",
  is_not: "is not",
  is_any_of: "any of",
  is_none_of: "none of",
}

export function ListFilterOperatorButtonGroup({
  value,
  onValueChange,
  ariaLabel,
  className,
}: {
  value: ListFilterOperator
  onValueChange: (next: ListFilterOperator) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <Group aria-label={ariaLabel} className={cn("w-full", className)}>
      {listFilterOperatorOptions.map((option, idx) => (
        <React.Fragment key={option.value}>
          <Button
            variant="outline"
            size="xs"
            className="flex-1 justify-center px-1.5 text-[0.6875rem] data-[pressed]:bg-accent data-[pressed]:text-accent-foreground"
            aria-label={listFilterOperatorLabel[option.value]}
            aria-pressed={value === option.value}
            data-pressed={value === option.value ? "" : undefined}
            title={listFilterOperatorLabel[option.value]}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onValueChange(option.value)}
          >
            {buttonLabelByOperator[option.value]}
          </Button>
          {idx < listFilterOperatorOptions.length - 1 ? <GroupSeparator /> : null}
        </React.Fragment>
      ))}
    </Group>
  )
}

