import { sql, type SQLWrapper } from "drizzle-orm"

export const rlsAuthUserId = sql`coalesce(
  nullif(current_setting('app.auth_user_id', true), ''),
  nullif(current_setting('request.jwt.claim.sub', true), '')
)`

export const rlsIsActiveAppUser = sql`exists (
  select 1
  from auth.app_users au
  where au.auth_user_id = ${rlsAuthUserId}
    and au.account_status = 'active'
)`

export const rlsIsInternal = sql`exists (
  select 1
  from auth.app_users au
  where au.auth_user_id = ${rlsAuthUserId}
    and au.user_type = 'internal'
    and au.account_status = 'active'
)`

export function rlsIsClientForClientId(clientId: SQLWrapper) {
  return sql`exists (
    select 1
    from auth.app_users au
    where au.auth_user_id = ${rlsAuthUserId}
      and au.user_type = 'client'
      and au.account_status = 'active'
      and au.client_id = ${clientId}
  )`
}

export function rlsIsClientForTicketId(ticketId: SQLWrapper) {
  return sql`exists (
    select 1
    from auth.app_users au
    join tickets tk on tk.client_id = au.client_id
    where au.auth_user_id = ${rlsAuthUserId}
      and au.user_type = 'client'
      and au.account_status = 'active'
      and tk.id = ${ticketId}
  )`
}

export function rlsIsClientForResolvedTicketId(ticketId: SQLWrapper) {
  return sql`exists (
    select 1
    from auth.app_users au
    join tickets tk on tk.client_id = au.client_id
    where au.auth_user_id = ${rlsAuthUserId}
      and au.user_type = 'client'
      and au.account_status = 'active'
      and tk.id = ${ticketId}
      and tk.resolved_at is not null
  )`
}
