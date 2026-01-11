"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { LifebuoyIcon, MoonIcon, SidebarIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import { AppCommandPalette } from "@/components/app-command-palette"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import { Field, FieldLabel } from "@/components/ui/field"
import { cn } from "@/lib/utils"
import { isRecord } from "@/lib/type-guards"

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

function HeaderIconButton({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size">) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "!h-full !w-(--header-height) !rounded-none !px-0",
        "!border-0 bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function HeaderIconButtonDivider({
  side,
  className,
  ...props
}: Omit<React.ComponentProps<typeof HeaderIconButton>, "className"> & {
  side: "left" | "right"
  className?: string
}) {
  const dividerClasses =
    side === "left"
      ? "!border-y-0 !border-r-0 !border-l !border-border first:!border-l-0"
      : "!border-y-0 !border-l-0 !border-r !border-border"

  return <HeaderIconButton className={cn(dividerClasses, className)} {...props} />
}

function SidebarToggleButton() {
  const { toggleSidebar } = useSidebar()

  return (
    <HeaderIconButtonDivider
      side="right"
      aria-label="Toggle sidebar"
      onClick={toggleSidebar}
    >
      <SidebarIcon aria-hidden="true" className="size-5" />
    </HeaderIconButtonDivider>
  )
}

function ThemeToggleButton() {
  const { setTheme } = useTheme()

  return (
    <HeaderIconButtonDivider
      side="left"
      aria-label="Toggle theme"
      onClick={() => {
        const isDark = document.documentElement.classList.contains("dark")
        setTheme(isDark ? "light" : "dark")
      }}
    >
      <SunIcon className="size-5 dark:hidden" aria-hidden="true" />
      <MoonIcon className="hidden size-5 dark:block" aria-hidden="true" />
    </HeaderIconButtonDivider>
  )
}

function NeedHelpPopover({ page }: { page: string }) {
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
          body: JSON.stringify({ message, page }),
        })

        if (!res.ok) {
          const json: unknown = await res.json().catch(() => null)
          const error = isRecord(json) ? json.error : null
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
    [helpMessage, page]
  )

  return (
    <Popover open={helpOpen} onOpenChange={setHelpOpen}>
      <PopoverTrigger
        render={
          <HeaderIconButtonDivider side="left" aria-label="Need help" title="Need help" />
        }
      >
        <LifebuoyIcon aria-hidden="true" className="size-5" />
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

          {helpError ? <div className="text-xs text-destructive">{helpError}</div> : null}

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
  )
}

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname()
  const resolvedTitle = React.useMemo(
    () => title ?? getHeaderTitle(pathname),
    [pathname, title]
  )

  return (
    <header className="bg-background flex h-(--header-height) shrink-0 items-stretch justify-between border-b border-border pl-0 pr-0">
      <div className="flex min-w-0 items-stretch">
        <SidebarToggleButton />
        <div className="flex min-w-0 items-center px-4">
          <div className="truncate text-sm font-semibold tracking-wide">
            {resolvedTitle}
          </div>
        </div>
      </div>

      <div className="flex h-full items-stretch border-l border-border">
        <AppCommandPalette />
        <ThemeToggleButton />
        <NeedHelpPopover page={pathname} />
      </div>
    </header>
  )
}
