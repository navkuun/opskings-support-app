import { sql } from "drizzle-orm"
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core"

import { locales } from "./locales"
import { stories } from "./stories"
import { storySources } from "./story-sources"

export const storyGlossaryTerms = pgTable(
  "story_glossary_terms",
  {
    id: uuid("id").primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),

    term: text("term").notNull(),
    aliases: jsonb("aliases")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
  },
  (t) => ({
    storyIdx: index("story_glossary_terms_story_idx").on(t.storyId),
  }),
)

export const storyGlossaryTermLocalizations = pgTable(
  "story_glossary_term_localizations",
  {
    termId: uuid("term_id")
      .notNull()
      .references(() => storyGlossaryTerms.id, {
        onDelete: "cascade",
      }),
    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),

    termLocalized: text("term_localized"),
    short: text("short").notNull(),
    long: text("long").notNull(),
    whyItMatters: text("why_it_matters").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.termId, t.localeCode] }),
  }),
)

export const storyGlossaryTermSources = pgTable(
  "story_glossary_term_sources",
  {
    termId: uuid("term_id")
      .notNull()
      .references(() => storyGlossaryTerms.id, {
        onDelete: "cascade",
      }),
    storyId: uuid("story_id").notNull(),
    sourceId: integer("source_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.termId, t.sourceId] }),
    storySourceFk: foreignKey({
      columns: [t.storyId, t.sourceId],
      foreignColumns: [storySources.storyId, storySources.sourceId],
    }).onDelete("cascade"),
  }),
)

