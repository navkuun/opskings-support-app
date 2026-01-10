import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UserButton } from "@/components/auth/user-button"
import { getAuth } from "@/lib/auth"
import { syncAppUserFromAllowlist } from "@/lib/app-user"
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

  await syncAppUserFromAllowlist(session.user.id)

  const rows = await db
    .select({
      accountStatus: appUsers.accountStatus,
      userType: appUsers.userType,
    })
    .from(appUsers)
    .where(eq(appUsers.authUserId, session.user.id))
    .limit(1)

  const appUser = rows[0] ?? null
  const status = appUser?.accountStatus ?? "pending"

  if (appUser?.accountStatus === "active") {
    redirect(appUser.userType === "client" ? "/client" : "/dashboard")
  }

  const heading =
    status === "disabled" ? "Account disabled" : "Access pending"
  const body =
    status === "disabled"
      ? "Your account has been disabled. Please contact an administrator if you believe this is a mistake."
      : "Your account is pending activation. Please contact an administrator to enable access."

  return (
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-sm font-semibold tracking-wide">OpsKings Support</div>
          <UserButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl space-y-4 px-6 py-10">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-black dark:text-zinc-100">
          <div className="grid gap-1">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Email:</span>{" "}
              {session.user.email}
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">User type:</span>{" "}
              {appUser?.userType ?? "unknown"}
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Status:</span>{" "}
              {status}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
