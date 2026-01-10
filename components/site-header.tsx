"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { LifebuoyIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"

function toTitleCase(input: string) {
  return input
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function getHeaderTitle(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/"
  const explicit: Record<string, string> = {
    "/": "OpsKings Support",
    "/dashboard": "Dashboard",
    "/tickets": "Tickets",
    "/no-access": "No access",
    "/protected": "Protected",
    "/design-system": "Design system",
  }

  if (explicit[normalized]) return explicit[normalized]

  const segment = normalized.split("/").filter(Boolean)[0]
  if (!segment) return "OpsKings Support"
  return toTitleCase(segment)
}

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname()
  const resolvedTitle = React.useMemo(
    () => title ?? getHeaderTitle(pathname),
    [pathname, title]
  )

  const [helpOpen, setHelpOpen] = React.useState(false)
  const [helpMessage, setHelpMessage] = React.useState("")
  const [helpError, setHelpError] = React.useState<string | null>(null)
  const [isSending, setIsSending] = React.useState(false)

  const onSubmitHelp = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const message = helpMessage.trim()
      if (!message) {
        setHelpError("Please enter a message.")
        return
      }

      setHelpError(null)
      setIsSending(true)
      try {
        const res = await fetch("/api/help", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message, page: pathname }),
        })

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as unknown
          const error =
            json && typeof json === "object" && "error" in json
              ? (json as { error?: unknown }).error
              : null
          throw new Error(
            typeof error === "string" && error.trim()
              ? error
              : "Failed to send help request."
          )
        }

        setHelpMessage("")
        setHelpOpen(false)
        toastManager.add({
          title: "Message sent",
          description: "We’ll get back to you soon.",
          type: "success",
        })
      } catch (error) {
        setHelpError(
          error instanceof Error ? error.message : "Failed to send help request."
        )
      } finally {
        setIsSending(false)
      }
    },
    [helpMessage, pathname]
  )

  return (
    <header className="bg-background flex h-(--header-height) shrink-0 items-center justify-between gap-3 border-b border-border px-4">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="truncate text-sm font-semibold tracking-wide">
          {resolvedTitle}
        </div>
      </div>

      <Popover open={helpOpen} onOpenChange={setHelpOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className={cn(
                "relative inline-flex h-8 shrink-0 items-center justify-center bg-transparent uppercase pl-3 pr-8 text-xs font-bold  tracking-tight text-white outline-none",
                "focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "hover:[&_[data-tab-shape]]:fill-destructive/90"
              )}
            />
          }
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
          >
            <polygon
              data-tab-shape
              vectorEffect="non-scaling-stroke"
              points="0,0 88,0 100,32 0,32"
              className="fill-destructive stroke-destructive/70 transition-colors"
              strokeWidth="1"
            />
          </svg>
          <span className="relative inline-flex items-center gap-2">
            <LifebuoyIcon aria-hidden="true" className="size-4" />
            Need help?
          </span>
        </PopoverTrigger>

        <PopoverPopup align="end" className="w-[min(92vw,24rem)]">
          <div className="space-y-1">
            <PopoverTitle className="text-base">Need help?</PopoverTitle>
            <PopoverDescription className="text-xs">
              Send a message to the OpsKings Support team.
            </PopoverDescription>
          </div>

          <form className="mt-4 grid gap-3" onSubmit={onSubmitHelp}>
            <Field>
              <FieldLabel htmlFor="need-help-message">Message</FieldLabel>
              <Textarea
                id="need-help-message"
                value={helpMessage}
                onChange={(e) => setHelpMessage(e.target.value)}
                placeholder="Tell us what you’re trying to do and what went wrong."
                rows={5}
              />
            </Field>

            {helpError ? (
              <div className="text-xs text-destructive">{helpError}</div>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSending}>
                {isSending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        </PopoverPopup>
      </Popover>
    </header>
  )
}
