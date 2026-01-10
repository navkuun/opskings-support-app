import { sql } from "drizzle-orm"
import {
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { pgPolicy } from "drizzle-orm/pg-core"

import { tickets } from "./tickets"
import { rlsIsInternal, rlsIsClientForTicketId, rlsIsClientForResolvedTicketId } from "./rls"

export const ticketFeedback = pgTable(
  "ticket_feedback",
  {
    id: serial("id").primaryKey(),
    ticketId: integer("ticket_id")
      .notNull()
      .references(() => tickets.id)
      .unique(),
    rating: integer("rating"),
    feedbackText: text("feedback_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    ratingCheck: check(
      "ticket_feedback_rating_check",
      sql`${t.rating} between 1 and 5`,
    ),

    ticketFeedbackSelect: pgPolicy("ticket_feedback_select", {
      for: "select",
      using: sql`(${rlsIsInternal} or ${rlsIsClientForTicketId(t.ticketId)})`,
    }),
    ticketFeedbackInsert: pgPolicy("ticket_feedback_insert", {
      for: "insert",
      withCheck: sql`(${rlsIsInternal} or ${rlsIsClientForResolvedTicketId(t.ticketId)})`,
    }),
    ticketFeedbackUpdate: pgPolicy("ticket_feedback_update", {
      for: "update",
      using: sql`(${rlsIsInternal} or ${rlsIsClientForTicketId(t.ticketId)})`,
      withCheck: sql`(${rlsIsInternal} or ${rlsIsClientForTicketId(t.ticketId)})`,
    }),
    ticketFeedbackDeleteInternal: pgPolicy("ticket_feedback_delete_internal", {
      for: "delete",
      using: rlsIsInternal,
    }),
  }),
).enableRLS()
