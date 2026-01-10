"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
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
  SidebarSeparator,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: HouseIcon },
  { title: "Tickets", href: "/client", icon: TicketIcon },
]

function isActivePath(pathname: string, href: string) {
  if (pathname === href) return true
  return pathname.startsWith(`${href}/`)
}

export function AppSidebar({ className, ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn(className)}
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Dashboard"
              render={<Link href="/dashboard" />}
              className="group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-2"
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

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActivePath(pathname, item.href)}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <div className="px-2 py-1 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
          OpsKings Support
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
