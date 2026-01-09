import { sql } from "drizzle-orm"
import {
  check,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import { tickets } from "./tickets"

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
  }),
)

