import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] || "dummy",
});

const SYSTEM_PROMPT = `Sen Poddle'nin yapay zeka veteriner danışmanısın. Adın Poddle.

ROLÜN:
- Bir veteriner danışmanı gibi davran — doktor değil, danışman. Teşhis koyamazsın.
- Hayvan sahiplerine evcil hayvanlarının sağlığı, bakımı, beslenmesi ve davranışları hakkında bilgi ver.
- Fotoğraf veya video içeriği analiz edildiğinde, görsel özelliklere dikkat çek.
- Ciddi belirtilerde HER ZAMAN "Bir veterinere götürün" diye uyar.

NASIL DAVRANACAKSIN:
- Sıcak, anlayışlı ve güven verici ol.
- Teknik terimleri basit dille açıkla.
- Olası nedenler listele ama kesin tanı koyma.
- Pratik öneriler ver (beslenme, egzersiz, bakım).
- Türkçe konuş.

SINIRLAR:
- "Ben bir veterinerim" deme.
- Kesin tanı koyma.
- Reçete yazma.
- Acil durumlarda geciktirme — hemen veterinere yönlendir.

MESAJ YAPISI:
1. Gözlem/Değerlendirme (kısa)
2. Olası nedenler (madde madde)  
3. Önerilen adımlar
4. Gerekirse: Veteriner uyarısı`;

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
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (petContext) {
      messages.push({
        role: "system",
        content: `Evcil hayvan bilgileri: ${petContext}`,
      });
    }

    if (history && history.length > 0) {
      for (const h of history.slice(-6)) {
        messages.push({
          role: h.role as "user" | "assistant",
          content: h.content,
        });
      }
    }

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: message || "Bu görselde ne görüyorsun? Evcil hayvanımın durumu hakkında ne düşünüyorsun?",
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: message,
      });
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "AI yanıt hatası" })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
