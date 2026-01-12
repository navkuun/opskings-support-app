"use client"

import * as React from "react"

import { ListFilterOperatorButtonGroup } from "@/components/filters/list-filter-operator-button-group"
import { Badge } from "@/components/ui/badge"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox"
import type { ListFilterOperator } from "@/lib/filters/list-filter"
import type { FilterOption } from "@/lib/filters/types"
import { cn } from "@/lib/utils"

export function MultiSelectCombobox({
  items,
  values,
  onValuesChange,
  operator,
  onOperatorChange,
  operatorAriaLabel,
  placeholder,
  ariaLabel,
  emptyText,
  className,
}: {
  items: readonly FilterOption[]
  values: readonly string[]
  onValuesChange: (next: string[]) => void
  operator?: ListFilterOperator
  onOperatorChange?: (next: ListFilterOperator) => void
  operatorAriaLabel?: string
  placeholder: string
  ariaLabel: string
  emptyText: string
  className?: string
}) {
  const itemByValue = React.useMemo(() => {
    const map = new Map<string, FilterOption>()
    for (const item of items) {
      map.set(item.value, item)
    }
    return map
  }, [items])

  const selectedItems = React.useMemo(
    () =>
      values
        .map((value) => itemByValue.get(value))
        .filter((value): value is FilterOption => Boolean(value)),
    [itemByValue, values],
  )

  const showOperatorControls = Boolean(operator && onOperatorChange)
  const isExcludeOperator = operator === "is_not" || operator === "is_none_of"

  return (
    <Combobox
      items={items}
      multiple
      value={selectedItems}
      onValueChange={(next) => onValuesChange(next.map((item) => item.value))}
    >
      <ComboboxChips
        startAddon={
          showOperatorControls && isExcludeOperator ? (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Not
            </Badge>
          ) : undefined
        }
        className={cn(
          "no-scrollbar h-full w-full flex-nowrap overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 py-0 shadow-none before:hidden focus-within:border-0 focus-within:ring-0 [&_[data-slot=combobox-chip]]:max-w-full [&_[data-slot=combobox-chip]]:shrink-0",
          className,
        )}
      >
        <ComboboxValue>
          {(value: FilterOption[]) => (
            <>
              {value.map((item) => (
                <ComboboxChip aria-label={item.label} key={item.value}>
                  <span className="truncate">{item.label}</span>
                </ComboboxChip>
              ))}
              <ComboboxInput
                aria-label={ariaLabel}
                placeholder={value.length > 0 ? undefined : placeholder}
                className="text-xs placeholder:text-muted-foreground/72"
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxPopup>
        {showOperatorControls && operator && onOperatorChange ? (
          <div className="sticky top-0 z-10 border-b bg-popover/95 p-1 backdrop-blur-sm">
            <ListFilterOperatorButtonGroup
              value={operator}
              onValueChange={onOperatorChange}
              ariaLabel={operatorAriaLabel ?? `${ariaLabel} operator`}
            />
          </div>
        ) : null}
        <ComboboxEmpty>{emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
