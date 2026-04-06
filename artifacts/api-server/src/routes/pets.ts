import { Router } from "express";
import { db, petsTable, insertPetSchema } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const pets = await db.select().from(petsTable).orderBy(petsTable.createdAt);
    res.json(pets);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch pets");
    res.status(500).json({ error: "Hayvanlar alınamadı" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = insertPetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz veri", details: parsed.error });
      return;
    }
    const [pet] = await db.insert(petsTable).values(parsed.data).returning();
    res.status(201).json(pet);
  } catch (err) {
    req.log.error({ err }, "Failed to create pet");
    res.status(500).json({ error: "Hayvan kaydedilemedi" });
  }
});

router.put("/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  if (isNaN(id)) {
    res.status(400).json({ error: "Geçersiz ID" });
    return;
  }
  try {
    const parsed = insertPetSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Geçersiz veri" });
      return;
    }
    const [pet] = await db
      .update(petsTable)
      .set(parsed.data)
      .where(eq(petsTable.id, id))
      .returning();
    if (!pet) {
      res.status(404).json({ error: "Hayvan bulunamadı" });
      return;
    }
    res.json(pet);
  } catch (err) {
    req.log.error({ err }, "Failed to update pet");
    res.status(500).json({ error: "Hayvan güncellenemedi" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params["id"]!);
  if (isNaN(id)) {
    res.status(400).json({ error: "Geçersiz ID" });
    return;
  }
  try {
    await db.delete(petsTable).where(eq(petsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete pet");
    res.status(500).json({ error: "Hayvan silinemedi" });
  }
});

export default router;
