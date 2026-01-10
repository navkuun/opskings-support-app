import {
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"
import { pgPolicy } from "drizzle-orm/pg-core"

import { rlsIsActiveAppUser, rlsIsInternal } from "./rls"

export const teamMembers = pgTable(
  "team_members",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    department: varchar("department", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  () => ({
    teamMembersSelect: pgPolicy("team_members_select", {
      for: "select",
      using: rlsIsActiveAppUser,
    }),
    teamMembersInsertInternal: pgPolicy("team_members_insert_internal", {
      for: "insert",
      withCheck: rlsIsInternal,
    }),
    teamMembersUpdateInternal: pgPolicy("team_members_update_internal", {
      for: "update",
      using: rlsIsInternal,
      withCheck: rlsIsInternal,
    }),
    teamMembersDeleteInternal: pgPolicy("team_members_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
