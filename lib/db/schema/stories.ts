import { desc, sql } from "drizzle-orm"
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

import { pipelineRuns } from "./pipeline"

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").primaryKey(),
    pipelineRunId: uuid("pipeline_run_id").references(() => pipelineRuns.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),

    status: text("status")
      .notNull()
      .default("draft"),

    topic: text("topic"),

    langsmithRootRunId: uuid("langsmith_root_run_id"),
    langsmithPublicUrl: text("langsmith_public_url"),
  },
  (t) => ({
    statusCheck: check(
      "stories_status_check",
      sql`${t.status} in ('draft','published','archived')`,
    ),
    statusPublishedAtIdx: index("stories_status_published_at_idx").on(
      t.status,
      desc(t.publishedAt),
    ),
    createdAtIdx: index("stories_created_at_idx").on(desc(t.createdAt)),
    pipelineRunIdx: index("stories_pipeline_run_idx").on(t.pipelineRunId),
  }),
)
