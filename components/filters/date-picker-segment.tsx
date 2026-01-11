"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function formatDateLabel(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function parseYmdDate(value: string): Date | null {
  const [yStr, mStr, dStr] = value.split("-")
  const year = Number(yStr)
  const month = Number(mStr)
  const day = Number(dStr)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

function formatDateToYmd(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function DatePickerSegment({
  id,
  prefix,
  value,
  onValueChange,
}: {
  id: string
  prefix: "From" | "To"
  value: string
  onValueChange: (next: string) => void
}) {
  const [open, setOpen] = React.useState(false)

  const date = React.useMemo(() => parseYmdDate(value) ?? undefined, [value])
  const [month, setMonth] = React.useState<Date | undefined>(date)

  React.useEffect(() => {
    setMonth(date)
  }, [date])

  return (
    <div className="relative flex w-full items-stretch">
      <Popover open={open} onOpenChange={setOpen}>
        <InputGroup className="h-full rounded-none border-0 bg-transparent shadow-none">
          <InputGroupAddon align="inline-start" className="pl-3 pr-0">
            <InputGroupText className="text-muted-foreground/72">{prefix}:</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            id={id}
            aria-label={`${prefix} date`}
            size="sm"
            unstyled
            value={formatDateLabel(date)}
            placeholder="Jan 01, 2025"
            className="text-xs text-muted-foreground/72"
            readOnly
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setOpen(true)
              }
            }}
          />
          <InputGroupAddon align="inline-end" className="pr-1">
            <PopoverTrigger render={<InputGroupButton variant="ghost" size="icon-xs" />}>
              <CalendarIcon className="size-3.5" aria-hidden="true" />
              <span className="sr-only">Select date</span>
            </PopoverTrigger>
          </InputGroupAddon>
        </InputGroup>

        <PopoverContent align="end" alignOffset={-8} sideOffset={10} className="w-auto">
          <div className="-mx-4 -my-4">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(next) => {
                if (!next) return
                onValueChange(formatDateToYmd(next))
                setOpen(false)
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
