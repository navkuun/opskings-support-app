import { sql } from "drizzle-orm"
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core"

import { locales } from "./locales"
import { stories } from "./stories"

export const storySources = pgTable(
  "story_sources",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    sourceId: integer("source_id").notNull(),

    url: text("url").notNull(),
    title: text("title"),
    publisher: text("publisher"),
    datePublished: date("date_published"),
    accessedAt: date("accessed_at"),
    reliability: text("reliability"),
    notes: text("notes"),
  },
  (t) => ({
    sourceIdCheck: check("story_sources_source_id_check", sql`${t.sourceId} > 0`),
    reliabilityCheck: check(
      "story_sources_reliability_check",
      sql`${t.reliability} in ('high','medium','low')`,
    ),
    pk: primaryKey({ columns: [t.storyId, t.sourceId] }),
    storyIdx: index("story_sources_story_idx").on(t.storyId),
    urlIdx: index("story_sources_url_idx").on(t.url),
    storyUrlUnique: uniqueIndex("story_sources_story_url_unique").on(
      t.storyId,
      t.url,
    ),
  }),
)

export const storySourceLocalizations = pgTable(
  "story_source_localizations",
  {
    storyId: uuid("story_id").notNull(),
    sourceId: integer("source_id").notNull(),
    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),

    titleLocalized: text("title_localized"),
    publisherLocalized: text("publisher_localized"),
    notesLocalized: text("notes_localized"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storyId, t.sourceId, t.localeCode] }),
    sourceFk: foreignKey({
      columns: [t.storyId, t.sourceId],
      foreignColumns: [storySources.storyId, storySources.sourceId],
    }).onDelete("cascade"),
  }),
)
