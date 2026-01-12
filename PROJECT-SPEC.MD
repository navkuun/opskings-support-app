# OpsKings Development Interview

## Overview

Build a support analytics dashboard that fetches data from the provided PostgreSQL database, performs aggregations, and displays insights through charts and tables. This task evaluates your ability to work with SQL databases, perform data analysis, and create meaningful visualizations.

## Database Setup

Within the database folder in repository, you will find 2 files

- schema.sql
- seed.sql

Create free Supabase account, and use SQL scripts outlined above to setup your database and data

Data only contains information about clients, tickets, and ticket types.

Your task is, additionally, to create proper users schema that supports internal team members and client users

## Authentication & Authorization Requirements

### User Types

1. **Internal Team Members** - Company employees (support agents, managers, admins)
2. **Client Users** - External customers who submitted tickets

### Row Level Security (RLS) Requirements

Implement RLS policies that enforce the following access rules:

| Data | Internal Team Members | Client Users |
|------|----------------------|--------------|
| Tickets | View ALL tickets | View ONLY their own tickets |
| Ticket Messages | View ALL messages | View ONLY messages on their tickets |
| Ticket Feedback | View ALL feedback | View ONLY feedback on their tickets |
| Clients | View ALL clients | View ONLY their own client record |
| Payments | View ALL payments | View ONLY their own payments |
| Team Members | View ALL team members | View ALL team members (public info only) |
| Ticket Types | View ALL | View ALL |

**Key Points:**
- Client users should be completely isolated to their own data
- Internal team members have full read access to all data for analytics purposes
- Consider write permissions as well (e.g., clients can create tickets, team members can update ticket status)

## Technical Requirements

- NextJS
- Supabase Postgres SQL (deployed on coolify)
- Drizzle ORM
- Zero web sync engine
- E2E type-safety - avoid using any() if possible
- BetterAuth for Authentication of internal team members and clients
- Supabase Row Level Security Set Up (do this with drizzle RLS support, web search it when necesary)
- Git for sharing the solution

---

## Required Features

### 1. **Dashboard Overview Cards** (Basic Aggregation)

Display summary statistics cards showing:

- **Total Tickets**
- **Open Tickets**
- **Avg Resolution Time** (in hours, for resolved tickets)
- **Customer Satisfaction** (average rating from feedback)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)
    - Ticket Type (is, is not, is any of, is none of)
    - Priority (is, is not, is any of, is none of)

---

### 2. **Tickets Over Time Chart** (Time Series)

Create a **line or bar chart** showing ticket volume by month for 2025.

**Requirements:**

- X-axis: Months (Jan - Nov 2025)
- Y-axis: Number of tickets created
- Show both created and resolved tickets (2 lines/series)

**Requirements:**

- Filtering by (required logic):
    - Date (date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)
    - Ticket Type (is, is not, is any of, is none of)
    - Priority (is, is not, is any of, is none of)

---

### 3. **Team Performance Table** (Complex Aggregation)

Create a **sortable table** showing performance metrics for each team member:

| Team Member | Tickets Assigned | Tickets Resolved | Avg Resolution Time | Avg Rating | Status |
| --- | --- | --- | --- | --- | --- |
| John Smith | 45 | 42 | 3.2 hrs | 4.5 | Active |

**Requirements:**

- Sortable by any column
- Filterable by any column
- Include ALL team members (even if they have 0 tickets)
- Calculate average resolution time per agent
- Show average customer rating (from feedback)
- Highlight top performers (optional)

---

### 4. **Ticket Distribution Charts** (Category Analysis)

Create **2 visualizations**:

### a) Tickets by Type (Pie or Donut Chart)

- Show distribution of tickets across different ticket types
- Display percentage and count

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

### b) Tickets by Priority (Bar Chart)

- Show how many tickets fall into each priority level (low, medium, high, urgent)
- Consider showing this split by status (open vs closed)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

---

### 5. **Client Analysis View** (Advanced Query)

Create a **table or list view** showing client insights:

| Client Name | Plan Type | Total Tickets | Open Tickets | Total Spent | Last Ticket Date |
| --- | --- | --- | --- | --- | --- |
| TechStart | Pro | 12 | 2 | $3,588.00 | 2024-11-05 |

**Requirements:**

- Show top 20 clients by ticket volume
- Include payment totals (from payments table)
- Show last ticket creation date
- Make it searchable by client name
- Add pagination

**Note:** This view is only accessible to internal team members.

---

### 6. **Response Time Analysis** (Statistical Analysis)

Create a **box plot, histogram, or summary statistics view** showing:

- Resolution time distribution by ticket priority
- Identify tickets that exceeded expected resolution time
- Compare actual vs. avg_resolution_hours from ticket_types

**Display:**

- Statistical breakdown (min, max, median, average)
- Visual representation (chart)
- List of "overdue" tickets (took longer than expected)

**Requirements:**

- Filtering by (required logic):
    - Date (exact date, date range, date on or before, date on or after)
    - Team Member (is, is not, is any of, is none of)

---

### 7. **Client Portal** (Client User View)

Create a simplified view for client users that shows:

- Their own tickets (list with status, priority, created date)
- Ability to create new tickets
- Ability to view ticket details and messages
- Ability to leave feedback on resolved tickets

**Note:** Client users should NOT have access to:
- Dashboard analytics
- Team performance metrics
- Other clients' data
- Client analysis view

---

### 8. Bonus (Optional)

- Implement better-auth as authentication mechanism for the system
- Adjust RLS policies to work with better-auth authentication
- Implement role-based UI (show/hide features based on user type)

---

## Performance Considerations

⚠️ **Note:** The database contains ~40,000 tickets. Your solution must handle this volume efficiently.

### Expected Performance:

- Dashboard overview: < 500ms
- Filtered queries: < 1s
- Table pagination: < 300ms
- Charts: < 800ms

### You Should Consider:

- Database indexing strategy
- Query optimization techniques
- Pagination approach
- Caching layers
- Frontend performance

---

## Submission Requirements

1. **GitHub Repository** with:
    - Complete source code
    - README with setup instructions
    - Database schema and seed files (provided)
    - Any environment variables needed
2. **README should include:**
    - How to set up and run the project
    - Tech stack used
    - Any assumptions made
    - Future improvements you would make
    - Which indexes you added and why
    - **How you implemented RLS for multi-tenant access (client isolation vs team member full access)**
    - How did you handle RLS with Better Auth
    - Any materialized views or database optimizations
    - Performance testing results
    - How your solution would scale to 100k+ tickets

3. **Deployment & Presentation**
    - Deployed demo link
    - Screenshots of the dashboard
    - Loom walkthrough

---

# README Content (What I Built)

This section is the write-up I would include in `README.md` for the take-home.

## 1) How to set up and run the project

### Prereqs

- Node.js 22+
- `pnpm`
- Postgres 16+ (must have `wal_level=logical` for Zero replication)

### Local Postgres (Docker)

```bash
docker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  postgres -c wal_level=logical
```

### Install + migrate

```bash
pnpm i
pnpm db:migrate
```

### Environment variables

Create `.env.local` (or `.env`) with at least:

```bash
# Database
DATABASE_URL="postgres://postgres:password@localhost:5432/postgres"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="dev-secret"

# Zero
ZERO_UPSTREAM_DB="postgres://postgres:password@localhost:5432/postgres"
ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"
NEXT_PUBLIC_ZERO_CACHE_URL="http://localhost:4848"
ZERO_QUERY_FORWARD_COOKIES="true"
ZERO_MUTATE_FORWARD_COOKIES="true"
```

### Run Zero locally

This project runs the Zero cache via `zero-cache-dev`:

```bash
pnpm zero:cache
```

Zero continuously replicates Postgres into a local SQLite replica (default `zero.db`) and serves the websocket API at `http://localhost:4848`.

### Run the app

```bash
pnpm dev
```

## 2) Tech stack used

- Next.js 16 (App Router) + TypeScript (strict)
- Postgres (Coolify deployment) + Drizzle ORM (schema + migrations)
- Better Auth (cookie-based sessions)
- RociCorp Zero (local-first sync) + `zero-cache` for replication + websocket queries
- UI: Tailwind CSS v4, Base UI primitives, shadcn/ui components, Phosphor icons, Recharts
- Testing: Playwright E2E + small perf harness

## 3) Assumptions made

- **Allowlisted sign-in flow (no public signup):**
  - If an email exists in `clients` or `team_members` but has no Better Auth user yet, the login flow sends a “set password” link.
  - This matches typical internal tools: access is granted by an admin “allowlisting” someone in the DB first.
- **Zero is the right fit here:**
  - The app is analytics-heavy and filter-driven, and a local replica + reactive queries dramatically reduces roundtrips versus refetching via REST/TanStack Query.
- **Filters as a visible row (not hidden in a dropdown):**
  - Filters are always visible to reduce interaction cost (one click instead of two).
- **Default internal role mapping:**
  - `team_members.department in ('finance', 'technical')` defaults to `internal_role = manager` (can be overridden later).
- **RLS implementation approach:**
  - I implemented “RLS semantics” at the query/mutator layer using Zero (see sections 6–7), instead of database-level Postgres RLS policies.
  - For a real production system, I would still add Postgres RLS as defense-in-depth (see “Future improvements”).

## 4) Future improvements

- Admin console (for `internal_role=admin`) to manage clients/team members, disable accounts, and set roles.
- True multi-tenant onboarding: client signup → `pending` until approved by an admin.
- Push notifications / realtime alerts for new tickets and overdue SLA breaches.
- Better search: server-side indexed search (e.g. trigram + ranking) or RAG search with reranking for long ticket histories.
- AI “ticket brief”: summarization + suggested next actions/SOP lookup for agents.
- Analytics scalability: rollups/materialized views for time-series metrics and SLA histograms at higher scale.
- Defense-in-depth auth: add DB-level Postgres RLS and keep Zero permissions as an additional layer.

## 5) Which indexes you added and why

These are defined in `lib/db/schema/*`:

- `tickets`
  - `idx_tickets_client_id`, `idx_tickets_client_id_created_at`: common filters and “tickets for client, newest first”.
  - `idx_tickets_assigned_to`, `idx_tickets_assigned_to_created_at`: agent inbox + analytics by assignee.
  - `idx_tickets_ticket_type_id`: filter/group by ticket type.
  - `idx_tickets_status`, `idx_tickets_priority`: filter quickly by status/priority.
  - `idx_tickets_created_at`: date-range filtering + time series.
  - `idx_tickets_resolved_at`: resolution-time analytics.
- `ticket_messages`
  - `idx_ticket_messages_ticket_id`: “messages for ticket”.
  - `idx_ticket_messages_ticket_id_created_at`: “messages for ticket ordered by time”.
- `payments`
  - `idx_payments_client_id`: payments per client.
  - `idx_payments_paid_at`: paid-at sorting for payment history.
- `auth.app_users`
  - `idx_app_users_account_status`, `idx_app_users_user_type`, `idx_app_users_client_id`, `idx_app_users_team_member_id`: fast request-time authorization checks (map session → app user → role/tenant).
- Better Auth tables
  - `session_userId_idx`, `account_userId_idx`, `verification_identifier_idx`: speed up session/account/verification lookups.

## 6) How I implemented “RLS” for multi-tenant access (client isolation vs internal full access)

I enforced tenant isolation in two places:

1) **Zero queries (read access):** `zero/queries.ts`
- Each query receives a server-computed `ctx` containing:
  - `userType: "client" | "internal"`
  - `clientId` (for client users)
  - `teamMemberId` + `internalRole` (for internal users)
- Client isolation is implemented by injecting restrictive predicates:
  - `tickets.list`: always adds `where clientId = <ctx.clientId>` for clients.
  - `ticket_messages.byTicket`: adds `whereExists(ticket where clientId = <ctx.clientId>)`.
  - `ticket_feedback.byTicket`: adds `whereExists(ticket where clientId = <ctx.clientId>)`.
  - `clients.*`: forces `id = <ctx.clientId>` for clients.
  - `payments.byClient`: forces `clientId = <ctx.clientId>` for clients.

2) **Server endpoints (non-Zero reads):** `app/api/**/route.ts`
- Internal-only analytics endpoints validate the session and enforce `app_users.userType === "internal"`.

This achieves the same isolation guarantees described in the prompt (client users can only ever read their own tenant rows), but enforced at the application/query layer rather than Postgres RLS policies.

## 7) How I handled “RLS” with Better Auth

- Better Auth issues a cookie session token on sign-in.
- The Zero cache websocket and query/mutate endpoints rely on that same cookie:
  - Browser includes the Better Auth cookie when connecting to `NEXT_PUBLIC_ZERO_CACHE_URL`.
  - `zero-cache` forwards cookies to `ZERO_QUERY_URL` / `ZERO_MUTATE_URL`.
- On the server:
  - `app/api/zero/context` and `app/api/zero/query` call `getAuth().api.getSession({ headers })`.
  - We look up `auth.app_users` to convert `session.user.id` into an authorization context (`ZeroContext`).
  - That `ZeroContext` drives query restrictions in `zero/queries.ts` and server-side checks in `zero/mutators.ts`.

## 8) Any materialized views or database optimizations

- No materialized views in this take-home (the dataset is ~40k tickets and the indexed queries were sufficient).
- If the dataset grows significantly, the first optimizations I’d add:
  - Monthly rollup table/materialized view for “tickets created/resolved per month”.
  - Precomputed SLA/resolution-time histograms by priority and ticket type.
  - Incremental refresh strategy (nightly + partial refresh for “recent” data).

## 9) Performance testing results

- I added a Playwright “UX timings” perf suite: `pnpm test:e2e:perf`.
  - It runs a local production build (`pnpm build && pnpm start`).
  - It records both **cold-ish** (first navigation after login + first Zero websocket traffic) and **warm** timings (after a client-side navigation back to the page).
  - Budgets can be enforced with env vars like `PERF_BUDGET_DASHBOARD_KPIS_MS=500`.
- Results are environment-dependent; the report is the source of truth for the measured milliseconds.

## 10) How the solution would scale to 100k+ tickets

- **Tickets list scales well**:
  - Cursor pagination + a replicated local SQLite query engine keeps “next page” fast even as the upstream grows.
- **Filter-heavy UX scales well**:
  - Zero clients evaluate queries locally against the replica; filters become local query changes instead of server roundtrips.
- **Analytics endpoints**:
  - With indexes (section 5), server-side aggregations remain fast at 100k rows.
  - At higher scale (hundreds of thousands to millions), move heavy metrics to rollups/materialized views and/or incremental aggregation tables.


## EXTRA NOTES

- Remember ZERO cannot work with SSR in nextjs so read Zero react documentation on how to do this properly without SSR.
