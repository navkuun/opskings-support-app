import { eq } from "drizzle-orm"
import Link from "next/link"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { ClientSessionDebug } from "@/components/auth/client-session-debug"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

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
      internalRole: appUsers.internalRole,
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

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Protected
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Server session OK. You are signed in.
        </p>
      </header>

      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-black dark:text-zinc-100">
        <div className="grid gap-1">
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">User ID:</span>{" "}
            {session.user.id}
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Email:</span>{" "}
            {session.user.email}
          </div>
          <div>
            <span className="text-zinc-500 dark:text-zinc-400">Role:</span>{" "}
            {appUser.internalRole ?? "—"}
          </div>
        </div>
      </div>

      <ClientSessionDebug />

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          Back to home
        </Link>
        {process.env.NODE_ENV !== "production" ? (
          <Link
            href="/api/auth/debug-session"
            className="text-sm text-zinc-700 underline underline-offset-4 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            Debug session JSON
          </Link>
        ) : null}
      </div>
    </main>
  )
}
