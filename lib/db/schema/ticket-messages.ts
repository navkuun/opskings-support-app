import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { pgPolicy } from "drizzle-orm/pg-core"

import { teamMembers } from "./team-members"
import { tickets } from "./tickets"
import { rlsIsInternal, rlsIsClientForTicketId } from "./rls"

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
    ticketIdCreatedAtIdx: index("idx_ticket_messages_ticket_id_created_at").on(
      t.ticketId,
      t.createdAt,
    ),

    ticketMessagesSelect: pgPolicy("ticket_messages_select", {
      for: "select",
      using: sql`(${rlsIsInternal} or ${rlsIsClientForTicketId(t.ticketId)})`,
    }),
    ticketMessagesInsert: pgPolicy("ticket_messages_insert", {
      for: "insert",
      withCheck: sql`(
        ${rlsIsInternal}
        or (
          ${rlsIsClientForTicketId(t.ticketId)}
          and ${t.fromClient} = true
          and ${t.fromTeamMemberId} is null
        )
      )`,
    }),
    ticketMessagesUpdateInternal: pgPolicy("ticket_messages_update_internal", {
      for: "update",
      using: rlsIsInternal,
      withCheck: rlsIsInternal,
    }),
    ticketMessagesDeleteInternal: pgPolicy("ticket_messages_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
