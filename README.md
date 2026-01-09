# opskings-support-app

Next.js 16 (App Router) + TypeScript + Tailwind + Drizzle (Postgres) + Zero.

## Prereqs

- Node.js + pnpm
- Docker (for local Postgres)

## 1) Install deps

```bash
pnpm i
```

## 2) Start local Postgres (with logical replication for Zero)

```bash
docker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  -c wal_level=logical
```

## 3) Configure env

Create `.env.local` (recommended) with:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
ZERO_UPSTREAM_DB="postgresql://postgres:password@localhost:5432/postgres"
ZERO_APP_ID="opskings_support_app"
NEXT_PUBLIC_ZERO_CACHE_URL="http://localhost:4848"
ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"

# Allow Better Auth cookies to reach the Next.js query/mutate handlers via zero-cache
ZERO_QUERY_FORWARD_COOKIES="true"
ZERO_MUTATE_FORWARD_COOKIES="true"

# Better Auth (required)
BETTER_AUTH_SECRET="<generate>" # `pnpm dlx @better-auth/cli@latest secret` (required in production)
BETTER_AUTH_URL="http://localhost:3000"

# Resend (required in production for password reset emails)
RESEND_API_KEY=""
RESEND_FROM="OpsKings Support <auth@yourdomain.com>"
```

Tip: you can start from `.env.example`.

## 3.1) Auth: create Better Auth tables (local)

Better Auth tables are managed by Drizzle migrations in `drizzle/` and live in the `auth` schema.

## 4) Create tables / apply schema (Drizzle)

```bash
pnpm db:update --name init
```

### How migrations work (clear + simple)

- `lib/db/schema.ts` is the source of truth.
- `drizzle-kit generate` turns schema changes into SQL files in `drizzle/`.
- `drizzle-kit migrate` applies those SQL files to Postgres.
- `drizzle-zero generate` regenerates `zero-schema.gen.ts` so Zero’s `zql` + types match the schema.

We wrap this in one command:

- `pnpm db:update --name <migration_name>` runs:
  1) `pnpm db:generate --name <migration_name>`
  2) `pnpm db:migrate`
  3) `pnpm generate` (drizzle-zero)

Note: don’t mix `db:push` and migrations on the same database. If you already ran `db:push`, reset your local DB first (see below) before running migrations.

### Better Auth tables (not in `drizzle/`)

Better Auth tables (`auth.user`, `auth.session`, `auth.account`, `auth.verification`) are created by Drizzle migrations in `drizzle/`.

## 5) Generate Zero schema (from Drizzle schema)

Any time `lib/db/schema.ts` changes, re-generate the Zero schema:

```bash
pnpm generate
```

This writes `zero-schema.gen.ts`.

## 6) Run the app + Zero cache (2 terminals)

Terminal A (Next.js):

```bash
pnpm dev
```

Terminal B (Zero cache):

```bash
export ZERO_UPSTREAM_DB="postgresql://postgres:password@localhost:5432/postgres"
export ZERO_QUERY_URL="http://localhost:3000/api/zero/query"
export ZERO_MUTATE_URL="http://localhost:3000/api/zero/mutate"
export ZERO_QUERY_FORWARD_COOKIES="true"
export ZERO_MUTATE_FORWARD_COOKIES="true"
pnpm exec zero-cache-dev
```

- App: http://localhost:3000
- Zero cache: http://localhost:4848

## Reset local DB (if needed)

If you accidentally applied schema with `pnpm db:push` and now want to switch to migrations, the easiest reset is to recreate the local docker Postgres:

```bash
docker rm -f zero-postgres
docker run -d --name zero-postgres \
  -e POSTGRES_PASSWORD="password" \
  -p 5432:5432 \
  postgres:16-alpine \
  -c wal_level=logical
```

## Useful commands

- Lint: `pnpm lint`
- Build: `pnpm build`
- Start (prod): `pnpm start`
- Drizzle Studio: `pnpm db:studio`
