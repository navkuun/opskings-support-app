import { sql } from "drizzle-orm"
import {
  check,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { storyOrigins } from "./story-origins"
import { stories } from "./stories"

export const storyLinks = pgTable(
  "story_links",
  {
    id: uuid("id").primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    storyUrlUnique: uniqueIndex("story_links_story_url_unique").on(
      t.storyId,
      t.url,
    ),
  }),
)

export const storyMedia = pgTable(
  "story_media",
  {
    id: uuid("id").primaryKey(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    mediaType: text("media_type").notNull(),
    url: text("url").notNull(),
    caption: text("caption"),
    sourceOriginId: uuid("source_origin_id").references(() => storyOrigins.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    mediaTypeCheck: check(
      "story_media_media_type_check",
      sql`${t.mediaType} in ('image','video','other')`,
    ),
    storyUrlUnique: uniqueIndex("story_media_story_url_unique").on(
      t.storyId,
      t.url,
    ),
  }),
)

