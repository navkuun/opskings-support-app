# OpsKings Support App — Pages & Access

This document lists the planned routes/pages for the OpsKings Support App and who can access them based on the roles described in `PROJECT-SPEC.MD`.

## Roles used by the app

- `user_type`: `internal` | `client`
- `internal_role` (only when `user_type=internal`): `support_agent` | `manager` | `admin`
- `account_status`: `pending` | `active` | `disabled`

> Note: UI gating is not security. RLS must enforce tenant isolation regardless of routes/components.

## Public (Unauthenticated)

| Route | Purpose | Access |
|---|---|---|
| `/` | Login (email → password or send password link) | Everyone |
| `/reset-password` | Password set/reset from email link | Everyone (token-gated) |
| `/verify-email` | Email verification callback (optional) | Everyone (token-gated) |

## Signed-in but not active

| Route | Purpose | Access |
|---|---|---|
| `/no-access` | Pending/disabled account page | Signed-in users with `account_status!=active` |

## Internal App (Active Internal Users)

Applies to users with `user_type=internal` and `account_status=active`.

| Route | Purpose | support_agent | manager | admin |
|---|---|---:|---:|---:|
| `/dashboard` | Overview cards + charts + global filters | ✅ | ✅ | ✅ |
| `/tickets` | All tickets table (filter/paginate) | ✅ | ✅ | ✅ |
| `/tickets/[id]` | Ticket detail + messages + actions | ✅ | ✅ | ✅ |
| `/team` | Team performance table | ⚠️ (optional read-only) | ✅ | ✅ |
| `/clients` | Client analysis view (top clients) | ⚠️ (optional) | ✅ | ✅ |
| `/clients/[id]` | Client detail (tickets/payments) | ⚠️ (optional) | ✅ | ✅ |
| `/response-time` | Response-time analysis + overdue list | ✅ | ✅ | ✅ |
| `/admin/users` | Approve/disable users, set roles | ❌ | ❌ | ✅ |
| `/admin/allowlists` | Manage `clients` / `team_members` allowlist sources | ❌ | ❌ | ✅ |
| `/design-system` | Internal UI docs/playground | ✅ | ✅ | ✅ |

## Client Portal (Active Client Users)

Applies to users with `user_type=client` and `account_status=active`.

| Route | Purpose | Access |
|---|---|---|
| `/tickets` | Tickets list (client scoped; internal sees all) | ✅ internal + client |
| `/client/tickets/new` | Create a ticket | ✅ client |
| `/client/tickets/[id]` | Ticket detail + messages (only their ticket) | ✅ client |
| `/client/tickets/[id]/feedback` | Leave feedback (resolved only) | ✅ client |
| `/client/account` | Their client record (profile-like) | ✅ client |
| `/client/payments` | Their payments | ✅ client |
