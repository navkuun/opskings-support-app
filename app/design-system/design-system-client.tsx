"use client"

import Link from "next/link"
import * as React from "react"
import {
  CaretDownIcon,
  CheckIcon,
  CopyIcon,
  GearIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import { Tooltip } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox"
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogPanel, DialogPopup, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
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
      { id: "fragments-filter-bar", label: "Filter bar" },
      { id: "fragments-info-tooltip", label: "Info tooltip" },
      { id: "fragments-confirmation-modal", label: "Confirmation modal" },
      { id: "fragments-news-card", label: "News card" },
      { id: "fragments-tldr-container", label: "TL;DR container" },
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

function ChartPlaceholder() {
  const bars = [42, 26, 58, 35, 72, 46]
  return (
    <div className="flex h-28 items-end gap-2">
      {bars.map((h, idx) => (
        <div
          key={idx}
          className={cn(
            "w-8 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black",
            idx === 3 ? "border-[#D20906]/40 bg-[#D20906]/10" : "",
          )}
          style={{ height: `${h}%` }}
          aria-hidden
        />
      ))}
    </div>
  )
}

function TerminalNewsCard({
  active,
  striped,
  title,
  region,
  signal,
  tags,
}: {
  active?: boolean
  striped?: boolean
  title: string
  region: string
  signal: "standard" | "minor" | "important"
  tags: { type: "company" | "topic"; label: string }[]
}) {
  return (
    <button
      type="button"
      className={cn(
        "w-full cursor-pointer p-3 text-left transition-none",
        "border border-zinc-300 dark:border-black",
        active
          ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : cn(
              "bg-white hover:bg-zinc-100 dark:bg-black dark:hover:bg-zinc-900/40",
              striped && "bg-zinc-50 dark:bg-zinc-950",
            ),
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-[13px] text-zinc-500">2026-01-06 13:37:00</span>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <span className="border border-sky-300 bg-sky-50 px-1 text-[13px] font-bold uppercase text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-400">
            {region}
          </span>
          <span
            className={cn(
              "border px-1 text-[13px] font-bold uppercase",
              signal === "important"
                ? "border-[#D20906]/40 bg-[#D20906]/10 text-[#D20906] dark:border-[#D20906]/60 dark:bg-[#D20906]/20"
                : signal === "minor"
                  ? "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-400"
                  : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
            )}
          >
            {signal}
          </span>
        </div>
      </div>

      <div className="text-[19px] font-bold uppercase leading-tight tracking-wide text-zinc-900 dark:text-zinc-200">
        {title}
      </div>

      {tags.length ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {tags
            .filter((t) => t.type === "company")
            .map((t) => (
              <span
                key={`company:${t.label}`}
                className="bg-zinc-300 px-1 text-[13px] font-bold uppercase text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                @{t.label}
              </span>
            ))}
          {tags
            .filter((t) => t.type === "topic")
            .map((t) => (
              <span
                key={`topic:${t.label}`}
                className="border border-zinc-200 px-1 text-[13px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400"
              >
                #{t.label}
              </span>
            ))}
        </div>
      ) : null}
    </button>
  )
}

function TldrContainer() {
  return (
    <div className="border border-zinc-300 bg-white dark:border-black dark:bg-black">
      <div className="flex justify-between border-b border-zinc-300 bg-zinc-100 p-1 text-[19px] font-bold uppercase text-zinc-600 dark:border-black dark:bg-zinc-900/40 dark:text-zinc-400">
        <span>TLDR</span>
        <span className="text-[13px] font-mono text-zinc-400 dark:text-zinc-500">
          story:tldr
        </span>
      </div>
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-3 text-[19px] text-zinc-600 dark:text-zinc-300">
          <div className="flex gap-2">
            <span className="text-[19px] font-bold uppercase text-zinc-500 dark:text-zinc-500">
              TOPIC
            </span>
            <span className="font-bold">GPU_SUPPLY_CHAIN</span>
          </div>
        </div>

        <ul className="list-disc space-y-1 pl-5 text-[19px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <li>Demand remains elevated despite tighter allocation windows.</li>
          <li>Secondary market pricing compresses as lead times normalize.</li>
          <li>Power and cooling constraints shift deployment timelines.</li>
          <li>Regional variance increases for import-heavy buyers.</li>
        </ul>
      </div>
    </div>
  )
}

export function DesignSystemClient() {
  const [selectRole, setSelectRole] = React.useState<string | null>("ops")

  const roles = [
    { value: "ops", label: "Ops" },
    { value: "infra", label: "Infra" },
    { value: "security", label: "Security" },
    { value: "finance", label: "Finance" },
  ]

  const frameworks = ["Next.js", "React", "Svelte", "Vue", "Remix", "Astro"]

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white px-6 py-8 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[13px] font-bold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              Rack Insider
            </div>
            <h1 className="mt-2 text-[28px] font-extrabold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-200">
              Design System
            </h1>
            <p className="mt-2 max-w-[70ch] text-sm text-zinc-600 dark:text-zinc-400">
              Canonical samples of atoms, fragments, and UI patterns. This page is
              intentionally exhaustive so we can iterate on styling and
              consistency later.
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
                <DsShowcase
                  title="Three-column terminal layout"
                  hint="Sidebar · Feed · Details · Right rail"
                >
                  <div className="grid gap-3">
                    <div className="grid grid-cols-[12rem_18rem_minmax(0,1fr)_14rem] overflow-hidden rounded-md border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black">
                      <div className="border-r border-zinc-200 p-3 dark:border-zinc-900">
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                          Sidebar
                        </div>
                        <div className="mt-3 space-y-2">
                          {["Market", "Telemetry", "Regions"].map((t) => (
                            <div
                              key={t}
                              className="h-8 rounded-sm border border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/30"
                            />
                          ))}
                        </div>
                      </div>
                      <div className="border-r border-zinc-200 p-3 dark:border-zinc-900">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                            Feed
                          </div>
                          <KbdGroup>
                            <Kbd>/</Kbd>
                          </KbdGroup>
                        </div>
                        <div className="mt-3 space-y-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-10 rounded-sm border border-zinc-200 dark:border-zinc-900",
                                i % 2 ? "bg-zinc-50 dark:bg-zinc-950/30" : "bg-white dark:bg-black",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                          Details
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-7 max-w-[22rem] rounded-sm border border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/30" />
                          <div className="h-16 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black" />
                          <div className="h-40 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black" />
                        </div>
                      </div>
                      <div className="border-l border-zinc-200 p-3 dark:border-zinc-900">
                        <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                          Right rail
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-24 rounded-sm border border-zinc-200 bg-white dark:border-zinc-900 dark:bg-black" />
                          <div className="h-24 rounded-sm border border-zinc-200 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-950/30" />
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      When we formalize this, we should extract a shared layout
                      wrapper and keep rails composable.
                    </div>
                  </div>
                </DsShowcase>

                <DsShowcase title="Page container" hint="Max width + spacing">
                  <div className="rounded-md border border-dashed border-zinc-300 p-4 dark:border-zinc-800">
                    <div className="mx-auto w-full max-w-[56rem] space-y-2">
                      <div className="h-5 w-48 rounded-sm bg-zinc-200 dark:bg-zinc-900" />
                      <div className="h-4 w-full rounded-sm bg-zinc-100 dark:bg-zinc-950/50" />
                      <div className="h-4 w-5/6 rounded-sm bg-zinc-100 dark:bg-zinc-950/50" />
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
                    <Button size="sm">Home</Button>
                    <Button size="sm" variant="secondary">
                      Datacenters
                    </Button>
                    <Button size="sm" variant="outline">
                      Compute
                      <Badge variant="secondary" className="ml-1">
                        soon
                      </Badge>
                    </Button>
                    <Button size="sm" variant="ghost">
                      Settings
                    </Button>
                  </div>
                </DsShowcase>

                <DsShowcase title="Sidebar links" hint="Simple stacked list">
                  <div className="space-y-1">
                    {[
                      { label: "Dashboard", active: true },
                      { label: "Stories", active: false },
                      { label: "Signals", active: false },
                      { label: "Sources", active: false },
                    ].map((item) => (
                      <a
                        key={item.label}
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className={cn(
                          "flex items-center justify-between rounded-md border border-transparent px-2 py-2 text-sm",
                          item.active
                            ? "bg-white text-zinc-900 ring-1 ring-zinc-200 dark:bg-black dark:text-zinc-100 dark:ring-zinc-900"
                            : "text-zinc-700 hover:bg-white hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-black dark:hover:text-zinc-100",
                        )}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.active ? (
                          <span className="h-2 w-2 bg-[#D20906]" aria-hidden />
                        ) : null}
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
                <DsShowcase title="Compact form" hint="Two-column + actions">
                  <Card className="max-w-[52rem]" size="sm">
                    <CardHeader className="border-b border-zinc-200 dark:border-zinc-900">
                      <CardTitle>Profile</CardTitle>
                      <CardDescription>
                        A dense form layout for internal tooling.
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
                                Copy ID
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
                                      Mark active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem variant="destructive">
                                      <TrashIcon />
                                      Delete
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
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="ds-name">Name</FieldLabel>
                              <Input id="ds-name" placeholder="Ada Lovelace" />
                            </Field>
                            <Field>
                              <FieldLabel htmlFor="ds-role">Role</FieldLabel>
                              <Select
                                items={roles}
                                value={selectRole}
                                onValueChange={(v) => setSelectRole(v)}
                              >
                                <SelectTrigger id="ds-role">
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
                                  <SelectSeparator />
                                  <SelectGroup>
                                    <SelectLabel>Meta</SelectLabel>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>

                          <Field>
                            <FieldLabel htmlFor="ds-framework">
                              Framework
                            </FieldLabel>
                            <Combobox items={frameworks}>
                              <ComboboxInput
                                id="ds-framework"
                                placeholder="Select a framework"
                                showClear
                              />
                              <ComboboxContent>
                                <ComboboxEmpty>
                                  No frameworks found.
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
                            <FieldLabel htmlFor="ds-notes">Notes</FieldLabel>
                            <Textarea
                              id="ds-notes"
                              placeholder="Optional details…"
                            />
                            <FieldDescription>
                              Keep descriptions short and specific.
                            </FieldDescription>
                          </Field>

                          <Field orientation="horizontal">
                            <Button type="submit">Save</Button>
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
              description="We don’t have chart primitives yet; this is a placeholder for future chart components."
            >
              <DsShowcase title="Simple bar chart (placeholder)">
                <div className="grid gap-3">
                  <ChartPlaceholder />
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    Future: extract a chart wrapper (axes, tooltip, legend,
                    color tokens) so charts are consistent.
                  </div>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="fragments-page-headers"
              title="Fragments · Page header"
              description="Header patterns used at the top of sections/pages."
            >
              <DsShowcase title="Section header" hint="Title + actions">
                <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-200 bg-white p-3 dark:border-zinc-900 dark:bg-black">
                  <div className="min-w-0">
                    <div className="text-[19px] font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-200">
                      News ingest
                    </div>
                    <div className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-500">
                      Showing last 80 stories
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm">
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                </div>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="fragments-filter-bar"
              title="Fragments · Filter bar"
              description="Search + quick filters with consistent spacing."
            >
              <DsShowcase title="Filter bar" hint="InputGroup + tabs">
                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    {["all", "today", "yesterday", "2d", "7d"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={cn(
                          "cursor-pointer whitespace-nowrap border-b border-transparent px-1 py-1 text-[13px] font-bold uppercase text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-300",
                          tab === "today"
                            ? "border-[#D20906] text-zinc-900 dark:text-zinc-300"
                            : "",
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <InputGroup className="h-10 border-zinc-300 bg-white dark:border-zinc-800 dark:bg-black">
                    <InputGroupInput
                      aria-label="Filter stories"
                      type="search"
                      placeholder="Filter stories…"
                      className="h-10 px-0 text-[13px] text-zinc-900 placeholder:text-zinc-400 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                    />
                    <InputGroupAddon align="inline-end" className="pl-3">
                      <MagnifyingGlassIcon size={20} />
                    </InputGroupAddon>
                  </InputGroup>
                </div>
              </DsShowcase>
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
                          Short helper copy, ideally with one sentence and a clear
                          follow-up action.
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
                    Delete item
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia>
                        <TrashIcon />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Consider using an archive
                        flow if you might need recovery.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DsShowcase>
            </DsSection>

            <DsSection
              id="fragments-news-card"
              title="Fragments · News card"
              description="Card-row used in Terminal feed; extracted here with static data."
            >
              <div className="grid gap-3">
                <DsShowcase title="Feed rows">
                  <div className="grid gap-2">
                    <TerminalNewsCard
                      active
                      title="META_PREBUYS_120MW_VA"
                      region="US & Canada"
                      signal="important"
                      tags={[
                        { type: "company", label: "META" },
                        { type: "topic", label: "POWER" },
                      ]}
                    />
                    <TerminalNewsCard
                      striped
                      title="H100_SPOT_PRICE_SOFTENS"
                      region="Europe"
                      signal="standard"
                      tags={[
                        { type: "company", label: "NVIDIA" },
                        { type: "topic", label: "GPU" },
                      ]}
                    />
                    <TerminalNewsCard
                      title="SUBSEA_CAPEX_INDEX_UPTICK"
                      region="APAC"
                      signal="minor"
                      tags={[{ type: "topic", label: "NETWORK" }]}
                    />
                  </div>
                </DsShowcase>
              </div>
            </DsSection>

            <DsSection
              id="fragments-tldr-container"
              title="Fragments · TL;DR container"
              description="The TLDR box used on Terminal details, shown here with static bullets."
            >
              <DsShowcase title="TL;DR container">
                <TldrContainer />
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
                    <Button size="icon-lg" aria-label="News">
                      <NewspaperIcon />
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
