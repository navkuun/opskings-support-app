import { sql } from "drizzle-orm"
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { stories } from "./stories"

export const storyOrigins = pgTable(
  "story_origins",
  {
    id: uuid("id").primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),

    originType: text("origin_type").notNull(),

    externalId: text("external_id"),
    author: text("author"),
    sourceUrl: text("source_url"),
    createdAt: timestamp("created_at", { withTimezone: true }),
    rawText: text("raw_text"),
    rawJson: jsonb("raw_json"),
  },
  (t) => ({
    originTypeCheck: check(
      "story_origins_origin_type_check",
      sql`${t.originType} in ('tweet','url','rss','pdf','manual','ri')`,
    ),
    storyIdx: index("story_origins_story_idx").on(t.storyId),
    typeExternalIdx: index("story_origins_type_external_idx").on(
      t.originType,
      t.externalId,
    ),
    sourceUrlIdx: index("story_origins_source_url_idx").on(t.sourceUrl),
  }),
)

export const storyPrimaryOrigin = pgTable(
  "story_primary_origin",
  {
    storyId: uuid("story_id")
      .primaryKey()
      .references(() => stories.id, { onDelete: "cascade" }),
    originId: uuid("origin_id")
      .notNull()
      .references(() => storyOrigins.id, { onDelete: "cascade" }),
  },
  (t) => ({
    originUnique: uniqueIndex("story_primary_origin_origin_unique").on(
      t.originId,
    ),
  }),
)
