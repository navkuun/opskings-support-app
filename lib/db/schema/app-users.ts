import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { authSchema, authUsers } from "./better-auth"
import { clients } from "./clients"
import { teamMembers } from "./team-members"

export const appUserType = authSchema.enum("app_user_type", ["internal", "client"])
export const internalRole = authSchema.enum("internal_role", [
  "support_agent",
  "manager",
  "admin",
])
export const accountStatus = authSchema.enum("account_status", [
  "pending",
  "active",
  "disabled",
])

export const appUsers = authSchema.table(
  "app_users",
  {
    authUserId: text("auth_user_id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    accountStatus: accountStatus("account_status").notNull().default("pending"),
    userType: appUserType("user_type").notNull(),
    internalRole: internalRole("internal_role"),
    clientId: integer("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),
    teamMemberId: integer("team_member_id").references(() => teamMembers.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userTypeIntegrity: check(
      "app_users_user_type_integrity",
      sql`(
        (
          ${t.userType} = 'client'
          and ${t.teamMemberId} is null
          and ${t.internalRole} is null
          and (${t.accountStatus} <> 'active' or ${t.clientId} is not null)
        )
        or (
          ${t.userType} = 'internal'
          and ${t.clientId} is null
          and (
            ${t.accountStatus} <> 'active'
            or (${t.teamMemberId} is not null and ${t.internalRole} is not null)
          )
        )
      )`,
    ),
    accountStatusIdx: index("idx_app_users_account_status").on(t.accountStatus),
    userTypeIdx: index("idx_app_users_user_type").on(t.userType),
    clientIdIdx: index("idx_app_users_client_id").on(t.clientId),
    teamMemberIdIdx: index("idx_app_users_team_member_id").on(t.teamMemberId),
  }),
)
