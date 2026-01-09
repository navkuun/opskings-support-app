import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const runtime = "nodejs"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await getAuth().api.getSession({
    headers: await headers(),
  })

  if (session?.user?.id) {
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
    if (appUser.userType === "client") {
      redirect("/client")
    }
    redirect("/dashboard")
  }

  const sp = await searchParams
  const initialMode = sp.mode === "sign-up" ? "sign-up" : "sign-in"

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <LoginForm initialMode={initialMode} />
    </div>
  )
}
