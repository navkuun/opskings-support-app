import type { TTL } from "@rocicorp/zero"

export type QueryCachePolicy = {
  ttl: TTL
}

export const CACHE_PRELOAD = {
  ttl: "10m",
} satisfies QueryCachePolicy

