"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { DatePickerSegment } from "@/components/dashboard/date-picker-segment"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
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
  department: string | null
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

function renderSingleSelectValue({
  value,
  placeholder,
  labelByValue,
}: {
  value: unknown
  placeholder: string
  labelByValue: Map<string, string>
}) {
  if (!isString(value) || !value.trim()) {
    return <span className="text-muted-foreground/72">{placeholder}</span>
  }

  return labelByValue.get(value) ?? value
}

export function TicketsFilterRow({
  userType,
  from,
  to,
  search,
  department,
  departmentOptions,
  statusValues,
  priorityValues,
  ticketTypeValues,
  assignedToValues,
  ticketTypes,
  teamMembers,
  onFromChange,
  onToChange,
  onSearchChange,
  onDepartmentChange,
  onStatusChange,
  onPriorityChange,
  onTicketTypeChange,
  onAssignedToChange,
  onReset,
}: {
  userType: "internal" | "client"
  from: string
  to: string
  search: string
  department: string
  departmentOptions: readonly string[]
  statusValues: string[]
  priorityValues: string[]
  ticketTypeValues: string[]
  assignedToValues: string[]
  ticketTypes: readonly TicketTypeRow[]
  teamMembers: readonly TeamMemberRow[]
  onFromChange: (next: string) => void
  onToChange: (next: string) => void
  onSearchChange: (next: string) => void
  onDepartmentChange: (next: string | null) => void
  onStatusChange: (next: string[]) => void
  onPriorityChange: (next: string[]) => void
  onTicketTypeChange: (next: string[]) => void
  onAssignedToChange: (next: string[]) => void
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

  const departmentLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    map.set("all", "All depts")
    for (const dept of departmentOptions) {
      const trimmed = dept.trim()
      if (!trimmed) continue
      map.set(dept, formatTeamMemberLabel(trimmed))
    }
    return map
  }, [departmentOptions])

  const statusLabelByValue = React.useMemo(() => {
    const map = new Map<string, string>()
    map.set("open", "Open")
    map.set("in_progress", "In progress")
    map.set("resolved", "Resolved")
    map.set("closed", "Closed")
    map.set("blocked", "Blocked")
    return map
  }, [])

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
      <div className="divide-y divide-border">
        <div className="grid grid-cols-2 md:grid-cols-[minmax(0,3fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.8fr)] divide-x divide-y divide-border md:divide-y-0">
          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
            <InputGroup className="h-full rounded-none border-0 bg-transparent shadow-none">
              <InputGroupAddon align="inline-start" className="pl-3 pr-0">
                <InputGroupText className="text-muted-foreground/72">
                  <MagnifyingGlassIcon className="size-3.5" aria-hidden="true" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search tickets"
                size="lg"
                unstyled
                value={search}
                placeholder="Search title or #ID…"
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="flex h-10 items-stretch">
            <DatePickerSegment
              id="tickets-from"
              prefix="From"
              value={from}
              onValueChange={onFromChange}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <DatePickerSegment id="tickets-to" prefix="To" value={to} onValueChange={onToChange} />
          </div>

          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
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

        <div
          className={`grid grid-cols-2 divide-x divide-y divide-border md:divide-y-0 ${
            userType === "internal" ? "md:grid-cols-5" : "md:grid-cols-3"
          }`}
        >
          {userType === "internal" ? (
            <div className="flex h-10 items-stretch">
              <Select value={department} onValueChange={onDepartmentChange}>
                <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
                  <SelectValue>
                    {(value: unknown) =>
                      renderSingleSelectValue({
                        value,
                        placeholder: "Department…",
                        labelByValue: departmentLabelByValue,
                      })
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectItem value="all">All depts</SelectItem>
                    {departmentOptions.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {formatTeamMemberLabel(dept)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="flex h-10 items-stretch">
            <Select multiple value={statusValues} onValueChange={onStatusChange}>
              <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
                <SelectValue>
                  {(value: unknown) =>
                    renderMultiSelectValue({
                      value,
                      placeholder: "Status…",
                      labelByValue: statusLabelByValue,
                    })
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
                      placeholder: "Priority…",
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

          {userType === "internal" ? (
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
          ) : null}
        </div>
      </div>
    </CardGroup>
  )
}
