"use client"

import * as React from "react"

import { DatePickerSegment } from "@/components/dashboard/date-picker-segment"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTeamMemberLabel } from "@/lib/dashboard/utils"
import { isString } from "@/lib/type-guards"

type TeamMemberRow = {
  id: number
  username: string
}

type TicketTypeRow = {
  id: number
  typeName: string
}

type ComboboxOption = {
  value: string
  label: string
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

function renderMultiSelectValue({
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

export function DashboardFilterRow({
  from,
  to,
  assignedToValues,
  ticketTypeValues,
  priorityValues,
  teamMembers,
  ticketTypes,
  onFromChange,
  onToChange,
  onAssignedToChange,
  onTicketTypeChange,
  onPriorityChange,
  onReset,
}: {
  from: string
  to: string
  assignedToValues: string[]
  ticketTypeValues: string[]
  priorityValues: string[]
  teamMembers: readonly TeamMemberRow[]
  ticketTypes: readonly TicketTypeRow[]
  onFromChange: (next: string) => void
  onToChange: (next: string) => void
  onAssignedToChange: (next: string[]) => void
  onTicketTypeChange: (next: string[]) => void
  onPriorityChange: (next: string[]) => void
  onReset: () => void
}) {
  const ticketTypeComboboxItems = React.useMemo<ComboboxOption[]>(() => {
    const items: ComboboxOption[] = [{ value: "any", label: "Any" }]
    for (const tt of ticketTypes) {
      items.push({ value: String(tt.id), label: tt.typeName })
    }
    return items
  }, [ticketTypes])

  const ticketTypeItemByValue = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>()
    for (const item of ticketTypeComboboxItems) {
      map.set(item.value, item)
    }
    return map
  }, [ticketTypeComboboxItems])

  const ticketTypeSelectedItems = React.useMemo(
    () =>
      ticketTypeValues
        .map((value) => ticketTypeItemByValue.get(value))
        .filter((value): value is ComboboxOption => Boolean(value)),
    [ticketTypeItemByValue, ticketTypeValues],
  )

  const assigneeComboboxItems = React.useMemo<ComboboxOption[]>(() => {
    const items: ComboboxOption[] = [
      { value: "any", label: "Any" },
      { value: "none", label: "Unassigned" },
    ]
    for (const tm of teamMembers) {
      items.push({ value: String(tm.id), label: formatTeamMemberLabel(tm.username) })
    }
    return items
  }, [teamMembers])

  const assigneeItemByValue = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>()
    for (const item of assigneeComboboxItems) {
      map.set(item.value, item)
    }
    return map
  }, [assigneeComboboxItems])

  const assigneeSelectedItems = React.useMemo(
    () =>
      assignedToValues
        .map((value) => assigneeItemByValue.get(value))
        .filter((value): value is ComboboxOption => Boolean(value)),
    [assignedToValues, assigneeItemByValue],
  )

  const priorityLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    map.set("low", "Low")
    map.set("medium", "Medium")
    map.set("high", "High")
    map.set("urgent", "Urgent")
    return map
  }, [])

  return (
    <CardGroup className="rounded-none border-x-0 border-t-0 [&_[data-corner]]:hidden">
      <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-6 md:divide-y-0">
        <div className="flex h-10 items-stretch">
          <DatePickerSegment
            id="dash-from"
            prefix="From"
            value={from}
            onValueChange={onFromChange}
          />
        </div>

        <div className="flex h-10 items-stretch">
          <DatePickerSegment id="dash-to" prefix="To" value={to} onValueChange={onToChange} />
        </div>

        <div className="flex h-10 items-stretch">
          <Combobox
            items={assigneeComboboxItems}
            multiple
            value={assigneeSelectedItems}
            onValueChange={(next) => onAssignedToChange(next.map((item) => item.value))}
          >
            <ComboboxChips
              className="no-scrollbar h-full w-full flex-nowrap overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 py-0 shadow-none before:hidden focus-within:border-0 focus-within:ring-0 [&_[data-slot=combobox-chip]]:max-w-full [&_[data-slot=combobox-chip]]:shrink-0"
              data-size="lg"
            >
              <ComboboxValue>
                {(value: ComboboxOption[]) => (
                  <>
                    {value.map((item) => (
                      <ComboboxChip aria-label={item.label} key={item.value}>
                        <span className="truncate">{item.label}</span>
                      </ComboboxChip>
                    ))}
                    <ComboboxInput
                      aria-label="Filter by assignee"
                      placeholder={value.length > 0 ? undefined : "Assignees…"}
                      className="placeholder:text-muted-foreground/72"
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxPopup>
              <ComboboxEmpty>No assignees found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboboxOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>

        <div className="flex h-10 items-stretch">
          <Combobox
            items={ticketTypeComboboxItems}
            multiple
            value={ticketTypeSelectedItems}
            onValueChange={(next) => onTicketTypeChange(next.map((item) => item.value))}
          >
            <ComboboxChips
              className="no-scrollbar h-full w-full flex-nowrap overflow-x-auto overflow-y-hidden rounded-none border-0 bg-transparent px-2 py-0 shadow-none before:hidden focus-within:border-0 focus-within:ring-0 [&_[data-slot=combobox-chip]]:max-w-full [&_[data-slot=combobox-chip]]:shrink-0"
              data-size="lg"
            >
              <ComboboxValue>
                {(value: ComboboxOption[]) => (
                  <>
                    {value.map((item) => (
                      <ComboboxChip aria-label={item.label} key={item.value}>
                        <span className="truncate">{item.label}</span>
                      </ComboboxChip>
                    ))}
                    <ComboboxInput
                      aria-label="Filter by ticket type"
                      placeholder={value.length > 0 ? undefined : "Ticket types…"}
                      className="placeholder:text-muted-foreground/72"
                    />
                  </>
                )}
              </ComboboxValue>
            </ComboboxChips>
            <ComboboxPopup>
              <ComboboxEmpty>No ticket types found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ComboboxOption) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxPopup>
          </Combobox>
        </div>

        <div className="flex h-10 items-stretch">
          <Select multiple value={priorityValues} onValueChange={onPriorityChange}>
            <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
              <SelectValue>
                {(value: unknown) =>
                  renderMultiSelectValue({
                    value,
                    placeholder: "Priorities…",
                    labelByValue: priorityLabelByValue,
                  })
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex h-10 items-stretch">
          <Button
            variant="ghost"
            size="lg"
            className="h-full w-full rounded-none border-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40 sm:h-full"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>
    </CardGroup>
  )
}
