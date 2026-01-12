# OpsKings Support App

Support analytics dashboard + client portal.

## Setup and run

### Prereqs

- Node.js 22+
- `pnpm`
- Postgres 16+ (Zero requires logical replication)

### 1) Start Postgres (Docker)

```bash
docker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  postgres -c wal_level=logical
```

### 2) Install deps

```bash
pnpm i
```

### 3) Configure env

Create `.env.local` with:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<generate>" # `pnpm dlx @better-auth/cli@latest secret`

# Zero (local dev)
ZERO_UPSTREAM_DB="postgresql://postgres:password@localhost:5432/postgres"
ZERO_APP_ID="opskings_support_app"
NEXT_PUBLIC_ZERO_CACHE_URL="http://localhost:4848"
ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"
ZERO_QUERY_FORWARD_COOKIES="true"
ZERO_MUTATE_FORWARD_COOKIES="true"

# Resend (required in production for password reset emails)
RESEND_API_KEY=""
RESEND_FROM="OpsKings Support <auth@yourdomain.com>"
```

### 4) Run migrations

```bash
pnpm db:migrate
```

Optional seed for local demo data:

```bash
pnpm db:seed
```

### 5) Run Zero + Next.js (2 terminals)

Terminal A (Zero cache):

```bash
pnpm zero:cache
```

Terminal B (Next.js):

```bash
pnpm dev
```

- App: `http://localhost:3000`
- Zero cache: `http://localhost:4848`

## Tech stack

- Next.js 16 (App Router) + TypeScript (strict)
- Postgres + Drizzle ORM (schema + migrations)
- Better Auth (cookie-based sessions)
- RociCorp Zero (`zero-cache` + reactive client queries against a local SQLite replica)
- UI: Tailwind CSS v4, Base UI primitives, shadcn/ui, Phosphor icons, Recharts
- Testing: Playwright E2E

## Assumptions

- Access is “allowlist-based” (no public signup):
  - If an email exists in `clients` or `team_members` but has no Better Auth user yet, the login flow sends a “set password” link.
- Zero is used instead of refetching REST payloads for every filter change:
  - Filters become local query changes against the replica.
- Filters are always visible (a filter row) instead of being nested under a dropdown to reduce click friction.
- Default internal role mapping:
  - `team_members.department in ("finance", "technical")` defaults to `internal_role="manager"`, otherwise `support_agent`.

## Multi-tenant access (“RLS” semantics)

This take-home enforces tenant isolation primarily via **Zero query/mutator permissions** (application-layer), rather than database-level Postgres RLS policies.

- Reads are restricted in `zero/queries.ts` using a server-provided `ZeroContext`:
  - Client users are forced to `clientId = ctx.clientId` for tickets/payments and `whereExists(ticket.clientId = ctx.clientId)` for messages/feedback.
  - Internal users get full access for analytics.
- Writes are restricted in `zero/mutators.ts`:
  - Clients can only create tickets for themselves and can only write messages/feedback on tickets they own.
  - Internal users can update assignment/status/priority.

For a real production system, I would also enable Postgres RLS as defense-in-depth, but for this project the Zero permission layer provides the same tenant isolation guarantees at the query/mutation boundary.

## Better Auth + Zero

- Better Auth issues a cookie session token.
- The browser connects to `NEXT_PUBLIC_ZERO_CACHE_URL` (websocket).
- `zero-cache` forwards cookies to:
  - `ZERO_QUERY_URL` (`/api/zero/query`)
  - `ZERO_MUTATE_URL` (`/api/zero/mutate`)
- The Next.js query/mutate handlers validate the Better Auth session, load `auth.app_users`, and build the `ZeroContext` that drives the per-tenant query restrictions.

## Indexes added (and why)

Defined in `lib/db/schema/*`:

- `tickets`
  - `idx_tickets_client_id`, `idx_tickets_client_id_created_at`: common filters and newest-first listings per client
  - `idx_tickets_assigned_to`, `idx_tickets_assigned_to_created_at`: agent inbox + analytics by assignee
  - `idx_tickets_ticket_type_id`: filtering/grouping by type
  - `idx_tickets_status`, `idx_tickets_priority`: filtering by status/priority
  - `idx_tickets_created_at`: date filters + time series
  - `idx_tickets_resolved_at`: resolution-time analytics
- `ticket_messages`
  - `idx_ticket_messages_ticket_id`, `idx_ticket_messages_ticket_id_created_at`: fast ticket thread reads, ordered by time
- `payments`
  - `idx_payments_client_id`, `idx_payments_paid_at`: payment history and sorting
- `auth.app_users`
  - `idx_app_users_account_status`, `idx_app_users_user_type`, `idx_app_users_client_id`, `idx_app_users_team_member_id`: fast session → app user → role/tenant checks
- Better Auth tables
  - `session_userId_idx`, `account_userId_idx`, `verification_identifier_idx`: session/account/verification lookups

## Materialized views / DB optimizations

No materialized views in this take-home. With ~40k tickets, indexed queries were sufficient.

If this grew significantly:
- Add rollup tables/materialized views for monthly ticket counts and SLA/resolution distributions
- Incremental refresh for “recent” windows
- Consider server-side preaggregation for the analytics endpoints

## Performance testing

### E2E

```bash
pnpm test:e2e
```

### UX timing harness

Runs a local production build + records cold-ish vs warm timings:

```bash
pnpm test:e2e:perf
```

Latest local run (from `.playwright/perf-latest.json`, `2026-01-12T20:00:47.709Z`):

- Dashboard KPIs (cold-ish): ~762ms
- Dashboard charts (cold-ish): ~776ms
- Dashboard KPIs (warm): ~355ms
- Dashboard charts (warm): ~366ms
- Response-time KPIs: ~657ms
- Response-time charts: ~445ms
- Tickets table ready: ~653ms
- Tickets pagination (next page): ~35ms
- Tickets filter (status=blocked): ~189ms

Optional budgets (milliseconds):

```bash
PERF_BUDGET_DASHBOARD_KPIS_MS=500 PERF_BUDGET_DASHBOARD_CHARTS_MS=800 \
PERF_BUDGET_RESPONSE_TIME_KPIS_MS=500 PERF_BUDGET_RESPONSE_TIME_CHARTS_MS=800 \
PERF_BUDGET_TICKETS_INITIAL_MS=500 PERF_BUDGET_TICKETS_PAGINATION_MS=300 \
PERF_BUDGET_TICKETS_FILTERED_MS=1000 \
pnpm test:e2e:perf
```

Note: the perf harness uses `E2E_TEST_MODE=true` locally to enable test-only endpoints. Do not set this in real deployments.

### Accuracy notes

- These are end-to-end UX timings (browser interaction → UI “ready”), not microbenchmarks.
- “Cold-ish” dashboard includes the first dashboard navigation after login + the first Zero context request / websocket connection attempt.
- “Warm” dashboard is a second navigation after everything is connected (so it’s closer to steady-state).
- Tickets pagination/filter timings start after the tickets table is already rendered and measure the UI update (first visible row changes).
- For more stable numbers, run multiple times and compare medians (dev machine load impacts results a lot).

## Scaling to 100k+ tickets

- Tickets list uses cursor pagination and stays fast with proper indexing.
- Most filter changes are evaluated locally against the Zero replica, which reduces server load and keeps the UI responsive at higher row counts.
- For analytics queries at higher scale (hundreds of thousands to millions), move heavy aggregations to rollups/materialized views and/or incremental aggregation tables.

## Useful commands

- Lint: `pnpm lint`
- Build: `pnpm build`
- Start (prod): `pnpm start`
- Drizzle Studio: `pnpm db:studio`
- Reset local Zero replica: `pnpm zero:reset`
