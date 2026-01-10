import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { getAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { appUsers } from "@/lib/db/schema/app-users"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to OpsKings Support.",
}

export const runtime = "nodejs"

export default async function Page() {
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-200">
      <LoginForm />
    </div>
  )
}
