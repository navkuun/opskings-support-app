# ri-web (Next.js App Router)

This repo is a Next.js app (`app/` router) using TypeScript (strict), Tailwind CSS v4, and shadcn/ui components under `components/ui/`.

## Quick commands (pnpm)

- Install: `pnpm i`
- Dev: `pnpm dev` (http://localhost:3000)
- Lint: `pnpm lint`
- Build: `pnpm build`
- Start (prod): `pnpm start`

## Project layout

- `app/` – App Router routes/layouts (Server Components by default)
- `components/` – shared components (`components/ui/` for shadcn/ui)
- `lib/` – shared utilities (`lib/utils.ts` exports `cn()`)
- `public/` – static assets

## Conventions

- TypeScript is `strict`; keep types sound and avoid `any`.
- Prefer existing patterns: double quotes, no semicolons, small focused components.
- Use the `@/*` path alias (configured in `tsconfig.json`).
- Do not commit secrets; use `.env.local` for local env vars.
- Avoid editing generated folders: `.next/` and `node_modules/`.

## Next.js (App Router) guidelines

- Default to Server Components; add `"use client"` only when needed (state, effects, browser-only APIs, event handlers).
- Keep client component boundaries minimal: push stateful/interactive leaf components down the tree.
- Use Route Handlers (`app/api/**/route.ts`) for HTTP endpoints; keep them side-effect-safe and validate inputs.
- Prefer `next/link` for navigation and `next/image` for images; configure allowed remote images in `next.config.ts` (prefer narrow `remotePatterns`/hosts).
- Use `export const metadata = ...` / `generateMetadata()` plus Metadata Files (e.g. `opengraph-image.*`, `icon.*`) for titles/descriptions/OG where applicable.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` route boundaries for good UX and resilient routing.
- Be explicit about data caching: `fetch()` is not cached by default; use `cache: "force-cache"` and/or `next: { revalidate: ... }`, and tag-based invalidation (`revalidateTag`, etc.) when needed.

## Production best practices (Next.js 16)

- Prefer static where possible; avoid accidentally opting into dynamic rendering (e.g., unneeded use of cookies/headers/searchParams that forces dynamic).
- Use `next/script` for third-party scripts and keep client JS small (avoid pulling large UI libraries into Server Components).
- Security hardening: add security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) and validate/escape untrusted input.
- Server Actions (if used): configure size limits and allowed origins as needed; don’t pass secrets to the client.
- Env vars: only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; prefer server-only env vars by default.

## UI / styling

- Tailwind styles live in `app/globals.css`; keep design tokens consistent.
- shadcn/ui components are source-controlled in `components/ui/`; edit locally rather than patching in `node_modules/`.
- Use `cn()` from `lib/utils.ts` for conditional class merging.

## Database (Drizzle + Postgres)

- Connection: set `DATABASE_URL` (copy `.env.example` → `.env.local`).
- Drizzle config: `drizzle.config.ts`, schema: `lib/db/schema.ts`, migrations: `drizzle/`.
- Migrations workflow (preferred): `pnpm db:generate --name <migration_name>` then `pnpm db:migrate` (avoid mixing with `db:push` on the same DB).
- Tools: `pnpm db:studio` (schema explorer), `pnpm db:push` (dev-only; avoid when using migrations).
- Next.js runtime: Postgres via `pg` requires Node.js runtime (do not use in Edge).

## Sync (Zero)

- Zero client: `app/zero-provider.tsx` wraps the app via `app/layout.tsx` and connects to `NEXT_PUBLIC_ZERO_CACHE_URL`.
- Query endpoint: `app/api/zero/query/route.ts` (set `ZERO_QUERY_URL="http://localhost:3000/api/zero/query"` for `zero-cache-dev`).
- Mutate endpoint: `app/api/zero/mutate/route.ts` (set `ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"` for `zero-cache-dev`).
- Upstream DB for zero-cache: set `ZERO_UPSTREAM_DB` (must be Postgres with `wal_level=logical`).
- Zero schema generation: `pnpm generate` writes `zero-schema.gen.ts`.
