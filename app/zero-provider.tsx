"use client"

import { ZeroProvider } from "@rocicorp/zero/react"
import type { ZeroOptions } from "@rocicorp/zero"
import * as React from "react"
import { ThemeProvider } from "next-themes"

import { mutators } from "@/zero/mutators"
import { queries } from "@/zero/queries"
import { schema } from "@/zero/schema"
import { authClient } from "@/lib/auth-client"

export function RiZeroProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session } = authClient.useSession()
  const userID = session?.user?.id ?? "anon"

  const opts = React.useMemo<ZeroOptions>(
    () => ({
      userID,
      context: { userID },
      cacheURL:
        process.env.NEXT_PUBLIC_ZERO_CACHE_URL ??
        "http://localhost:4848",
      // Zero retries connecting for 1 minute by default; increase this so short outages
      // (server restarts, laptop sleep/wake, brief network drops) don't push us to `disconnected`.
      disconnectTimeoutMs: 1000 * 60 * 10,
      schema,
      queries,
      mutators,
    }),
    [userID],
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="ri-theme"
      disableTransitionOnChange
    >
      <ZeroProvider {...opts}>{children}</ZeroProvider>
    </ThemeProvider>
  )
}
