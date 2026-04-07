import { Router } from "express";
import { db } from "@workspace/db";
import { chatSessions } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const petId = parseInt(req.query.petId as string);
  if (!petId || isNaN(petId)) {
    res.status(400).json({ error: "petId required" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.petId, petId))
      .orderBy(chatSessions.updatedAt);
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.post("/", async (req, res) => {
  const { petId, title, icon } = req.body as {
    petId: number;
    title?: string;
    icon?: string;
  };
  if (!petId) {
    res.status(400).json({ error: "petId required" });
    return;
  }
  try {
    const [row] = await db
      .insert(chatSessions)
      .values({
        petId,
        title: title || "Yeni Sohbet",
        icon: icon || "message-circle",
      })
      .returning();
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, icon } = req.body as { title?: string; icon?: string };
  try {
    const [row] = await db
      .update(chatSessions)
      .set({
        ...(title ? { title } : {}),
        ...(icon ? { icon } : {}),
        updatedAt: new Date(),
      })
      .where(eq(chatSessions.id, id))
      .returning();
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default router;
