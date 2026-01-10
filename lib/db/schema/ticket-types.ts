import {
  integer,
  pgTable,
  serial,
  varchar,
} from "drizzle-orm/pg-core"
import { pgPolicy } from "drizzle-orm/pg-core"

import { rlsIsActiveAppUser, rlsIsInternal } from "./rls"

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: serial("id").primaryKey(),
    typeName: varchar("type_name", { length: 100 }).notNull(),
    department: varchar("department", { length: 50 }).notNull(),
    priority: varchar("priority", { length: 20 }),
    avgResolutionHours: integer("avg_resolution_hours"),
  },
  () => ({
    ticketTypesSelect: pgPolicy("ticket_types_select", {
      for: "select",
      using: rlsIsActiveAppUser,
    }),
    ticketTypesInsertInternal: pgPolicy("ticket_types_insert_internal", {
      for: "insert",
      withCheck: rlsIsInternal,
    }),
    ticketTypesUpdateInternal: pgPolicy("ticket_types_update_internal", {
      for: "update",
      using: rlsIsInternal,
      withCheck: rlsIsInternal,
    }),
    ticketTypesDeleteInternal: pgPolicy("ticket_types_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
