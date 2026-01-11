"use client"

import * as React from "react"

import { DatePickerSegment } from "@/components/dashboard/date-picker-segment"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
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
  const teamMemberLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    map.set("none", "Unassigned")
    for (const tm of teamMembers) {
      map.set(String(tm.id), formatTeamMemberLabel(tm.username))
    }
    return map
  }, [teamMembers])

  const ticketTypeLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const tt of ticketTypes) {
      map.set(String(tt.id), tt.typeName)
    }
    return map
  }, [ticketTypes])

  const priorityLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    map.set("low", "Low")
    map.set("medium", "Medium")
    map.set("high", "High")
    map.set("urgent", "Urgent")
    return map
  }, [])

  return (
    <CardGroup className="rounded-none border-x-0 [&_[data-corner]]:hidden">
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
          <Select multiple value={assignedToValues} onValueChange={onAssignedToChange}>
            <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
              <SelectValue>
                {(value: unknown) =>
                  renderMultiSelectValue({
                    value,
                    placeholder: "Assignees…",
                    labelByValue: teamMemberLabelByValue,
                  })
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="none">Unassigned</SelectItem>
                {teamMembers.map((tm) => (
                  <SelectItem key={tm.id} value={String(tm.id)}>
                    {formatTeamMemberLabel(tm.username)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex h-10 items-stretch">
          <Select multiple value={ticketTypeValues} onValueChange={onTicketTypeChange}>
            <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
              <SelectValue>
                {(value: unknown) =>
                  renderMultiSelectValue({
                    value,
                    placeholder: "Ticket types…",
                    labelByValue: ticketTypeLabelByValue,
                  })
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="any">Any</SelectItem>
                {ticketTypes.map((tt) => (
                  <SelectItem key={tt.id} value={String(tt.id)}>
                    {tt.typeName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
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
            className="h-full w-full rounded-none border-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted/40"
            onClick={onReset}
          >
            Reset
          </Button>
        </div>
      </div>
    </CardGroup>
  )
}
