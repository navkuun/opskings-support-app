import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { pgPolicy } from "drizzle-orm/pg-core"

import { clients } from "./clients"
import { rlsIsInternal, rlsIsClientForClientId } from "./rls"

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    amountUsd: numeric("amount_usd", { precision: 10, scale: 2, mode: "number" }).notNull(),
    paymentType: varchar("payment_type", { length: 50 }).notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    clientIdIdx: index("idx_payments_client_id").on(t.clientId),
    paidAtIdx: index("idx_payments_paid_at").on(t.paidAt),

    paymentsSelect: pgPolicy("payments_select", {
      for: "select",
      using: sql`(${rlsIsInternal} or ${rlsIsClientForClientId(t.clientId)})`,
    }),
    paymentsInsertInternal: pgPolicy("payments_insert_internal", {
      for: "insert",
      withCheck: rlsIsInternal,
    }),
    paymentsUpdateInternal: pgPolicy("payments_update_internal", {
      for: "update",
      using: rlsIsInternal,
      withCheck: rlsIsInternal,
    }),
    paymentsDeleteInternal: pgPolicy("payments_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
