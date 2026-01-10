"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { SidebarTrigger } from "@/components/ui/sidebar"

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
    "/client": "Client",
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

  return (
    <header className="bg-background flex h-(--header-height) shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="text-sm font-semibold tracking-wide">{resolvedTitle}</div>
    </header>
  )
}
