"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { DatePickerSegment } from "@/components/filters/date-picker-segment"
import { MultiSelectCombobox } from "@/components/filters/multi-select-combobox"
import { MultiSelectDropdown } from "@/components/filters/multi-select-dropdown"
import { priorityOptions } from "@/lib/filters/priority-options"
import type { FilterOption } from "@/lib/filters/types"
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

type ClientRow = {
  id: number
  clientName: string
}

const statusOptions = [
  { value: "any", label: "Any" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] satisfies readonly FilterOption[]

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
  internalRole,
  from,
  to,
  search,
  department,
  departmentOptions,
  clientValues,
  statusValues,
  priorityValues,
  ticketTypeValues,
  assignedToValues,
  ticketTypes,
  teamMembers,
  clients,
  onFromChange,
  onToChange,
  onSearchChange,
  onDepartmentChange,
  onClientChange,
  onStatusChange,
  onPriorityChange,
  onTicketTypeChange,
  onAssignedToChange,
  onReset,
}: {
  userType: "internal" | "client"
  internalRole: "support_agent" | "manager" | "admin" | null
  from: string
  to: string
  search: string
  department: string
  departmentOptions: readonly string[]
  clientValues: string[]
  statusValues: string[]
  priorityValues: string[]
  ticketTypeValues: string[]
  assignedToValues: string[]
  ticketTypes: readonly TicketTypeRow[]
  teamMembers: readonly TeamMemberRow[]
  clients: readonly ClientRow[]
  onFromChange: (next: string) => void
  onToChange: (next: string) => void
  onSearchChange: (next: string) => void
  onDepartmentChange: (next: string | null) => void
  onClientChange: (next: string[]) => void
  onStatusChange: (next: string[]) => void
  onPriorityChange: (next: string[]) => void
  onTicketTypeChange: (next: string[]) => void
  onAssignedToChange: (next: string[]) => void
  onReset: () => void
}) {
  const showClientFilter =
    userType === "internal" && (internalRole === "manager" || internalRole === "admin")

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

  const clientItems = React.useMemo<FilterOption[]>(() => {
    const items: FilterOption[] = [{ value: "any", label: "Any" }]
    for (const client of clients) {
      items.push({ value: String(client.id), label: client.clientName })
    }
    return items
  }, [clients])

  return (
    <CardGroup className="rounded-none border-x-0 [&_[data-corner]]:hidden">
      <div className="divide-y divide-border">
        <div
          className={`grid grid-cols-2 divide-x divide-y divide-border md:divide-y-0 ${
            userType === "internal"
              ? "md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.8fr)]"
              : "md:grid-cols-[minmax(0,3fr)_minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,0.8fr)]"
          }`}
        >
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
            userType === "client"
              ? "md:grid-cols-3"
              : showClientFilter
                ? "md:grid-cols-5"
                : "md:grid-cols-4"
          }`}
        >
          <div className="flex h-10 items-stretch">
            <MultiSelectDropdown
              options={statusOptions}
              values={statusValues}
              onValuesChange={onStatusChange}
              placeholder="Status…"
              ariaLabel="Filter by status"
            />
          </div>

          <div className="flex h-10 items-stretch">
            <MultiSelectDropdown
              options={priorityOptions}
              values={priorityValues}
              onValuesChange={onPriorityChange}
              placeholder="Priority…"
              ariaLabel="Filter by priority"
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

          {userType === "internal" ? (
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
          ) : null}

          {showClientFilter ? (
            <div className="flex h-10 items-stretch">
              <MultiSelectCombobox
                items={clientItems}
                values={clientValues}
                onValuesChange={onClientChange}
                placeholder="Clients…"
                ariaLabel="Filter by client"
                emptyText="No clients found."
              />
            </div>
          ) : null}
        </div>
      </div>
    </CardGroup>
  )
}
