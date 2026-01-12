"use client"

import * as React from "react"
import { MagnifyingGlassIcon } from "@phosphor-icons/react"

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
import type { NumericFilterOp, NumericFilterState } from "@/lib/team-performance/filters"
import { isString } from "@/lib/type-guards"

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
  step,
  onValueChange,
}: {
  label: string
  value: NumericFilterState
  step?: number
  onValueChange: (patch: NumericFilterPatch) => void
}) {
  const showBetween = value.op === "between"
  const showNumber =
    value.op !== "any" && value.op !== "between" && value.op !== "is_empty" && value.op !== "is_not_empty"

  const showInputs = value.op === "between" || showNumber

  return (
    <InputGroup className="h-full w-full rounded-none border-0 bg-transparent shadow-none">
      <InputGroupAddon align="inline-start" className="pl-3 pr-0 gap-2">
        <InputGroupText className="text-muted-foreground/72">{label}</InputGroupText>
        <Select
          value={value.op}
          onValueChange={(next) =>
            onValueChange({ op: (next ?? "any") as NumericFilterOp, a: "", b: "" })
          }
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
              <SelectItem value="is_empty">{numericOperatorLabel.is_empty}</SelectItem>
              <SelectItem value="is_not_empty">{numericOperatorLabel.is_not_empty}</SelectItem>
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
            inputMode="decimal"
            step={step}
            value={value.a}
            placeholder={showBetween ? "Min" : "Value"}
            onChange={(e) => onValueChange({ a: e.target.value })}
            className="text-xs placeholder:text-muted-foreground/72"
          />
          {showBetween ? (
            <InputGroupInput
              aria-label={`${label} filter max`}
              size="lg"
              unstyled
              type="number"
              inputMode="decimal"
              step={step}
              value={value.b}
              placeholder="Max"
              onChange={(e) => onValueChange({ b: e.target.value })}
              className="text-xs placeholder:text-muted-foreground/72"
            />
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

function renderSingleSelectValue({
  value,
  placeholder,
}: {
  value: unknown
  placeholder: string
}) {
  if (!isString(value) || !value.trim() || value === "any") {
    return <span className="text-muted-foreground/72">{placeholder}</span>
  }

  if (value === "none") return "No plan"
  return value
}

export function ClientAnalysisFilterRow({
  query,
  plan,
  planOptions,
  totalSpent,
  onQueryChange,
  onPlanChange,
  onTotalSpentChange,
  onReset,
}: {
  query: string
  plan: string
  planOptions: readonly string[]
  totalSpent: NumericFilterState
  onQueryChange: (next: string) => void
  onPlanChange: (next: string) => void
  onTotalSpentChange: (patch: NumericFilterPatch) => void
  onReset: () => void
}) {
  return (
    <CardGroup className="rounded-none border-x-0 border-t-0 [&_[data-corner]]:hidden">
      <div className="divide-y divide-border">
        <div className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
          <div className="col-span-2 flex h-10 items-stretch md:col-span-3">
            <InputGroup className="h-full rounded-none border-0 bg-transparent shadow-none">
              <InputGroupAddon align="inline-start" className="pl-3 pr-0">
                <InputGroupText className="text-muted-foreground/72">
                  <MagnifyingGlassIcon className="size-3.5" aria-hidden="true" />
                </InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label="Search clients"
                size="lg"
                unstyled
                value={query}
                placeholder="Search clients…"
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="col-span-2 flex h-10 items-stretch md:col-span-1">
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

        <div className="grid grid-cols-2 divide-x divide-y divide-border md:divide-y-0 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <div className="flex h-10 items-stretch">
            <Select value={plan} onValueChange={(next) => onPlanChange(next ?? "any")}>
              <SelectTrigger size="lg" className="w-full rounded-none border-0 bg-transparent">
                <SelectValue>
                  {(value: unknown) =>
                    renderSingleSelectValue({ value, placeholder: "Plan type…" })
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  <SelectItem value="any">All plans</SelectItem>
                  <SelectItem value="none">No plan</SelectItem>
                  {planOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 flex h-10 items-stretch">
            <NumericFilterSegment
              label="Total spent"
              value={totalSpent}
              step={0.01}
              onValueChange={onTotalSpentChange}
            />
          </div>
        </div>
      </div>
    </CardGroup>
  )
}
