"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ClockIcon,
  HouseIcon,
  type IconProps,
  type IconWeight,
  UsersIcon,
  TicketIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { isRecord } from "@/lib/type-guards"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { authClient } from "@/lib/auth-client"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<IconProps>
  iconWeight?: IconWeight
}

type NavGroup = {
  label: string
  items: NavItem[]
}

type AppUserMeResponse = {
  userType: "internal" | "client"
}

function parseAppUserMeResponse(value: unknown): AppUserMeResponse | null {
  if (!isRecord(value)) return null
  const userType = value.userType
  if (userType !== "internal" && userType !== "client") return null
  return { userType }
}

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

function CrownSidebarMenuLink({
  item,
  isActive,
}: {
  item: NavItem
  isActive: boolean
}) {
  const Icon = item.icon

  return (
    <SidebarMenuButton
      tooltip={item.title}
      isActive={isActive}
      render={<Link href={item.href} />}
      className={cn(
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-md group-data-[collapsible=icon]:border-l-0",
        "h-8 justify-start gap-2 rounded-none border-l-[0.2rem] border-transparent bg-transparent py-1.5 pl-[14px] pr-4 text-xs font-normal text-sidebar-foreground/60",
        "hover:bg-sidebar-accent/20 hover:text-sidebar-foreground",
        "data-active:border-primary data-active:bg-zinc-200 dark:data-active:bg-zinc-800 data-active:text-sidebar-foreground data-active:font-semibold"
      )}
    >
      <Icon
        weight={item.iconWeight}
        className={cn(
          "size-4 shrink-0",
          isActive ? "text-primary" : "text-sidebar-foreground/50"
        )}
        aria-hidden="true"
      />
      <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
    </SidebarMenuButton>
  )
}

export function AppSidebar({
  className,
  initialUserType,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  initialUserType?: "internal" | "client" | null
}) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const [userType, setUserType] = React.useState<"internal" | "client" | null>(
    initialUserType ?? null,
  )

  React.useEffect(() => {
    let cancelled = false

    async function loadUserType() {
      if (!session?.user || userType) return

      try {
        const res = await fetch("/api/app-user/me", { cache: "no-store" })
        if (!res.ok) return
        const json: unknown = await res.json()
        const parsed = parseAppUserMeResponse(json)
        if (!parsed) return
        if (cancelled) return
        setUserType(parsed.userType)
      } catch {
        // Ignore; navigation still works with defaults.
      }
    }

    void loadUserType()
    return () => {
      cancelled = true
    }
  }, [session?.user, userType])

  const homeHref = userType === "client" ? "/tickets" : userType === "internal" ? "/dashboard" : "/tickets"
  const homeLabel =
    userType === "client" ? "Your Tickets" : userType === "internal" ? "Dashboard" : "Loading"

  const navGroups = React.useMemo<NavGroup[]>(() => {
    if (!userType) return []
    if (userType === "client") {
      return [
        {
          label: "Support",
          items: [
            {
              title: "Your Tickets",
              href: "/tickets",
              icon: TicketIcon,
              iconWeight: "fill",
            },
          ],
        },
      ]
    }

    return [
      {
        label: "General",
        items: [
          {
            title: "Dashboard",
            href: "/dashboard",
            icon: HouseIcon,
            iconWeight: "fill",
          },
          {
            title: "Response time",
            href: "/response-time",
            icon: ClockIcon,
            iconWeight: "fill",
          },
          {
            title: "Teams",
            href: "/teams",
            icon: UsersIcon,
            iconWeight: "fill",
          },
        ],
      },
      {
        label: "Support",
        items: [
          {
            title: "Tickets",
            href: "/tickets",
            icon: TicketIcon,
            iconWeight: "fill",
          },
        ],
      },
    ]
  }, [userType])

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn("border-sidebar-border/60", className)}
      {...props}
    >
      <SidebarHeader className="border-sidebar-border/60 border-b px-4 pt-4 pb-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={homeLabel}
              render={<Link href={homeHref} />}
              className={cn(
                "h-auto justify-start bg-transparent p-0 hover:bg-transparent",
                "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-0"
              )}
            >
              <Image
                src="/logo.webp"
                alt="OpsKings Support"
                width={28}
                height={28}
                priority
                className="rounded-sm"
              />
              <span className="sr-only">{homeLabel}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {userType ? (
          navGroups.map((group, idx) => (
          <SidebarGroup
            key={group.label}
            className="px-0 py-2 group-data-[collapsible=icon]:px-2"
          >
            <SidebarGroupLabel className="h-6 rounded-none px-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <CrownSidebarMenuLink
                      item={item}
                      isActive={isActivePath(pathname, item.href)}
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
            {idx < navGroups.length - 1 ? (
              <SidebarSeparator className="mx-0 mt-2" />
            ) : null}
          </SidebarGroup>
          ))
        ) : (
          <div className="px-4 py-3 text-xs text-sidebar-foreground/40">Loading…</div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/60 border-t px-4 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
        {session?.user ? (
          <NavUser
            user={{
              name: session.user.name ?? "User",
              email: session.user.email,
              avatar: session.user.image,
            }}
          />
        ) : null}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
