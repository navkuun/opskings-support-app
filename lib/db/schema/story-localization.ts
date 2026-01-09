import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { locales } from "./locales"
import { stories } from "./stories"

export const storyLocalizations = pgTable(
  "story_localizations",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),

    title: text("title").notNull(),
    description: text("description").notNull(),

    signalLevel: text("signal_level")
      .notNull()
      .default("standard"),

    region: text("region"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storyId, t.localeCode] }),
  }),
)

export const storyReports = pgTable(
  "story_reports",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),
    variant: text("variant").notNull(),

    contentMd: text("content_md").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    variantCheck: check(
      "story_reports_variant_check",
      sql`${t.variant} in ('accessible','standard','technical','investment')`,
    ),
    pk: primaryKey({ columns: [t.storyId, t.localeCode, t.variant] }),
  }),
)
