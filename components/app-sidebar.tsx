"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  HouseIcon,
  type IconProps,
  type IconWeight,
  TicketIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
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

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: HouseIcon,
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

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

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
              tooltip="Dashboard"
              render={<Link href="/dashboard" />}
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
              <span className="sr-only">Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        {NAV_GROUPS.map((group, idx) => (
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
            {idx < NAV_GROUPS.length - 1 ? (
              <SidebarSeparator className="mx-0 mt-2" />
            ) : null}
          </SidebarGroup>
        ))}
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
