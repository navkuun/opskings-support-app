"use client"

import * as React from "react"

import { DatePickerSegment } from "@/components/filters/date-picker-segment"
import { MultiSelectCombobox } from "@/components/filters/multi-select-combobox"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
import { formatTeamMemberLabel } from "@/lib/dashboard/utils"
import {
  normalizeListFilterValues,
  type ListFilterState,
} from "@/lib/filters/list-filter"
import { priorityOptions } from "@/lib/filters/priority-options"
import type { FilterOption } from "@/lib/filters/types"

type TeamMemberRow = {
  id: number
  username: string
}

type TicketTypeRow = {
  id: number
  typeName: string
}

type ClientRow = {
  id: number
  clientName: string
}

export function ResponseTimeFilterRow({
  from,
  to,
  assignedToFilter,
  clientFilter,
  ticketTypeFilter,
  priorityFilter,
  teamMembers,
  clients,
  ticketTypes,
  onFromChange,
  onToChange,
  onAssignedToChange,
  onClientChange,
  onTicketTypeChange,
  onPriorityChange,
  onReset,
}: {
  from: string
  to: string
  assignedToFilter: ListFilterState
  clientFilter: ListFilterState
  ticketTypeFilter: ListFilterState
  priorityFilter: ListFilterState
  teamMembers: readonly TeamMemberRow[]
  clients: readonly ClientRow[]
  ticketTypes: readonly TicketTypeRow[]
  onFromChange: (next: string) => void
  onToChange: (next: string) => void
  onAssignedToChange: (next: ListFilterState) => void
  onClientChange: (next: ListFilterState) => void
  onTicketTypeChange: (next: ListFilterState) => void
  onPriorityChange: (next: ListFilterState) => void
  onReset: () => void
}) {
  const assigneeItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = [{ value: "none", label: "Unassigned" }]
    for (const tm of teamMembers) {
      items.push({ value: String(tm.id), label: formatTeamMemberLabel(tm.username) })
    }
    return items
  }, [teamMembers])

  const clientItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = []
    for (const client of clients) {
      items.push({ value: String(client.id), label: client.clientName })
    }
    return items
  }, [clients])

  const ticketTypeItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = []
    for (const tt of ticketTypes) {
      items.push({ value: String(tt.id), label: tt.typeName })
    }
    return items
  }, [ticketTypes])

  return (
    <CardGroup className="rounded-none border-x-0 border-t-0 [&_[data-corner]]:hidden">
      <div className="divide-y divide-border">
        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          <div className="flex h-10 items-stretch">
            <DatePickerSegment
              id="response-time-from"
              prefix="From"
              value={from}
              onValueChange={onFromChange}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <DatePickerSegment
              id="response-time-to"
              prefix="To"
              value={to}
              onValueChange={onToChange}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <MultiSelectCombobox
              items={assigneeItems}
              values={assignedToFilter.values}
              onValuesChange={(values) =>
                onAssignedToChange({
                  op: assignedToFilter.op,
                  values: normalizeListFilterValues(assignedToFilter.op, values),
                })
              }
              operator={assignedToFilter.op}
              onOperatorChange={(op) =>
                onAssignedToChange({
                  op,
                  values: normalizeListFilterValues(op, assignedToFilter.values),
                })
              }
              operatorAriaLabel="Team member filter operator"
              placeholder="Assignees…"
              ariaLabel="Filter by assignee"
              emptyText="No assignees found."
            />
          </div>

          <div className="flex h-10 items-stretch">
            <Button
              variant="ghost"
              size="lg"
              className="!h-full !sm:h-full w-full rounded-none border-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40"
              onClick={onReset}
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-3 md:divide-y-0">
          <div className="flex h-10 items-stretch">
            <MultiSelectCombobox
              items={clientItems}
              values={clientFilter.values}
              onValuesChange={(values) =>
                onClientChange({
                  op: clientFilter.op,
                  values: normalizeListFilterValues(clientFilter.op, values),
                })
              }
              operator={clientFilter.op}
              onOperatorChange={(op) =>
                onClientChange({
                  op,
                  values: normalizeListFilterValues(op, clientFilter.values),
                })
              }
              operatorAriaLabel="Clients filter operator"
              placeholder="Clients…"
              ariaLabel="Filter by client"
              emptyText="No clients found."
            />
          </div>

          <div className="flex h-10 items-stretch">
            <MultiSelectCombobox
              items={ticketTypeItems}
              values={ticketTypeFilter.values}
              onValuesChange={(values) =>
                onTicketTypeChange({
                  op: ticketTypeFilter.op,
                  values: normalizeListFilterValues(ticketTypeFilter.op, values),
                })
              }
              operator={ticketTypeFilter.op}
              onOperatorChange={(op) =>
                onTicketTypeChange({
                  op,
                  values: normalizeListFilterValues(op, ticketTypeFilter.values),
                })
              }
              operatorAriaLabel="Ticket type filter operator"
              placeholder="Ticket types…"
              ariaLabel="Filter by ticket type"
              emptyText="No ticket types found."
            />
          </div>

          <div className="flex h-10 items-stretch">
            <MultiSelectCombobox
              items={priorityOptions}
              values={priorityFilter.values}
              onValuesChange={(values) =>
                onPriorityChange({
                  op: priorityFilter.op,
                  values: normalizeListFilterValues(priorityFilter.op, values),
                })
              }
              operator={priorityFilter.op}
              onOperatorChange={(op) =>
                onPriorityChange({
                  op,
                  values: normalizeListFilterValues(op, priorityFilter.values),
                })
              }
              operatorAriaLabel="Priority filter operator"
              placeholder="Priorities…"
              ariaLabel="Filter by priority"
              emptyText="No priorities found."
            />
          </div>
        </div>
      </div>
    </CardGroup>
  )
}
