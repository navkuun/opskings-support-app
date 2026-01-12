"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { DatePickerSegment } from "@/components/filters/date-picker-segment"
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
import type { NumericFilterOp, NumericFilterState } from "@/lib/team-performance/filters"
import { isString } from "@/lib/type-guards"
import { cn } from "@/lib/utils"

export type TeamsFilterState = {
  from: string
  to: string
  teamMember: string
  ticketsAssigned: NumericFilterState
  ticketsResolved: NumericFilterState
  avgResolutionHours: NumericFilterState
  avgRating: NumericFilterState
  status: string
}

type NumericFilterPatch = Partial<Pick<NumericFilterState, "op" | "a" | "b">>

const numericOperatorLabel: Record<NumericFilterOp, string> = {
  any: "Any",
  eq: "is",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  between: "between",
  is_empty: "is empty",
  is_not_empty: "is not empty",
}

function NumericFilterSegment({
  label,
  value,
  onValueChange,
  allowEmptyOperators,
  step,
  className,
}: {
  label: string
  value: NumericFilterState
  onValueChange: (patch: NumericFilterPatch) => void
  allowEmptyOperators?: boolean
  step?: number
  className?: string
}) {
  const showBetween = value.op === "between"
  const showNumber =
    value.op !== "any" && value.op !== "between" && value.op !== "is_empty" && value.op !== "is_not_empty"

  const showInputs = value.op === "between" || showNumber

  return (
    <InputGroup
      className={cn("h-full rounded-none border-0 bg-transparent shadow-none", className)}
    >
      <InputGroupAddon align="inline-start" className="pl-3 pr-0 gap-2">
        <InputGroupText className="text-muted-foreground/72">{label}</InputGroupText>
        <Select
          value={value.op}
          onValueChange={(next) => onValueChange({ op: (next ?? "any") as NumericFilterOp, a: "", b: "" })}
        >
          <SelectTrigger
            size="sm"
            className="h-6 w-[7.25rem] rounded-md border border-border/60 bg-background/60 px-2 text-[0.6875rem] text-muted-foreground shadow-none"
          >
            <SelectValue>{numericOperatorLabel[value.op]}</SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              <SelectItem value="any">{numericOperatorLabel.any}</SelectItem>
              <SelectItem value="eq">{numericOperatorLabel.eq}</SelectItem>
              <SelectItem value="gt">{numericOperatorLabel.gt}</SelectItem>
              <SelectItem value="gte">{numericOperatorLabel.gte}</SelectItem>
              <SelectItem value="lt">{numericOperatorLabel.lt}</SelectItem>
              <SelectItem value="lte">{numericOperatorLabel.lte}</SelectItem>
              <SelectItem value="between">{numericOperatorLabel.between}</SelectItem>
              {allowEmptyOperators ? (
                <>
                  <SelectItem value="is_empty">{numericOperatorLabel.is_empty}</SelectItem>
                  <SelectItem value="is_not_empty">{numericOperatorLabel.is_not_empty}</SelectItem>
                </>
              ) : null}
            </SelectGroup>
          </SelectContent>
        </Select>
      </InputGroupAddon>

      {showInputs ? (
        <>
          <InputGroupInput
            aria-label={`${label} filter value`}
            size="lg"
            unstyled
            type="number"
            inputMode="numeric"
            step={step}
            value={value.a}
            placeholder={showBetween ? "Min" : "Value"}
            onChange={(e) => onValueChange({ a: e.target.value })}
            className="text-xs placeholder:text-muted-foreground/72"
          />
          {showBetween ? (
            <>
              <InputGroupInput
                aria-label={`${label} filter max`}
                size="lg"
                unstyled
                type="number"
                inputMode="numeric"
                step={step}
                value={value.b}
                placeholder="Max"
                onChange={(e) => onValueChange({ b: e.target.value })}
                className="text-xs placeholder:text-muted-foreground/72"
              />
            </>
          ) : null}
        </>
      ) : (
        <InputGroupInput
          aria-label={`${label} filter value`}
          size="lg"
          unstyled
          value=""
          placeholder="—"
          readOnly
          className="text-xs text-muted-foreground/50"
        />
      )}
    </InputGroup>
  )
}

export function TeamsFilterRow({
  value,
  statusOptions,
  onValueChange,
  onReset,
}: {
  value: TeamsFilterState
  statusOptions: readonly string[]
  onValueChange: (patch: Partial<TeamsFilterState>) => void
  onReset: () => void
}) {
  return (
    <CardGroup className="rounded-none border-x-0 border-t-0 [&_[data-corner]]:hidden">
      <div className="divide-y divide-border">
        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 md:divide-y-0">
          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
            <InputGroup className="h-full rounded-none border-0 bg-transparent shadow-none">
              <InputGroupAddon align="inline-start" className="pl-3 pr-0">
                <InputGroupText className="text-muted-foreground/72">
                  <MagnifyingGlassIcon className="size-3.5" aria-hidden="true" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search team members"
                size="lg"
                unstyled
                value={value.teamMember}
                placeholder="Search team members…"
                onChange={(e) => onValueChange({ teamMember: e.target.value })}
              />
            </InputGroup>
          </div>

          <div className="flex h-10 items-stretch">
            <DatePickerSegment
              id="teams-from"
              prefix="From"
              value={value.from}
              onValueChange={(from) => onValueChange({ from })}
            />
          </div>
          <div className="flex h-10 items-stretch">
            <DatePickerSegment
              id="teams-to"
              prefix="To"
              value={value.to}
              onValueChange={(to) => onValueChange({ to })}
            />
          </div>
          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
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

        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-5 md:divide-y-0">
          <div className="flex h-10 items-stretch">
            <NumericFilterSegment
              label="Assigned"
              value={value.ticketsAssigned}
              onValueChange={(patch) =>
                onValueChange({
                  ticketsAssigned: {
                    ...value.ticketsAssigned,
                    ...patch,
                  },
                })
              }
              step={1}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <NumericFilterSegment
              label="Resolved"
              value={value.ticketsResolved}
              onValueChange={(patch) =>
                onValueChange({
                  ticketsResolved: {
                    ...value.ticketsResolved,
                    ...patch,
                  },
                })
              }
              step={1}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <NumericFilterSegment
              label="Avg hrs"
              value={value.avgResolutionHours}
              onValueChange={(patch) =>
                onValueChange({
                  avgResolutionHours: {
                    ...value.avgResolutionHours,
                    ...patch,
                  },
                })
              }
              allowEmptyOperators
              step={0.1}
            />
          </div>

          <div className="flex h-10 items-stretch">
            <NumericFilterSegment
              label="Rating"
              value={value.avgRating}
              onValueChange={(patch) =>
                onValueChange({
                  avgRating: {
                    ...value.avgRating,
                    ...patch,
                  },
                })
              }
              allowEmptyOperators
              step={0.1}
            />
          </div>

          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
            <Select value={value.status} onValueChange={(next) => onValueChange({ status: next ?? "all" })}>
              <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
                <SelectValue>
                  {(val: unknown) => {
                    if (!isString(val) || !val.trim() || val === "all") {
                      return <span className="text-muted-foreground/72">All status</span>
                    }
                    return formatTeamMemberLabel(val)
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  <SelectItem value="all">All status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatTeamMemberLabel(status)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardGroup>
  )
}
