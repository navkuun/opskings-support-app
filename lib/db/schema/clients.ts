import {
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { pgPolicy } from "drizzle-orm/pg-core"

import { rlsIsInternal, rlsIsClientForClientId } from "./rls"

export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    status: varchar("status", { length: 50 }).default("active"),
    planType: varchar("plan_type", { length: 50 }),
    monthlyBudget: numeric("monthly_budget", { precision: 10, scale: 2, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    clientsSelect: pgPolicy("clients_select", {
      for: "select",
      using: sql`(${rlsIsInternal} or ${rlsIsClientForClientId(t.id)})`,
    }),
    clientsInsertInternal: pgPolicy("clients_insert_internal", {
      for: "insert",
      withCheck: rlsIsInternal,
    }),
    clientsUpdateInternal: pgPolicy("clients_update_internal", {
      for: "update",
      using: rlsIsInternal,
      withCheck: rlsIsInternal,
    }),
    clientsDeleteInternal: pgPolicy("clients_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
