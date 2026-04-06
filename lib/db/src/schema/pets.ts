import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const petsTable = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  species: text("species").notNull().default("Köpek"),
  breed: text("breed").notNull().default(""),
  age: integer("age").notNull().default(1),
  weight: real("weight").notNull().default(5),
  gender: text("gender").notNull().default("male"),
  imageUri: text("image_uri"),
  status: text("status").notNull().default("Mutlu"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPetSchema = createInsertSchema(petsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPet = z.infer<typeof insertPetSchema>;
export type Pet = typeof petsTable.$inferSelect;
