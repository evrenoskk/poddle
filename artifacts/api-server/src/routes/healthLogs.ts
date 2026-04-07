import { Router } from "express";
import { db } from "@workspace/db";
import { healthLogsTable, insertHealthLogSchema } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/:petId", async (req, res) => {
  const petId = parseInt(req.params.petId, 10);
  if (isNaN(petId)) return res.status(400).json({ error: "Geçersiz petId" });
  const logs = await db
    .select()
    .from(healthLogsTable)
    .where(eq(healthLogsTable.petId, petId))
    .orderBy(desc(healthLogsTable.loggedAt))
    .limit(50);
  res.json(logs);
});

router.post("/", async (req, res) => {
  const parsed = insertHealthLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const [log] = await db.insert(healthLogsTable).values(parsed.data).returning();
  res.status(201).json(log);
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Geçersiz id" });
  await db.delete(healthLogsTable).where(eq(healthLogsTable.id, id));
  res.status(204).send();
});

export default router;
