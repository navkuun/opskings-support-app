"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  DotsThreeVerticalIcon,
  SignOutIcon,
} from "@phosphor-icons/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { isRecord } from "@/lib/type-guards"
import { formatTeamMemberLabel } from "@/lib/dashboard/utils"

function getInitials(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return "?"

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase()
}

function formatRole(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

type AppUserMeResponse = {
  userType: "internal" | "client"
  internalRole: "support_agent" | "manager" | "admin" | null
}

function parseAppUserMeResponse(value: unknown): AppUserMeResponse | null {
  if (!isRecord(value)) return null

  const userType = value.userType
  const internalRole = value.internalRole

  if (userType !== "internal" && userType !== "client") return null
  if (
    internalRole !== null &&
    internalRole !== "support_agent" &&
    internalRole !== "manager" &&
    internalRole !== "admin"
  ) {
    return null
  }

  return { userType, internalRole }
}

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [role, setRole] = React.useState<string | null>(null)

  const displayName = user.name
    ? formatTeamMemberLabel(user.name).trim() || "User"
    : "User"
  const initials = getInitials(displayName || user.email)

  React.useEffect(() => {
    let cancelled = false

    async function loadRole() {
      try {
        const res = await fetch("/api/app-user/me", {
          cache: "no-store",
        })
        if (!res.ok) return

        const json: unknown = await res.json()
        const data = parseAppUserMeResponse(json)
        if (!data) return
        const formattedRole =
          data.userType === "client"
            ? "Client"
            : data.internalRole
              ? formatRole(data.internalRole)
              : null

        if (!cancelled) {
          setRole(formattedRole)
        }
      } catch {
        // Ignore role fetch errors; user menu still works without it.
      }
    }

    void loadRole()
    return () => {
      cancelled = true
    }
  }, [])

  const onSignOut = React.useCallback(async () => {
    if (isSigningOut) return

    setIsSigningOut(true)
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/")
            router.refresh()
          },
        },
      })
    } finally {
      setIsSigningOut(false)
    }
  }, [isSigningOut, router])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="h-auto data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0"
              />
            }
          >
            <Avatar className="size-8 rounded-lg grayscale">
              <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col items-start text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <div className="flex min-w-0 flex-1 flex-col items-start text-left text-sm leading-tight">
                  <div className="flex items-center gap-2 mb-1">
                  <span className="truncate dark:text-white font-medium text-xs">{displayName}</span>
                   {role ? (
                    <Badge variant="outline" className="h-4 border-border rounded-none uppercase border-dashed">
                      {role}
                    </Badge>
                  ) : null}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
            </div>
            <DotsThreeVerticalIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user.avatar ?? undefined} alt={displayName} />
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col items-start text-left text-sm leading-tight">
                  <div className="flex items-center gap-2 mb-1">
                  <span className="truncate dark:text-white font-medium text-xs">{displayName}</span>
                   {role ? (
                    <Badge variant="outline" className="h-4 border-border rounded-none uppercase border-dashed">
                      {role}
                    </Badge>
                  ) : null}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onSignOut} disabled={isSigningOut}>
              <SignOutIcon />
              {isSigningOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
