import { desc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import { tickets } from "@/lib/db/schema/tickets"
import { ticketTypes } from "@/lib/db/schema/ticket-types"

export const metadata: Metadata = {
  title: "Client",
  description: "View and track recent tickets for your account.",
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
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = appUserRows[0] ?? null
  if (!appUser || appUser.accountStatus !== "active") {
    redirect("/no-access")
  }

  if (appUser.userType !== "client" || !appUser.clientId) {
    redirect("/")
  }

  const recentTickets = await db
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
    .where(eq(tickets.clientId, appUser.clientId))
    .orderBy(desc(tickets.createdAt), desc(tickets.id))
    .limit(25)

  return (
    <main className="w-full space-y-6 px-6 py-8">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Your tickets</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Recent tickets for your account.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-right font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentTickets.length ? (
                recentTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60"
                  >
                    <td className="px-4 py-3 font-medium">{ticket.title}</td>
                    <td className="px-4 py-3">{ticket.ticketType}</td>
                    <td className="px-4 py-3">{ticket.status ?? "—"}</td>
                    <td className="px-4 py-3">{ticket.priority ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    No tickets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
