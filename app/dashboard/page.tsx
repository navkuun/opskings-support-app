import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UserButton } from "@/components/auth/user-button"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"
import { clients } from "@/lib/db/schema/clients"

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
    redirect("/client")
  }

  const recentClients = await db
    .select({
      id: clients.id,
      clientName: clients.clientName,
      email: clients.email,
      status: clients.status,
      planType: clients.planType,
      monthlyBudget: clients.monthlyBudget,
      createdAt: clients.createdAt,
    })
    .from(clients)
    .orderBy(desc(clients.id))
    .limit(12)

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  })

  return (
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold tracking-wide">OpsKings Support</div>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">Clients</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Most recent clients in the database.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Client</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Plan</th>
                  <th className="px-4 py-3 text-right font-medium">Budget</th>
                  <th className="px-4 py-3 text-right font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentClients.length ? (
                  recentClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60"
                    >
                      <td className="px-4 py-3 font-medium">{client.clientName}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {client.email}
                      </td>
                      <td className="px-4 py-3">{client.status ?? "—"}</td>
                      <td className="px-4 py-3">{client.planType ?? "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {client.monthlyBudget == null
                          ? "—"
                          : money.format(client.monthlyBudget)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-600 tabular-nums dark:text-zinc-400">
                        {client.createdAt
                          ? new Date(client.createdAt).toLocaleString()
                          : "—"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
                    >
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

