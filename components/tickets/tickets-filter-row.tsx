"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { DatePickerSegment } from "@/components/dashboard/date-picker-segment"
import { Button } from "@/components/ui/button"
import { CardGroup } from "@/components/ui/card"
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxValue,
} from "@/components/ui/combobox"
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
    const items: ComboboxOption[] = [{ value: "any", label: "Any" }, { value: "none", label: "Unassigned" }]
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

  const clientComboboxItems = React.useMemo<ComboboxOption[]>(() => {
    const items: ComboboxOption[] = [{ value: "any", label: "Any" }]
    for (const client of clients) {
      items.push({ value: String(client.id), label: client.clientName })
    }
    return items
  }, [clients])

  const clientItemByValue = React.useMemo(() => {
    const map = new Map<string, ComboboxOption>()
    for (const item of clientComboboxItems) {
      map.set(item.value, item)
    }
    return map
  }, [clientComboboxItems])

  const clientSelectedItems = React.useMemo(
    () =>
      clientValues
        .map((value) => clientItemByValue.get(value))
        .filter((value): value is ComboboxOption => Boolean(value)),
    [clientItemByValue, clientValues],
  )

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

          {userType === "internal" ? (
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
          ) : null}

          {showClientFilter ? (
            <div className="flex h-10 items-stretch">
              <Combobox
                items={clientComboboxItems}
                multiple
                value={clientSelectedItems}
                onValueChange={(next) => onClientChange(next.map((item) => item.value))}
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
                          aria-label="Filter by client"
                          placeholder={value.length > 0 ? undefined : "Clients…"}
                          className="placeholder:text-muted-foreground/72"
                        />
                      </>
                    )}
                  </ComboboxValue>
                </ComboboxChips>
                <ComboboxPopup>
                  <ComboboxEmpty>No clients found.</ComboboxEmpty>
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
          ) : null}
        </div>
      </div>
    </CardGroup>
  )
}
