"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CaretDownIcon,
  HouseIcon,
  TicketIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"
import { authClient } from "@/lib/auth-client"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  endIcon?: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: HouseIcon },
  { title: "Tickets", href: "/client", icon: TicketIcon },
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
        "h-10 !items-stretch gap-0 overflow-visible rounded-none p-0 text-sm",
        "hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit",
        "data-active:bg-transparent data-active:text-inherit",
        "group-data-[collapsible=icon]:p-2!"
      )}
    >
      <span
        className={cn(
          "hidden size-full items-center justify-center group-data-[collapsible=icon]:flex",
          isActive
            ? "rounded-md bg-primary text-primary-foreground"
            : "rounded-md text-sidebar-foreground/60 dark:text-white group-hover/menu-button:text-sidebar-foreground dark:group-hover/menu-button:text-white"
        )}
      >
        <Icon
          className={cn(
            "size-5 shrink-0 transition-colors",
            isActive ? "text-primary-foreground" : "text-current"
          )}
        />
        <span className="sr-only">{item.title}</span>
      </span>

      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 px-3 py-2 transition-colors group-data-[collapsible=icon]:hidden",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-sidebar-accent/20 text-sidebar-foreground/70 dark:text-white group-hover/menu-button:bg-sidebar-accent/30 group-hover/menu-button:text-sidebar-foreground dark:group-hover/menu-button:text-white"
        )}
      >
        <Icon
          className={cn(
            "size-4 shrink-0 transition-opacity",
            isActive ? "opacity-100" : "opacity-80"
          )}
        />
        <span className="truncate">{item.title}</span>
      </div>

      <div className="relative w-13 shrink-0 self-stretch group-data-[collapsible=icon]:hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={cn(
            "!h-full !w-full fill-current transition-colors",
            isActive
              ? "text-primary"
              : "text-sidebar-accent/20 group-hover/menu-button:text-sidebar-accent/30"
          )}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <polygon points="0,0 100,0 70,25 100,50 70,75 100,100 0,100" />
        </svg>

      </div>
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
      <SidebarHeader className="px-4 py-6">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Dashboard"
              render={<Link href="/dashboard" />}
              className={cn(
                "h-auto justify-start bg-transparent p-0 hover:bg-transparent",
                "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-2"
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
        <SidebarGroup className="px-4">
          <SidebarGroupContent className="text-sm">
            <SidebarMenu className="gap-2">
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <CrownSidebarMenuLink
                    item={{
                      ...item,
                      endIcon: item.endIcon ?? CaretDownIcon,
                    }}
                    isActive={isActivePath(pathname, item.href)}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
