import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const JWT_SECRET = process.env.SESSION_SECRET || "poddle-secret-key-2024";
const PRO_EMAILS = ["evrenkkose@gmail.com"];

function makeToken(userId: number, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "90d" });
}

function sanitizeUser(u: typeof usersTable.$inferSelect) {
  const plan = PRO_EMAILS.includes(u.email.toLowerCase()) ? "pro_plus" : u.plan;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    plan,
    freeQuestionsUsed: u.freeQuestionsUsed,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre gereklidir." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Şifre en az 6 karakter olmalıdır." });
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({ error: "Bu e-posta adresi zaten kayıtlı." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const plan = PRO_EMAILS.includes(email.toLowerCase()) ? "pro_plus" : "free";

    const [user] = await db
      .insert(usersTable)
      .values({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        passwordHash,
        plan,
      })
      .returning();

    const token = makeToken(user.id, user.email);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("signup error:", err);
    res.status(500).json({ error: "Kayıt sırasında hata oluştu." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "E-posta ve şifre gereklidir." });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "E-posta veya şifre hatalı." });
    }

    const token = makeToken(user.id, user.email);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Giriş sırasında hata oluştu." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Yetkisiz erişim." });
    }

    const token = auth.slice(7);
    let payload: { userId: number; email: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    } catch {
      return res.status(401).json({ error: "Geçersiz token." });
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Kullanıcı bulunamadı." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("me error:", err);
    res.status(500).json({ error: "Sunucu hatası." });
  }
});

export default router;
