import { pgTable, text } from "drizzle-orm/pg-core"

export const locales = pgTable("locales", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
})

