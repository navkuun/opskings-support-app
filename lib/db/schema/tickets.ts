import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"

import { clients } from "./clients"
import { teamMembers } from "./team-members"
import { ticketTypes } from "./ticket-types"

export const tickets = pgTable(
  "tickets",
  {
    id: serial("id").primaryKey(),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    assignedTo: integer("assigned_to").references(() => teamMembers.id),
    ticketTypeId: integer("ticket_type_id")
      .notNull()
      .references(() => ticketTypes.id),
    status: varchar("status", { length: 50 }).default("open"),
    priority: varchar("priority", { length: 20 }),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (t) => ({
    clientIdIdx: index("idx_tickets_client_id").on(t.clientId),
    assignedToIdx: index("idx_tickets_assigned_to").on(t.assignedTo),
    statusIdx: index("idx_tickets_status").on(t.status),
    createdAtIdx: index("idx_tickets_created_at").on(t.createdAt),
    resolvedAtIdx: index("idx_tickets_resolved_at").on(t.resolvedAt),
  }),
)
