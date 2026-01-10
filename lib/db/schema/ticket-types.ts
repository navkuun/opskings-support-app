import {
  integer,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core"

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: serial("id").primaryKey(),
    typeName: varchar("type_name", { length: 100 }).notNull(),
    department: varchar("department", { length: 50 }).notNull(),
    priority: varchar("priority", { length: 20 }),
    avgResolutionHours: integer("avg_resolution_hours"),
  },
)
