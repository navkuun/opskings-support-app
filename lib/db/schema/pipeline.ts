import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const pipelineRuns = pgTable("pipeline_runs", {
  id: uuid("id").primaryKey(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  query: text("query"),
  queryType: text("query_type"),
  minFetch: integer("min_fetch"),
  tweetsReturnedByApi: integer("tweets_returned_by_api"),
  estimatedTwitterCredits: integer("estimated_twitter_credits"),
  outputDir: text("output_dir"),
  logPath: text("log_path"),
})

