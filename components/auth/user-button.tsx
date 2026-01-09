"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function UserButton() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  const onSignOut = React.useCallback(async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.replace("/login")
          router.refresh()
        },
      },
    })
  }, [router])

  if (isPending) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading…
      </Button>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Sign in
        </Link>
        <Link
          href="/login?mode=sign-up"
          className={buttonVariants({ size: "sm" })}
        >
          Register
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden max-w-[14rem] truncate text-[12px] font-medium text-zinc-600 dark:text-zinc-300 sm:block">
        {session.user.email}
      </div>
      <Button variant="outline" size="sm" onClick={onSignOut}>
        Sign out
      </Button>
    </div>
  )
}
