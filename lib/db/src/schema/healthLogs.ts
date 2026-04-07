import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const healthLogsTable = pgTable("health_logs", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  logType: text("log_type").notNull().default("note"),
  value: text("value").notNull(),
  notes: text("notes").notNull().default(""),
  loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthLogSchema = createInsertSchema(healthLogsTable).omit({
  id: true,
  loggedAt: true,
});

export type InsertHealthLog = z.infer<typeof insertHealthLogSchema>;
export type HealthLog = typeof healthLogsTable.$inferSelect;
