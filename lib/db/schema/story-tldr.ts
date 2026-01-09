import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core"

import { locales } from "./locales"
import { stories } from "./stories"

export const storyTldr = pgTable(
  "story_tldr",
  {
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    localeCode: text("locale_code")
      .notNull()
      .references(() => locales.code),

    confidence: text("confidence"),
    topic: text("topic"),
  },
  (t) => ({
    confidenceCheck: check(
      "story_tldr_confidence_check",
      sql`${t.confidence} in ('high','medium','low')`,
    ),
    pk: primaryKey({ columns: [t.storyId, t.localeCode] }),
  }),
)

export const storyTldrBullets = pgTable(
  "story_tldr_bullets",
  {
    storyId: uuid("story_id").notNull(),
    localeCode: text("locale_code").notNull(),
    idx: integer("idx").notNull(),

    bullet: text("bullet").notNull(),
  },
  (t) => ({
    idxCheck: check("story_tldr_bullets_idx_check", sql`${t.idx} >= 0`),
    pk: primaryKey({ columns: [t.storyId, t.localeCode, t.idx] }),
    storyLocaleFk: foreignKey({
      columns: [t.storyId, t.localeCode],
      foreignColumns: [storyTldr.storyId, storyTldr.localeCode],
    }).onDelete("cascade"),
  }),
)

