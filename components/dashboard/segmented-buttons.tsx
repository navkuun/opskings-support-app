"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

export function SegmentedButtons<T extends string>({
  value,
  onValueChange,
  items,
  ariaLabel,
}: {
  value: T
  onValueChange: (next: T) => void
  items: Array<{ value: T; label: string }>
  ariaLabel: string
}) {
  return (
    <div
      className="inline-flex rounded-lg border bg-muted/40 p-0.5"
      role="group"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <Button
          key={item.value}
          size="xs"
          variant={item.value === value ? "secondary" : "ghost"}
          className="h-6 px-2 text-xs"
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

