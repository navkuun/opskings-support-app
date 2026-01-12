import type { Zero } from "@rocicorp/zero"

import { CACHE_PRELOAD } from "@/lib/query-cache-policy"
import type { ZeroContext } from "@/zero/context"
import { queries } from "@/zero/queries"

type PreloadHandle = {
  cleanup: () => void
}

export function preloadMainPages(z: Zero, ctx: ZeroContext) {
  const handles: PreloadHandle[] = []

  // Shared filter lookups used across the internal dashboard and tickets tooling.
  handles.push(z.preload(queries.ticketTypes.list({ limit: 200 }), CACHE_PRELOAD))
  handles.push(z.preload(queries.teamMembers.list({ limit: 200 }), CACHE_PRELOAD))
  handles.push(z.preload(queries.clients.list({ limit: 200 }), CACHE_PRELOAD))

  if (ctx.userType === "internal") {
    handles.push(z.preload(queries.teamMembers.internalList({ limit: 200 }), CACHE_PRELOAD))
  }

  // Warm the default tickets listing so `/tickets` feels instant after first navigation.
  handles.push(z.preload(queries.tickets.list({ limit: 200 }), CACHE_PRELOAD))

  return () => {
    for (const handle of handles) {
      handle.cleanup()
    }
  }
}

