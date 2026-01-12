"use client"

import Link from "next/link"
import * as React from "react"
import {
  ArrowLeftIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  GearIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { Tooltip } from "@base-ui/react/tooltip"

import { DashboardFilterRow } from "@/components/dashboard/dashboard-filter-row"
import { KpiCard } from "@/components/dashboard/kpi"
import { TicketsByPriorityCard } from "@/components/dashboard/tickets-by-priority-card"
import { TicketsByTypeChart } from "@/components/dashboard/tickets-by-type-chart"
import { TicketsOverTimeChart } from "@/components/dashboard/tickets-over-time-chart"
import { TicketsFilterRow } from "@/components/tickets/tickets-filter-row"
import { cn } from "@/lib/utils"
import { defaultListFilterOperator, type ListFilterState } from "@/lib/filters/list-filter"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardGroup, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

type NavItem = {
  id: string
  label: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: "UI patterns",
    items: [
      { id: "ui-patterns-layout", label: "Layout" },
      { id: "ui-patterns-navigation", label: "Navigation" },
      { id: "ui-patterns-forms", label: "Forms" },
      { id: "ui-patterns-charts", label: "Charts" },
    ],
  },
  {
    label: "Fragments",
    items: [
      { id: "fragments-page-headers", label: "Page header" },
      { id: "fragments-filter-bar", label: "Filter row" },
      { id: "fragments-info-tooltip", label: "Info tooltip" },
      { id: "fragments-confirmation-modal", label: "Confirmation modal" },
      { id: "fragments-ticket-row", label: "Ticket row" },
      { id: "fragments-properties-rail", label: "Properties rail" },
    ],
  },
  {
    label: "Atoms",
    items: [
      { id: "atoms-button", label: "Button" },
      { id: "atoms-badge", label: "Badge" },
      { id: "atoms-input", label: "Input" },
      { id: "atoms-input-group", label: "Input group" },
      { id: "atoms-textarea", label: "Textarea" },
      { id: "atoms-label", label: "Label" },
      { id: "atoms-separator", label: "Separator" },
      { id: "atoms-card", label: "Card" },
      { id: "atoms-kbd", label: "Kbd" },
      { id: "atoms-select", label: "Select" },
      { id: "atoms-combobox", label: "Combobox" },
      { id: "atoms-dropdown-menu", label: "Dropdown menu" },
      { id: "atoms-dialog", label: "Dialog" },
      { id: "atoms-alert-dialog", label: "Alert dialog" },
    ],
  },
]

const SAMPLE_TEAM_MEMBERS = [
  { id: 101, username: "john_smith" },
  { id: 102, username: "maya_patel" },
  { id: 103, username: "alex_chen" },
] satisfies Array<{ id: number; username: string }>

const SAMPLE_TICKET_TYPES = [
  { id: 11, typeName: "Billing", department: "finance" },
  { id: 12, typeName: "Bug", department: "technical" },
  { id: 13, typeName: "Access", department: "support" },
  { id: 14, typeName: "Feature request", department: "product" },
] satisfies Array<{ id: number; typeName: string; department: string | null }>

const SAMPLE_CLIENTS = [
  { id: 501, clientName: "TechStart" },
  { id: 502, clientName: "CloudNine" },
  { id: 503, clientName: "Acme Co" },
] satisfies Array<{ id: number; clientName: string }>

const SAMPLE_TICKETS_OVER_TIME = [
  { monthKey: "2025-01", monthLabel: "2025-01", created: 3120, resolved: 2860 },
  { monthKey: "2025-02", monthLabel: "2025-02", created: 2980, resolved: 2740 },
  { monthKey: "2025-03", monthLabel: "2025-03", created: 3350, resolved: 3010 },
  { monthKey: "2025-04", monthLabel: "2025-04", created: 3620, resolved: 3190 },
  { monthKey: "2025-05", monthLabel: "2025-05", created: 3890, resolved: 3440 },
  { monthKey: "2025-06", monthLabel: "2025-06", created: 4100, resolved: 3660 },
  { monthKey: "2025-07", monthLabel: "2025-07", created: 4410, resolved: 3950 },
  { monthKey: "2025-08", monthLabel: "2025-08", created: 4300, resolved: 4080 },
  { monthKey: "2025-09", monthLabel: "2025-09", created: 4520, resolved: 4190 },
  { monthKey: "2025-10", monthLabel: "2025-10", created: 4690, resolved: 4350 },
  { monthKey: "2025-11", monthLabel: "2025-11", created: 4810, resolved: 4470 },
] satisfies Array<{ monthKey: string; monthLabel: string; created: number; resolved: number }>

const SAMPLE_TICKETS_BY_TYPE = [
  { label: "Bug", count: 12540, pct: 31.2 },
  { label: "Billing", count: 10680, pct: 26.6 },
  { label: "Access", count: 7840, pct: 19.5 },
  { label: "Feature request", count: 5120, pct: 12.7 },
  { label: "Other", count: 4020, pct: 10.0 },
] satisfies Array<{ label: string; count: number; pct: number }>

const SAMPLE_TICKETS_TOTAL = 40100

const SAMPLE_TICKETS_BY_PRIORITY = [
  { label: "urgent", count: 1200, pct: 3.0 },
  { label: "high", count: 5200, pct: 13.0 },
  { label: "medium", count: 14200, pct: 35.4 },
  { label: "low", count: 18400, pct: 45.9 },
  { label: "unknown", count: 1100, pct: 2.7 },
] satisfies Array<{ label: string; count: number; pct: number }>

const SAMPLE_TICKETS_BY_PRIORITY_STATUS = [
  { priority: "urgent", status: "open", count: 420 },
  { priority: "urgent", status: "resolved", count: 780 },
  { priority: "high", status: "open", count: 1900 },
  { priority: "high", status: "resolved", count: 3300 },
  { priority: "medium", status: "open", count: 5200 },
  { priority: "medium", status: "resolved", count: 9000 },
  { priority: "low", status: "open", count: 7200 },
  { priority: "low", status: "resolved", count: 11200 },
  { priority: "unknown", status: "open", count: 420 },
  { priority: "unknown", status: "resolved", count: 680 },
] satisfies Array<{ priority: string; status: "open" | "resolved"; count: number }>

function DsSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold uppercase tracking-[0.14em] text-zinc-900 dark:text-zinc-200">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          ) : null}
        </div>
        <a
          href={`#${id}`}
          className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-200"
        >
          Link
        </a>
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-900 dark:bg-black">
        {children}
      </div>
    </section>
  )
}

function DsShowcase({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-950/30">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {title}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
              {hint}
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}

function formatLabel(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value

  return trimmed
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]!.toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusDot(status: string | null | undefined) {
  const value = (status ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("resolved") || value.includes("closed")) return "bg-emerald-500"
  if (value.includes("progress")) return "bg-amber-500"
  if (value.includes("hold") || value.includes("blocked")) return "bg-blue-500"
  if (value.includes("cancel")) return "bg-rose-500"
  return "bg-muted-foreground/50"
}

function getPriorityDot(priority: string | null | undefined) {
  const value = (priority ?? "").toLowerCase()
  if (!value) return "bg-muted-foreground/50"
  if (value.includes("urgent")) return "bg-rose-500"
  if (value.includes("high")) return "bg-amber-500"
  if (value.includes("medium")) return "bg-blue-500"
  if (value.includes("low")) return "bg-emerald-500"
  return "bg-muted-foreground/50"
}

function TicketRow({
  active,
  striped,
  id,
  title,
  client,
  ticketType,
  status,
  priority,
  assignee,
  createdAt,
}: {
  active?: boolean
  striped?: boolean
  id: number
  title: string
  client?: string | null
  ticketType: string
  status: string | null
  priority: string | null
  assignee?: string | null
  createdAt: string
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full cursor-pointer p-3 text-left transition-none",
        "border border-border bg-card text-foreground",
        active
          ? "bg-muted/40"
          : cn(
              "hover:bg-muted/30",
              striped && "bg-muted/20",
            ),
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">#{id}</span>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">{createdAt}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge variant="outline" className="h-6 px-2.5 text-xs">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", getStatusDot(status))}
            />
            {status ? formatLabel(status) : "—"}
          </Badge>
          <Badge variant="outline" className="h-6 px-2.5 text-xs">
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", getPriorityDot(priority))}
            />
            {priority ? formatLabel(priority) : "—"}
          </Badge>
        </div>
      </div>

      <div className="text-sm font-medium leading-snug text-foreground">
        {title}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>{ticketType}</span>
        {client ? (
          <>
            <span aria-hidden="true">•</span>
            <span>{client}</span>
          </>
        ) : null}
        <>
          <span aria-hidden="true">•</span>
          <span>{assignee?.trim() ? assignee : "Unassigned"}</span>
        </>
      </div>
    </button>
  )
}

function PropertyRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex min-w-0 justify-end">{value}</div>
    </div>
  )
}

function TicketPropertiesRail() {
  const status = "in_progress"
  const priority = "high"

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </div>
        <div className="text-xs font-mono text-muted-foreground/70">ticket:1042</div>
      </div>

      <div className="divide-y divide-border">
        <PropertyRow
          label="Client"
          value={
            <Badge variant="outline" className="h-6 max-w-[160px] min-w-0 px-2.5 text-xs">
              <span className="min-w-0 truncate">TechStart</span>
            </Badge>
          }
        />
        <PropertyRow
          label="Type"
          value={
            <Badge variant="outline" className="h-6 max-w-[160px] min-w-0 px-2.5 text-xs">
              <span className="min-w-0 truncate">Bug</span>
            </Badge>
          }
        />
        <PropertyRow
          label="Status"
          value={
            <Badge variant="outline" className="h-6 px-2.5 text-xs">
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", getStatusDot(status))} />
              {formatLabel(status)}
            </Badge>
          }
        />
        <PropertyRow
          label="Priority"
          value={
            <Badge variant="outline" className="h-6 px-2.5 text-xs">
              <span aria-hidden="true" className={cn("size-1.5 rounded-full", getPriorityDot(priority))} />
              {formatLabel(priority)}
            </Badge>
          }
        />
        <PropertyRow
          label="Assignee"
          value={
            <Badge variant="outline" className="h-6 max-w-[160px] min-w-0 px-2.5 text-xs">
              <span className="min-w-0 truncate">Maya Patel</span>
            </Badge>
          }
        />
        <PropertyRow
          label="Created"
          value={<span className="text-xs font-mono text-muted-foreground tabular-nums">2025-11-04</span>}
        />
        <PropertyRow
          label="SLA"
          value={
            <Badge className="h-6 border-none bg-amber-500/24 px-2.5 text-xs font-semibold text-amber-500">
              2.4 hrs over
            </Badge>
          }
        />
      </div>
    </div>
  )
}

export function DesignSystemClient() {
  const [triageStatus, setTriageStatus] = React.useState<string | null>("in_progress")
  const [triagePriority, setTriagePriority] = React.useState<string | null>("high")
  const [triageAssignee, setTriageAssignee] = React.useState<string | null>(
    String(SAMPLE_TEAM_MEMBERS[1]?.id ?? 102),
  )

  const [selectRole, setSelectRole] = React.useState<string | null>("support_agent")

  const roles = [
    { value: "support_agent", label: "Support agent" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
  ]

  const frameworks = ["Next.js", "React", "Svelte", "Vue", "Remix", "Astro"]

  const [dsDashboardFrom, setDsDashboardFrom] = React.useState("2025-01-01")
  const [dsDashboardTo, setDsDashboardTo] = React.useState("2025-11-30")
  const [dsDashboardAssignedTo, setDsDashboardAssignedTo] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: ["none", String(SAMPLE_TEAM_MEMBERS[1]?.id ?? 102)],
  })
  const [dsDashboardTicketTypes, setDsDashboardTicketTypes] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: [String(SAMPLE_TICKET_TYPES[1]?.id ?? 12)],
  })
  const [dsDashboardPriorities, setDsDashboardPriorities] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: ["urgent", "high"],
  })

  const resetDsDashboardFilters = React.useCallback(() => {
    setDsDashboardFrom("2025-01-01")
    setDsDashboardTo("2025-11-30")
    setDsDashboardAssignedTo({
      op: defaultListFilterOperator,
      values: ["none", String(SAMPLE_TEAM_MEMBERS[1]?.id ?? 102)],
    })
    setDsDashboardTicketTypes({
      op: defaultListFilterOperator,
      values: [String(SAMPLE_TICKET_TYPES[1]?.id ?? 12)],
    })
    setDsDashboardPriorities({ op: defaultListFilterOperator, values: ["urgent", "high"] })
  }, [])

  const [dsTicketsSearch, setDsTicketsSearch] = React.useState("")
  const [dsTicketsDepartment, setDsTicketsDepartment] = React.useState("all")
  const [dsTicketsFrom, setDsTicketsFrom] = React.useState("2025-10-01")
  const [dsTicketsTo, setDsTicketsTo] = React.useState("2025-11-30")
  const [dsTicketsClientFilter, setDsTicketsClientFilter] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: [String(SAMPLE_CLIENTS[0]?.id ?? 501)],
  })
  const [dsTicketsStatusFilter, setDsTicketsStatusFilter] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: ["open", "in_progress"],
  })
  const [dsTicketsPriorityFilter, setDsTicketsPriorityFilter] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: ["high", "urgent"],
  })
  const [dsTicketsTicketTypeFilter, setDsTicketsTicketTypeFilter] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: [String(SAMPLE_TICKET_TYPES[1]?.id ?? 12)],
  })
  const [dsTicketsAssignedToFilter, setDsTicketsAssignedToFilter] = React.useState<ListFilterState>({
    op: defaultListFilterOperator,
    values: ["none"],
  })

  const resetDsTicketsFilters = React.useCallback(() => {
    setDsTicketsSearch("")
    setDsTicketsDepartment("all")
    setDsTicketsFrom("2025-10-01")
    setDsTicketsTo("2025-11-30")
    setDsTicketsClientFilter({
      op: defaultListFilterOperator,
      values: [String(SAMPLE_CLIENTS[0]?.id ?? 501)],
    })
    setDsTicketsStatusFilter({ op: defaultListFilterOperator, values: ["open", "in_progress"] })
    setDsTicketsPriorityFilter({ op: defaultListFilterOperator, values: ["high", "urgent"] })
    setDsTicketsTicketTypeFilter({
      op: defaultListFilterOperator,
      values: [String(SAMPLE_TICKET_TYPES[1]?.id ?? 12)],
    })
    setDsTicketsAssignedToFilter({ op: defaultListFilterOperator, values: ["none"] })
  }, [])

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white px-6 py-8 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              OpsKings Support
            </div>
            <h1 className="mt-2 text-[28px] font-extrabold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-200">
              Design System
            </h1>
            <p className="mt-2 max-w-[70ch] text-sm text-zinc-600 dark:text-zinc-400">
              Canonical samples of atoms, fragments, and UI patterns used across the
              support analytics dashboard and client portal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-900 dark:bg-black dark:text-zinc-400 dark:hover:bg-zinc-950/30 dark:hover:text-zinc-200"
            >
              Back to app
            </Link>
            <a
              href="#atoms-button"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-600 hover:bg-white hover:text-zinc-900 dark:border-zinc-900 dark:bg-zinc-950/30 dark:text-zinc-400 dark:hover:bg-black dark:hover:text-zinc-200"
            >
              Jump to atoms
              <CaretDownIcon size={16} />
            </a>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-900 dark:bg-zinc-950/30">
              <div className="mb-3 text-[13px] font-bold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                Navigation
              </div>
              <nav className="grid gap-4">
                {NAV.map((group) => (
                  <div key={group.label} className="grid gap-2">
                    <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                      {group.label}
                    </div>
                    <ul className="grid gap-1">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            className="block rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-black dark:hover:text-zinc-100"
                          >
                            {item.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-10">
            <DsSection
              id="ui-patterns-layout"
              title="UI patterns · Layout"
              description="Reusable page layouts and structural patterns."
            >
              <div className="grid gap-4">
	                <DsShowcase title="App shell layout" hint="Sidebar · Header · Content">
	                  <div className="grid gap-3">
	                    <div className="grid grid-cols-[14rem_minmax(0,1fr)] overflow-hidden rounded-md border border-border bg-background">
	                      <div className="border-r border-border bg-sidebar text-sidebar-foreground">
	                        <div className="px-4 pt-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
	                          General
	                        </div>
	                        <div className="mt-2 pb-4">
	                          {[
	                            { label: "Dashboard", active: true },
	                            { label: "Response time", active: false },
	                            { label: "Teams", active: false },
	                            { label: "Clients", active: false },
	                            { label: "Tickets", active: false },
	                          ].map((item) => (
	                            <div
	                              key={item.label}
	                              className={cn(
	                                "flex h-8 items-center gap-2 border-l-[0.2rem] border-transparent bg-transparent pl-[14px] pr-4 text-xs font-normal text-sidebar-foreground/60",
	                                "hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
	                                item.active
	                                  ? "border-primary bg-zinc-200 text-sidebar-foreground font-semibold dark:bg-zinc-800"
	                                  : "",
	                              )}
	                            >
	                              <span className="truncate">{item.label}</span>
	                            </div>
	                          ))}
	                        </div>
	                      </div>

                      <div className="flex min-h-[220px] flex-col">
                        <div className="flex h-12 items-center justify-between border-b border-border/60 px-4">
                          <div className="text-sm font-semibold tracking-wide">Dashboard</div>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-muted/30" aria-hidden="true" />
                            <div className="h-7 w-7 rounded-md bg-muted/30" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="h-10 rounded-md border border-border bg-card" />
                          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-18 rounded-md border border-border bg-card"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Pages typically share a top filter row and a padded content
                      area (`px-6 pt-6`) for consistent rhythm.
                    </div>
                  </div>
                </DsShowcase>

                <DsShowcase title="Details + properties rail" hint="Thread · Right sidebar">
                  <div className="grid grid-cols-[minmax(0,1fr)_16rem] overflow-hidden rounded-md border border-border bg-background">
                    <div className="p-4">
                      <div className="h-6 w-3/4 rounded-sm bg-muted/30" />
                      <div className="mt-3 space-y-2">
                        <div className="h-4 w-full rounded-sm bg-muted/20" />
                        <div className="h-4 w-11/12 rounded-sm bg-muted/20" />
                        <div className="h-4 w-10/12 rounded-sm bg-muted/20" />
                      </div>
                      <div className="mt-6 space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full border border-border bg-muted/10" />
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="h-4 w-40 rounded-sm bg-muted/30" />
                              <div className="h-4 w-full rounded-sm bg-muted/20" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-l border-border bg-muted/10 p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        Properties
                      </div>
                      <div className="mt-3 space-y-2">
                        {Array.from({ length: 6 }).map((_, idx) => (
                          <div key={idx} className="h-6 rounded-md bg-muted/20" />
                        ))}
                      </div>
                    </div>
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="ui-patterns-navigation"
              title="UI patterns · Navigation"
              description="Navigation patterns using existing atoms."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Pill nav" hint="Buttons + badges">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Dashboard</Button>
                    <Button size="sm" variant="secondary">Tickets</Button>
                    <Button size="sm" variant="outline">
                      Response time
                      <Badge variant="secondary" className="ml-1">
                        analytics
                      </Badge>
                    </Button>
                    <Button size="sm" variant="ghost">Teams</Button>
                  </div>
                </DsShowcase>

	                <DsShowcase title="Sidebar links" hint="Simple stacked list">
	                  <div className="divide-y divide-sidebar-border/60 overflow-hidden rounded-md border border-sidebar-border/60 bg-sidebar text-sidebar-foreground">
	                    {[
	                      { label: "Dashboard", active: true },
	                      { label: "Response time", active: false },
	                      { label: "Teams", active: false },
                      { label: "Clients", active: false },
                      { label: "Tickets", active: false },
                    ].map((item) => (
	                      <a
	                        key={item.label}
	                        href="#"
	                        onClick={(e) => e.preventDefault()}
	                        className={cn(
	                          "flex h-8 items-center gap-2 border-l-[0.2rem] border-transparent bg-transparent pl-[14px] pr-4 text-xs font-normal text-sidebar-foreground/60",
	                          "hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
	                          item.active
	                            ? "border-primary bg-zinc-200 text-sidebar-foreground font-semibold dark:bg-zinc-800"
	                            : "",
	                        )}
	                      >
	                        <span className="truncate">{item.label}</span>
	                      </a>
	                    ))}
	                  </div>
	                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="ui-patterns-forms"
              title="UI patterns · Forms"
              description="Typical form compositions using Field + InputGroup + Select/Combobox."
            >
              <div className="grid gap-4">
                <DsShowcase title="Ticket triage panel" hint="Compact updates in the ticket details rail">
                  <Card className="max-w-[52rem]" size="sm">
                    <CardHeader className="border-b border-zinc-200 dark:border-zinc-900">
                      <CardTitle>Ticket triage</CardTitle>
                      <CardDescription>
                        Update status, priority, and assignment without leaving the thread.
                      </CardDescription>
                      <CardAction>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="outline" size="sm" />}
                          >
                            Actions
                            <CaretDownIcon className="ml-1" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem>
                                <CopyIcon />
                                Copy ticket link
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <GearIcon />
                                  More
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuItem>
                                      <CheckIcon />
                                      Assign to me
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive">
                                      <TrashIcon />
                                      Archive
                                    </DropdownMenuItem>
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={(e) => e.preventDefault()}
                        className="grid gap-4"
                      >
                        <FieldGroup>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Field>
                              <FieldLabel htmlFor="ds-triage-status">Status</FieldLabel>
                              <Select
                                value={triageStatus}
                                onValueChange={(v) => setTriageStatus(v)}
                              >
                                <SelectTrigger id="ds-triage-status">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start">
                                  <SelectGroup>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In progress</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="ds-triage-priority">Priority</FieldLabel>
                              <Select
                                value={triagePriority}
                                onValueChange={(v) => setTriagePriority(v)}
                              >
                                <SelectTrigger id="ds-triage-priority">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start">
                                  <SelectGroup>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="ds-triage-assignee">Assignee</FieldLabel>
                              <Select
                                value={triageAssignee}
                                onValueChange={(v) => setTriageAssignee(v)}
                              >
                                <SelectTrigger id="ds-triage-assignee">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="start">
                                  <SelectGroup>
                                    {SAMPLE_TEAM_MEMBERS.map((tm) => (
                                      <SelectItem key={tm.id} value={String(tm.id)}>
                                        {formatLabel(tm.username)}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>

                          <Field>
                            <FieldLabel htmlFor="ds-triage-type">
                              Ticket type
                            </FieldLabel>
                            <Combobox items={SAMPLE_TICKET_TYPES.map((tt) => tt.typeName)}>
                              <ComboboxInput
                                id="ds-triage-type"
                                placeholder="Select a ticket type"
                                showClear
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  No ticket types found.
                                </ComboboxEmpty>
                                <ComboboxList>
                                  {(item) => (
                                    <ComboboxItem key={item} value={item}>
                                      {item}
                                    </ComboboxItem>
                                  )}
                                </ComboboxList>
                              </ComboboxContent>
                            </Combobox>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="ds-triage-notes">Internal note</FieldLabel>
                            <Textarea
                              id="ds-triage-notes"
                              placeholder="Optional context for the team…"
                            />
                            <FieldDescription>
                              Internal notes are not visible to the client.
                            </FieldDescription>
                          </Field>

                          <Field orientation="horizontal">
                            <Button type="submit">Update ticket</Button>
                            <Button type="button" variant="outline">
                              Cancel
                            </Button>
                          </Field>
                        </FieldGroup>
                      </form>
                    </CardContent>
                  </Card>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="ui-patterns-charts"
              title="UI patterns · Charts"
              description="Chart patterns used across analytics (Recharts + `components/ui/chart`)."
            >
              <div className="grid gap-4">
                <DsShowcase title="Dashboard analytics" hint="KPIs + chart cards">
                  <div className="grid gap-4">
                    <CardGroup className="grid grid-cols-1 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
                      <KpiCard
                        title="Total tickets"
                        value="40.1k"
                        description="Tickets created in the selected range."
                      />
                      <KpiCard
                        title="Open tickets"
                        value="8.9k"
                        description="Open + in progress."
                      />
                      <KpiCard
                        title="Avg resolution time"
                        value="3.2 hrs"
                        description="Resolved tickets only."
                      />
                      <KpiCard
                        title="Customer satisfaction"
                        value="4.6"
                        description="Avg rating from feedback."
                        right={<div className="text-2xl font-semibold text-muted-foreground/70">/5</div>}
                      />
                    </CardGroup>

                    <div className="grid gap-4 lg:grid-cols-2 lg:gap-x-0">
                      <TicketsOverTimeChart
                        data={SAMPLE_TICKETS_OVER_TIME}
                        latestMonthKey="2025-11"
                      />
                      <TicketsByTypeChart rows={SAMPLE_TICKETS_BY_TYPE} />
                    </div>

                    <TicketsByPriorityCard
                      total={SAMPLE_TICKETS_TOTAL}
                      rows={SAMPLE_TICKETS_BY_PRIORITY}
                      statusRows={SAMPLE_TICKETS_BY_PRIORITY_STATUS}
                    />
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="fragments-page-headers"
              title="Fragments · Page header"
              description="Header patterns used at the top of sections/pages."
            >
              <div className="grid gap-4">
                <DsShowcase title="Ticket breadcrumb header" hint="Back link + keyboard affordance">
                  <div className="flex min-h-[50px] items-center justify-between gap-4 border border-border bg-background px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Button variant="ghost" size="xs" aria-label="Back to tickets">
                        <ArrowLeftIcon className="size-4" aria-hidden="true" />
                        Tickets
                      </Button>
                      <CaretRightIcon className="size-3.5 text-muted-foreground/60" aria-hidden="true" />
                      <span className="font-medium text-foreground/80">#1042</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Back</span>
                      <Kbd>Esc</Kbd>
                    </div>
                  </div>
                </DsShowcase>

                <DsShowcase title="Page action row" hint="Primary action + shortcut">
                  <div className="flex items-center justify-end border border-border bg-background p-3">
                    <Button size="sm" aria-label="Create new ticket">
                      <span>New ticket</span>
                      <KbdGroup className="ml-1">
                        <Kbd>⌘</Kbd>
                        <Kbd>C</Kbd>
                      </KbdGroup>
                    </Button>
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="fragments-filter-bar"
              title="Fragments · Filter row"
              description="Top-of-page filter rows used across analytics and tables."
            >
              <div className="grid gap-4">
                <DsShowcase title="Analytics filter row" hint="Dashboard / Response time">
                  <DashboardFilterRow
                    from={dsDashboardFrom}
                    to={dsDashboardTo}
                    assignedToFilter={dsDashboardAssignedTo}
                    ticketTypeFilter={dsDashboardTicketTypes}
                    priorityFilter={dsDashboardPriorities}
                    teamMembers={SAMPLE_TEAM_MEMBERS}
                    ticketTypes={SAMPLE_TICKET_TYPES}
                    onFromChange={setDsDashboardFrom}
                    onToChange={setDsDashboardTo}
                    onAssignedToChange={setDsDashboardAssignedTo}
                    onTicketTypeChange={setDsDashboardTicketTypes}
                    onPriorityChange={setDsDashboardPriorities}
                    onReset={resetDsDashboardFilters}
                  />
                </DsShowcase>

                <DsShowcase title="Tickets filter row" hint="Search + date + facets">
                  <TicketsFilterRow
                    userType="internal"
                    internalRole="manager"
                    from={dsTicketsFrom}
                    to={dsTicketsTo}
                    search={dsTicketsSearch}
                    department={dsTicketsDepartment}
                    departmentOptions={["finance", "technical", "support", "product"]}
                    clientFilter={dsTicketsClientFilter}
                    statusFilter={dsTicketsStatusFilter}
                    priorityFilter={dsTicketsPriorityFilter}
                    ticketTypeFilter={dsTicketsTicketTypeFilter}
                    assignedToFilter={dsTicketsAssignedToFilter}
                    ticketTypes={SAMPLE_TICKET_TYPES}
                    teamMembers={SAMPLE_TEAM_MEMBERS}
                    clients={SAMPLE_CLIENTS}
                    onFromChange={setDsTicketsFrom}
                    onToChange={setDsTicketsTo}
                    onSearchChange={setDsTicketsSearch}
                    onDepartmentChange={(next) => setDsTicketsDepartment(next ?? "all")}
                    onClientChange={setDsTicketsClientFilter}
                    onStatusChange={setDsTicketsStatusFilter}
                    onPriorityChange={setDsTicketsPriorityFilter}
                    onTicketTypeChange={setDsTicketsTicketTypeFilter}
                    onAssignedToChange={setDsTicketsAssignedToFilter}
                    onReset={resetDsTicketsFilters}
                  />
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="fragments-info-tooltip"
              title="Fragments · Info tooltip"
              description="A small helper tooltip for dense UIs."
            >
              <DsShowcase title="Tooltip">
                <div className="flex flex-wrap items-center gap-3">
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-2",
                      )}
                    >
                      Hover for info
                      <InfoIcon className="ml-1" />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Positioner
                        side="top"
                        align="center"
                        sideOffset={8}
                        className="z-50"
                      >
                        <Tooltip.Popup className="max-w-[22rem] border border-zinc-300 bg-white px-3 py-2 text-left text-[12px] font-medium leading-snug text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
                          Customer satisfaction is the average rating left on
                          resolved tickets for the selected filters.
                        </Tooltip.Popup>
                        <Tooltip.Arrow className="h-2 w-2 rotate-45 border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-black" />
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    Future: wrap Base UI Tooltip into `components/ui/tooltip.tsx`
                    so usage is consistent.
                  </div>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="fragments-confirmation-modal"
              title="Fragments · Confirmation modal"
              description="A standard destructive confirmation pattern."
            >
              <DsShowcase title="Confirmation modal">
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="destructive" />}>
                    Archive ticket
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <TrashIcon />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Archive this ticket?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Archiving removes the ticket from default views. You can
                        restore it later from archived tickets.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive">
                        Archive
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="fragments-ticket-row"
              title="Fragments · Ticket row"
              description="Dense list row used for ticket browsing + triage."
            >
              <div className="grid gap-3">
                <DsShowcase title="Ticket rows">
                  <div className="grid gap-2">
                    <TicketRow
                      active
                      id={1042}
                      title="SSO login fails for Okta users after password reset"
                      client="TechStart"
                      ticketType="Access"
                      status="in_progress"
                      priority="high"
                      assignee="Maya Patel"
                      createdAt="2025-11-04"
                    />
                    <TicketRow
                      striped
                      id={1031}
                      title="Invoice shows duplicate line items for November"
                      client="CloudNine"
                      ticketType="Billing"
                      status="open"
                      priority="urgent"
                      assignee={null}
                      createdAt="2025-11-02"
                    />
                    <TicketRow
                      id={997}
                      title="Feature request: Export tickets to CSV from clients view"
                      client="Acme Co"
                      ticketType="Feature request"
                      status="resolved"
                      priority="medium"
                      assignee="John Smith"
                      createdAt="2025-10-18"
                    />
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="fragments-properties-rail"
              title="Fragments · Properties rail"
              description="Right-side properties rail used on ticket details."
            >
              <DsShowcase title="Properties rail">
                <TicketPropertiesRail />
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-button"
              title="Atoms · Button"
              description="All button variants + size matrix."
            >
              <div className="grid gap-4">
                <DsShowcase title="Variants">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button>Default</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </DsShowcase>

                <DsShowcase title="Sizes">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="xs">XS</Button>
                    <Button size="sm">SM</Button>
                    <Button>Default</Button>
                    <Button size="lg">LG</Button>
                    <Button size="icon" aria-label="Settings">
                      <GearIcon />
                    </Button>
                    <Button size="icon-xs" aria-label="Search">
                      <MagnifyingGlassIcon />
                    </Button>
                    <Button size="icon-lg" aria-label="Ticket">
                      <TicketIcon />
                    </Button>
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-badge"
              title="Atoms · Badge"
              description="Badge variants used across dense UIs."
            >
              <DsShowcase title="Variants">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="ghost">Ghost</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="link">Link</Badge>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-input"
              title="Atoms · Input"
              description="Text input with size/states."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Default">
                  <div className="grid gap-2">
                    <Input placeholder="Default" />
                    <Input placeholder="Small" size="sm" />
                    <Input placeholder="Large" size="lg" />
                  </div>
                </DsShowcase>
                <DsShowcase title="States">
                  <div className="grid gap-2">
                    <Input placeholder="Disabled" disabled />
                    <Input placeholder="Invalid" aria-invalid />
                    <Input type="search" placeholder="Search input" />
                    <Input type="file" />
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-input-group"
              title="Atoms · Input group"
              description="Input group primitives (addons, buttons, textarea)."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Inline addons">
                  <div className="grid gap-2">
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <InputGroupText>https://</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput placeholder="example.com" />
                    </InputGroup>
                    <InputGroup>
                      <InputGroupInput placeholder="Search…" />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton size="icon-xs" aria-label="Search">
                          <MagnifyingGlassIcon />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </DsShowcase>

                <DsShowcase title="Block addons">
                  <InputGroup className="h-auto">
                    <InputGroupAddon align="block-start" className="border-b border-zinc-200 dark:border-zinc-900">
                      Title
                    </InputGroupAddon>
                    <InputGroupInput placeholder="Short summary…" />
                    <InputGroupAddon align="block-end" className="border-t border-zinc-200 dark:border-zinc-900">
                      <KbdGroup>
                        <Kbd>⌘</Kbd>
                        <Kbd>↩</Kbd>
                      </KbdGroup>
                    </InputGroupAddon>
                  </InputGroup>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-textarea"
              title="Atoms · Textarea"
              description="Multiline input for longer content."
            >
              <DsShowcase title="Textarea">
                <div className="grid gap-2">
                  <Textarea placeholder="Write a note…" />
                  <Textarea placeholder="Disabled…" disabled />
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-label"
              title="Atoms · Label"
              description="Inline label for form controls."
            >
              <DsShowcase title="Label">
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="ds-labeled-input">Email</Label>
                    <Input id="ds-labeled-input" placeholder="you@company.com" />
                  </div>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-separator"
              title="Atoms · Separator"
              description="Horizontal and vertical separators."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Horizontal">
                  <div className="grid gap-3">
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      Above
                    </div>
                    <Separator />
                    <div className="text-sm text-zinc-700 dark:text-zinc-300">
                      Below
                    </div>
                  </div>
                </DsShowcase>
                <DsShowcase title="Vertical">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Left
                    </span>
                    <Separator orientation="vertical" />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Right
                    </span>
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-card"
              title="Atoms · Card"
              description="Card primitives (header/content/footer) used for containers."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Default card">
                  <Card>
                    <CardHeader className="border-b border-zinc-200 dark:border-zinc-900">
                      <CardTitle>Card title</CardTitle>
                      <CardDescription>Supporting text for the card.</CardDescription>
                      <CardAction>
                        <Button size="sm" variant="outline">
                          Action
                        </Button>
                      </CardAction>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-zinc-700 dark:text-zinc-300">
                        Body content goes here.
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-zinc-200 dark:border-zinc-900">
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs text-zinc-500 dark:text-zinc-500">
                          Footer
                        </span>
                        <Badge variant="secondary">status</Badge>
                      </div>
                    </CardFooter>
                  </Card>
                </DsShowcase>

                <DsShowcase title="Small card">
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>Dense container</CardTitle>
                      <CardDescription>For tight side rails.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="h-8 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black" />
                        <div className="h-8 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black" />
                      </div>
                    </CardContent>
                  </Card>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-kbd"
              title="Atoms · Kbd"
              description="Keyboard shortcut tokens."
            >
              <DsShowcase title="Kbd">
                <div className="flex flex-wrap items-center gap-3">
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>K</Kbd>
                  </KbdGroup>
                  <KbdGroup>
                    <Kbd>⇧</Kbd>
                    <Kbd>⌘</Kbd>
                    <Kbd>P</Kbd>
                  </KbdGroup>
                  <Kbd>/</Kbd>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-select"
              title="Atoms · Select"
              description="Select dropdown (Base UI Select)."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Default">
                  <Select
                    items={roles}
                    value={selectRole}
                    onValueChange={(v) => setSelectRole(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        <SelectLabel>Roles</SelectLabel>
                        {roles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </DsShowcase>

                <DsShowcase title="Small">
                  <Select
                    items={roles}
                    value={selectRole}
                    onValueChange={(v) => setSelectRole(v)}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectGroup>
                        {roles.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-combobox"
              title="Atoms · Combobox"
              description="Searchable selection (Base UI Combobox)."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DsShowcase title="Combobox input">
                  <Combobox items={frameworks}>
                    <ComboboxInput placeholder="Select a framework" showClear />
                    <ComboboxContent>
                      <ComboboxEmpty>No frameworks found.</ComboboxEmpty>
                      <ComboboxList>
                        {(item) => (
                          <ComboboxItem key={item} value={item}>
                            {item}
                          </ComboboxItem>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                </DsShowcase>

                <DsShowcase title="Combobox disabled">
                  <Combobox items={frameworks} disabled>
                    <ComboboxInput
                      placeholder="Disabled"
                      disabled
                      showTrigger={false}
                    />
                  </Combobox>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="atoms-dropdown-menu"
              title="Atoms · Dropdown menu"
              description="Context and action menus."
            >
              <DsShowcase title="Dropdown menu">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" />}>
                    Open menu
                    <CaretDownIcon className="ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem>
                        <CopyIcon />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CheckIcon />
                        Mark as read
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem variant="destructive">
                        <TrashIcon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-dialog"
              title="Atoms · Dialog"
              description="General-purpose modal container."
            >
              <DsShowcase title="Dialog">
                <Dialog>
                  <DialogTrigger render={<Button variant="secondary" />}>
                    Open dialog
                  </DialogTrigger>
                  <DialogPopup>
                    <DialogHeader>
                      <DialogTitle>Dialog title</DialogTitle>
                      <DialogDescription>
                        Use for non-destructive flows: settings, previews,
                        multi-step forms.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogPanel className="grid gap-3">
                      <FieldSet>
                        <FieldLegend variant="label">Example inputs</FieldLegend>
                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor="ds-dialog-email">
                              Email
                            </FieldLabel>
                            <Input
                              id="ds-dialog-email"
                              placeholder="you@company.com"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="ds-dialog-notes">
                              Notes
                            </FieldLabel>
                            <Textarea
                              id="ds-dialog-notes"
                              placeholder="Optional…"
                            />
                            <FieldError errors={[{ message: "Example error message" }]} />
                          </Field>
                          <FieldSeparator>or</FieldSeparator>
                          <Field>
                            <FieldLabel htmlFor="ds-dialog-search">
                              Search
                            </FieldLabel>
                            <InputGroup>
                              <InputGroupInput
                                id="ds-dialog-search"
                                type="search"
                                placeholder="Type to filter…"
                              />
                              <InputGroupAddon align="inline-end">
                                <MagnifyingGlassIcon />
                              </InputGroupAddon>
                            </InputGroup>
                            <FieldDescription>
                              Use `InputGroup` for icons and adornments.
                            </FieldDescription>
                          </Field>
                        </FieldGroup>
                      </FieldSet>
                    </DialogPanel>
                    <DialogFooter>
                      <DialogClose>Close</DialogClose>
                      <Button>Confirm</Button>
                    </DialogFooter>
                  </DialogPopup>
                </Dialog>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="atoms-alert-dialog"
              title="Atoms · Alert dialog"
              description="Destructive/confirm flows requiring explicit acknowledgement."
            >
              <DsShowcase title="Alert dialog">
                <AlertDialog>
                  <AlertDialogTrigger render={<Button variant="outline" />}>
                    Open alert
                  </AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <InfoIcon />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Heads up</AlertDialogTitle>
                      <AlertDialogDescription>
                        Use alert dialogs sparingly; prefer inline confirmations
                        when safe.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DsShowcase>
            </DsSection>
          </main>
        </div>
      </div>
    </div>
  )
}
