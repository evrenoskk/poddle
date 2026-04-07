import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  petId: integer("pet_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull().default("default"),
  title: varchar("title", { length: 255 }).notNull().default("Yeni Sohbet"),
  icon: varchar("icon", { length: 50 }).default("message-circle"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
