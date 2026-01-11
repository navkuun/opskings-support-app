import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { TicketDetailsPageClient } from "@/components/tickets/ticket-details-page-client"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const metadata: Metadata = {
  title: "Ticket",
  description: "View ticket details.",
}

export const runtime = "nodejs"

type PageParams = { id: string }

export default async function Page({
  params,
}: {
  params: PageParams | Promise<PageParams>
}) {
  const { id } = await params
  const ticketId = Number(id)
  if (!Number.isFinite(ticketId) || !Number.isInteger(ticketId) || ticketId <= 0) {
    redirect("/tickets")
  }

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
      internalRole: appUsers.internalRole,
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
      <TicketDetailsPageClient
        ticketId={ticketId}
        userType={appUser.userType}
        internalRole={appUser.internalRole ?? null}
        teamMemberId={appUser.teamMemberId ?? null}
        clientId={appUser.clientId ?? null}
      />
    </main>
  )
}
