"use client"

import * as React from "react"

import { DatePickerSegment } from "@/components/filters/date-picker-segment"
import { MultiSelectCombobox } from "@/components/filters/multi-select-combobox"
import { MultiSelectDropdown } from "@/components/filters/multi-select-dropdown"
import { priorityOptions } from "@/lib/filters/priority-options"
import type { FilterOption } from "@/lib/filters/types"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
import { formatTeamMemberLabel } from "@/lib/dashboard/utils"

type TeamMemberRow = {
  id: number
  username: string
}

type TicketTypeRow = {
  id: number
  typeName: string
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
  const ticketTypeItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = [{ value: "any", label: "Any" }]
    for (const tt of ticketTypes) {
      items.push({ value: String(tt.id), label: tt.typeName })
    }
    return items
  }, [ticketTypes])

  const assigneeItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = [
      { value: "any", label: "Any" },
      { value: "none", label: "Unassigned" },
    ]
    for (const tm of teamMembers) {
      items.push({ value: String(tm.id), label: formatTeamMemberLabel(tm.username) })
    }
    return items
  }, [teamMembers])

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
          <MultiSelectCombobox
            items={assigneeItems}
            values={assignedToValues}
            onValuesChange={onAssignedToChange}
            placeholder="Assignees…"
            ariaLabel="Filter by assignee"
            emptyText="No assignees found."
          />
        </div>

        <div className="flex h-10 items-stretch">
          <MultiSelectCombobox
            items={ticketTypeItems}
            values={ticketTypeValues}
            onValuesChange={onTicketTypeChange}
            placeholder="Ticket types…"
            ariaLabel="Filter by ticket type"
            emptyText="No ticket types found."
          />
        </div>

        <div className="flex h-10 items-stretch">
          <MultiSelectDropdown
            options={priorityOptions}
            values={priorityValues}
            onValuesChange={onPriorityChange}
            placeholder="Priorities…"
            ariaLabel="Filter by priority"
          />
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
