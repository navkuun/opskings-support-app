import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { TicketsPageClient } from "@/components/tickets/tickets-page-client"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const metadata: Metadata = {
  title: "Tickets",
  description: "View and track tickets.",
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
      clientId: appUsers.clientId,
      teamMemberId: appUsers.teamMemberId,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    redirect("/no-access")
  }

  const isInternal = appUser.userType === "internal"

  if (isInternal && !appUser.teamMemberId) {
    redirect("/no-access")
  }

  if (!isInternal && !appUser.clientId) {
    redirect("/no-access")
  }

  return (
    <main className="w-full">
      <TicketsPageClient
        userType={appUser.userType}
        teamMemberId={appUser.teamMemberId ?? null}
      />
    </main>
  )
}
