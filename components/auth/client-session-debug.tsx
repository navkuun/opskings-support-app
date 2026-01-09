"use client"

import * as React from "react"

import { authClient } from "@/lib/auth-client"

export function ClientSessionDebug() {
  const { data: session, isPending, error } = authClient.useSession()

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="font-medium">Client session</div>
      <div className="mt-2 grid gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        <div>Status: {isPending ? "loading" : "ready"}</div>
        {error ? <div>Error: {String(error)}</div> : null}
        <div>User: {session?.user?.email ?? "none"}</div>
      </div>
    </section>
  )
}

