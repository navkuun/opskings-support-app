import { desc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import { clients } from "@/lib/db/schema/clients"
import { tickets } from "@/lib/db/schema/tickets"
import { ticketTypes } from "@/lib/db/schema/ticket-types"

import { TicketsTable, type ClientTicketRow } from "./tickets-table"

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
      internalRole: appUsers.internalRole,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    redirect("/no-access")
  }

  const isInternal = appUser.userType === "internal"
  const showClient = isInternal

  if (!isInternal && !appUser.clientId) {
    redirect("/no-access")
  }

  const heading = isInternal ? "Tickets" : "Your tickets"
  const description = isInternal
    ? "Recent tickets across all clients."
    : "Recent tickets for your account."

  let tableTickets: ClientTicketRow[] = []

  if (isInternal) {
    const rows = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        createdAt: tickets.createdAt,
        ticketType: ticketTypes.typeName,
        clientName: clients.clientName,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .innerJoin(clients, eq(tickets.clientId, clients.id))
      .orderBy(desc(tickets.createdAt), desc(tickets.id))
      .limit(200)

    tableTickets = rows.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status ?? null,
      priority: ticket.priority ?? null,
      createdAt: ticket.createdAt ? ticket.createdAt.toISOString() : null,
      ticketType: ticket.ticketType,
      clientName: ticket.clientName,
    }))
  } else {
    const rows = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        createdAt: tickets.createdAt,
        ticketType: ticketTypes.typeName,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(eq(tickets.clientId, appUser.clientId!))
      .orderBy(desc(tickets.createdAt), desc(tickets.id))
      .limit(200)

    tableTickets = rows.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      status: ticket.status ?? null,
      priority: ticket.priority ?? null,
      createdAt: ticket.createdAt ? ticket.createdAt.toISOString() : null,
      ticketType: ticket.ticketType,
      clientName: null,
    }))
  }

  return (
    <main className="w-full space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <TicketsTable tickets={tableTickets} showClient={showClient} />
    </main>
  )
}
