import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

import { DashboardClient } from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Ticket analytics and operational metrics.",
}

export const runtime = "nodejs"

export default async function Page() {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    redirect("/")
  }

  const appUserRows = await db
    .select({
      accountStatus: appUsers.accountStatus,
      userType: appUsers.userType,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    redirect("/no-access")
  }

  if (appUser.userType !== "internal") {
    redirect("/tickets")
  }

  return <DashboardClient />
}
