import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const SYSTEM_PROMPT = `Sen Poddle'nin yapay zeka veteriner danışmanısın. Adın Poddle.

## ROLÜN
- Veteriner danışmanı olarak davran — doktor değil, danışman. Teşhis koyamazsın.
- Hayvan sahiplerine sağlık, bakım, beslenme ve davranış konularında bilgi ver.
- Görsel/fotoğraf analiz edildiğinde görsel özellikleri açıkla.
- Ciddi belirtilerde mutlaka veterinere yönlendir.

## ÇIKTI FORMATI
Her yanıtı MUTLAKA aşağıdaki markdown yapısında üret:

### 🔍 Değerlendirme
[Durumu kısaca değerlendir, 1-2 cümle]

### 🩺 Olası Nedenler
- **[Neden 1]**: [Açıklama]
- **[Neden 2]**: [Açıklama]
- **[Neden 3]**: [Açıklama]

### ✅ Önerilen Adımlar
1. [İlk adım]
2. [İkinci adım]
3. [Üçüncü adım]

[Ciddi durumlarda blockquote formatında uyarı ekle:]
> ⚠️ **Veteriner Uyarısı**: [Açıklama ve ne zaman gidilmeli]

## KURALLAR
- Türkçe yaz, sıcak ve anlayışlı ol.
- Teknik terimleri basit dille açıkla.
- "Ben bir veterinerim" deme.
- Kesin tanı koyma.
- Reçete yazma.
- Markdown formatını ASLA atlama — her yanıt yapılandırılmış olmalı.`;

router.post("/chat", async (req, res) => {
  const { message, petContext, history, imageBase64 } = req.body as {
    message: string;
    petContext?: string;
    history?: { role: string; content: string }[];
    imageBase64?: string;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Build system context
    let systemInstruction = SYSTEM_PROMPT;
    if (petContext) {
      systemInstruction += `\n\nEvcil hayvan bilgileri: ${petContext}`;
    }

    // Build conversation history in Gemini format
    type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
    type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

    const contents: GeminiContent[] = [];

    if (history && history.length > 0) {
      for (const h of history.slice(-8)) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        });
      }
    }

    // Build current user message parts
    const userParts: GeminiPart[] = [];

    if (imageBase64) {
      userParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64,
        },
      });
    }

    userParts.push({
      text: message || (imageBase64
        ? "Bu görselde ne görüyorsun? Evcil hayvanımın durumu hakkında ne düşünüyorsun?"
        : "Merhaba"),
    });

    contents.push({ role: "user", parts: userParts });

    const model = imageBase64 ? "gemini-3.1-pro-preview" : "gemini-2.5-flash";

    const stream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    req.log?.error({ err }, "Gemini chat error");
    res.write(`data: ${JSON.stringify({ error: "AI yanıt hatası: " + (err?.message ?? "bilinmeyen hata") })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
