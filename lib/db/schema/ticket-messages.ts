import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { teamMembers } from "./team-members"
import { tickets } from "./tickets"

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id),
    fromClient: boolean("from_client").default(false),
    fromTeamMemberId: integer("from_team_member_id").references(
      () => teamMembers.id,
    ),
    messageText: text("message_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    ticketIdIdx: index("idx_ticket_messages_ticket_id").on(t.ticketId),
  }),
)
