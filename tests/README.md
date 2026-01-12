# E2E Tests

This folder contains Playwright end-to-end tests (`pnpm test:e2e`) and shared helpers.

## How tests are organized

- `tests/e2e/access/`
  - `routes-client.spec.ts`
    - Verifies client users can access `/tickets` but are redirected away from internal-only routes (`/dashboard`, `/teams`, `/clients`, `/response-time`).
  - `routes-internal.spec.ts`
    - Verifies internal users can access internal analytics routes and that each page renders its primary filter/metric UI.

- `tests/e2e/auth/`
  - `session.spec.ts`
    - Verifies anonymous users are redirected from `/protected` to the login UI.
    - Verifies an internal (team member) user can:
      - be allowlisted (via the test helper endpoint),
      - set an initial password (via dev reset-token endpoints),
      - sign in,
      - access `/protected`,
      - clear cookies (simulate sign out),
      - and sign back in successfully.
  - `password-reset.spec.ts`
    - Verifies the password reset flow works end-to-end using the dev mailbox token endpoint:
      - seed allowlist → set initial password → sign in → clear cookies
      - set a new password via reset token → sign in with the new password → access `/protected`.

- `tests/e2e/zero/`
  - `query-permissions.spec.ts`
    - Calls `/api/zero/query` with `transform` and inspects the returned query AST to verify tenant restrictions:
      - Anonymous users get an “empty” tickets query.
      - Client users get `client_id = <their id>` injected into ticket queries, and correlated subqueries for messages/feedback.
      - Client users can only query their own client record (other IDs are forced to an empty query).
      - Internal users can list all clients (no tenant `where` restriction).

- `tests/e2e/analytics/`
  - `api-contract.spec.ts`
    - Verifies internal users can call the dashboard + response-time metrics APIs and receive the expected high-level shape.
    - Verifies client users are forbidden from those internal metrics endpoints.

- `tests/e2e/tickets/`
  - `create-and-reply.spec.ts`
    - Verifies a client user can create a new ticket from `/tickets`, lands on the details page, and can post a reply message.

## Shared helpers

- `tests/helpers/auth.ts`
  - Seeds allowlist entries through `/api/test/seed-allowlist`.
  - Uses dev endpoints to fetch a reset token and set/reset passwords.
  - Signs in through Better Auth’s email/password endpoint.
  - Includes small retries for transient connection resets in dev.

- `tests/helpers/zero.ts`
  - Helper to call `/api/zero/query` (transform) and return a typed AST.
  - AST utilities used to assert tenant restrictions (`client_id` filters, correlated subqueries).

- `tests/helpers/test-guards.ts`
  - Runtime type guards for parsing JSON test responses.

## Test server startup / reliability

- `tests/global-setup.ts`
  - Waits for the dev server to be reachable.
  - Warms common routes/endpoints to avoid flaky timeouts from initial Next.js dev compilation.

## Running

```bash
pnpm test:e2e
```

Notes:

- These tests assume the Next.js dev server can start and connect to your configured DB.
- The auth tests rely on dev/test-only endpoints (seed allowlist + dev reset token).
