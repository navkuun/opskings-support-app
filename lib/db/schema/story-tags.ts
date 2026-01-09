import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core"

import { locales } from "./locales"
import { stories } from "./stories"

export const storyTags = pgTable(
  "story_tags",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    tag: text("tag").notNull(),
    ticker: text("ticker"),
  },
  (t) => ({
    typeCheck: check(
      "story_tags_type_check",
      sql`${t.type} in ('topic','company')`,
    ),
    pk: primaryKey({ columns: [t.storyId, t.type, t.tag] }),
    storyIdx: index("story_tags_story_idx").on(t.storyId),
    typeTagIdx: index("story_tags_type_tag_idx").on(t.type, t.tag),
  }),
)

export const storyTagLocalizations = pgTable(
  "story_tag_localizations",
  {
    storyId: uuid("story_id").notNull(),
    type: text("type").notNull(),
    tag: text("tag").notNull(),

    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),
    tagLocalized: text("tag_localized").notNull(),
  },
  (t) => ({
    typeCheck: check(
      "story_tag_localizations_type_check",
      sql`${t.type} in ('topic','company')`,
    ),
    pk: primaryKey({ columns: [t.storyId, t.type, t.tag, t.localeCode] }),
    tagFk: foreignKey({
      columns: [t.storyId, t.type, t.tag],
      foreignColumns: [storyTags.storyId, storyTags.type, storyTags.tag],
    }).onDelete("cascade"),
    localeIdx: index("story_tag_localizations_locale_idx").on(t.localeCode),
  }),
)
