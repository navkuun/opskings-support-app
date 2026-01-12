import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  const authUserId = session?.user?.id ?? null
  const userType =
    authUserId
      ? (
          await db
            .select({ userType: appUsers.userType })
            .from(appUsers)
            .where(eq(appUsers.authUserId, authUserId))
            .limit(1)
        )[0]?.userType ?? null
      : null

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 16)",
        } as React.CSSProperties
      }
    >
      <AppSidebar initialUserType={userType} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
