"use client"

import { ZeroProvider, useZero } from "@rocicorp/zero/react"
import type { ZeroOptions } from "@rocicorp/zero"
import * as React from "react"
import { ThemeProvider } from "next-themes"

import { mutators } from "@/zero/mutators"
import { queries } from "@/zero/queries"
import { schema } from "@/zero/schema"
import type { ZeroContext } from "@/zero/context"
import { authClient } from "@/lib/auth-client"
import { isNumber, isRecord, isString } from "@/lib/type-guards"
import { preloadMainPages } from "@/lib/zero-preload"

function scheduleIdle(callback: () => void) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(() => callback())
    return () => {
      if (typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(id)
      }
    }
  }

  const timeout = window.setTimeout(callback, 250)
  return () => window.clearTimeout(timeout)
}

function ZeroPreloader({
  userID,
  ctx,
}: {
  userID: string
  ctx: ZeroContext
}) {
  const z = useZero()
  const cleanupRef = React.useRef<null | (() => void)>(null)
  const preloadedForRef = React.useRef<{ userID: string; zero: unknown } | null>(null)
  const scheduledForRef = React.useRef<{ userID: string; zero: unknown } | null>(null)

  React.useEffect(() => {
    const isSignedIn = userID !== "anon"
    const ctxReady =
      ctx.userID === userID && (ctx.userType === "internal" || ctx.userType === "client")

    if (!isSignedIn || !ctxReady) return
    if (preloadedForRef.current?.userID === userID && preloadedForRef.current.zero === z) return
    if (scheduledForRef.current?.userID === userID && scheduledForRef.current.zero === z) return

    scheduledForRef.current = { userID, zero: z }

    const cancel = scheduleIdle(() => {
      if (scheduledForRef.current?.userID !== userID || scheduledForRef.current.zero !== z) return
      scheduledForRef.current = null
      cleanupRef.current?.()
      cleanupRef.current = preloadMainPages(z, ctx)
      preloadedForRef.current = { userID, zero: z }
    })

    return () => {
      cancel()
      if (scheduledForRef.current?.userID === userID && scheduledForRef.current.zero === z) {
        scheduledForRef.current = null
      }
    }
  }, [ctx, userID, z])

  React.useEffect(() => {
    if (userID !== "anon") return
    cleanupRef.current?.()
    cleanupRef.current = null
    preloadedForRef.current = null
    scheduledForRef.current = null
  }, [userID])

  return null
}

export function RiZeroProvider({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: session } = authClient.useSession()
  const userID = session?.user?.id ?? "anon"

  const [ctx, setCtx] = React.useState<ZeroContext>(() => ({
    userID: "anon",
    userType: "anon",
    internalRole: null,
    clientId: null,
    teamMemberId: null,
  }))

  const parseZeroContextResponse = React.useCallback(
    (value: unknown): ZeroContext | null => {
      if (!isRecord(value) || value.ok !== true) return null
      const ctxValue = value.ctx
      if (!isRecord(ctxValue)) return null

      const parsedUserID = ctxValue.userID
      const parsedUserType = ctxValue.userType
      const parsedInternalRole = ctxValue.internalRole
      const parsedClientId = ctxValue.clientId
      const parsedTeamMemberId = ctxValue.teamMemberId

      if (!isString(parsedUserID)) return null
      if (parsedUserType !== "internal" && parsedUserType !== "client" && parsedUserType !== "anon")
        return null
      if (
        parsedInternalRole !== null &&
        parsedInternalRole !== "support_agent" &&
        parsedInternalRole !== "manager" &&
        parsedInternalRole !== "admin"
      ) {
        return null
      }
      if (parsedClientId !== null && !isNumber(parsedClientId)) return null
      if (parsedTeamMemberId !== null && !isNumber(parsedTeamMemberId)) return null

      return {
        userID: parsedUserID,
        userType: parsedUserType,
        internalRole: parsedInternalRole ?? null,
        clientId: parsedClientId ?? null,
        teamMemberId: parsedTeamMemberId ?? null,
      }
    },
    [],
  )

  React.useEffect(() => {
    let cancelled = false

    async function load() {
      if (userID === "anon") {
        setCtx({
          userID: "anon",
          userType: "anon",
          internalRole: null,
          clientId: null,
          teamMemberId: null,
        })
        return
      }

      try {
        const res = await fetch("/api/zero/context", { cache: "no-store" })
        if (!res.ok) return
        const json: unknown = await res.json()
        const parsed = parseZeroContextResponse(json)
        if (!parsed) return
        if (cancelled) return
        if (parsed.userID !== userID) return
        setCtx(parsed)
      } catch {
        // Ignore; Zero falls back to anon context (no data).
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [parseZeroContextResponse, userID])

  const opts = React.useMemo<ZeroOptions>(
    () => ({
      userID,
      context: ctx,
      appID: process.env.NEXT_PUBLIC_ZERO_APP_ID ?? "opskings_support_app",
      cacheURL: process.env.NEXT_PUBLIC_ZERO_CACHE_URL ?? "http://localhost:4848",
      // Zero retries connecting for 1 minute by default; increase this so short outages
      // (server restarts, laptop sleep/wake, brief network drops) don't push us to `disconnected`.
      disconnectTimeoutMs: 1000 * 60 * 10,
      schema,
      queries,
      mutators,
    }),
    [ctx, userID],
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="ri-theme"
      disableTransitionOnChange
    >
      <ZeroProvider {...opts}>
        <ZeroPreloader userID={userID} ctx={ctx} />
        {children}
      </ZeroProvider>
    </ThemeProvider>
  )
}
