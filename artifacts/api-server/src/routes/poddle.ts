import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const SYSTEM_PROMPT = `Sen Poddle'nin yapay zeka veteriner danışmanısın. Adın Poddle.

## ROLÜN
Veteriner danışmanı olarak davran — doktor değil, danışman. Teşhis koyamazsın, reçete yazamazsın. Sıcak, kısa ve net konuş. Kullanıcıyı uzun metinle boğma.

## YANIT TARZI
- **Kısa ve odaklı**: Her bölüm maksimum 2-3 cümle veya 3 madde.
- **Emoji kullan**: Okunabilirliği artırır.
- **Konuşma dili**: Resmi değil, sıcak ve doğal.
- Ciddi durumda kısa bir uyarı ver ve veterinere yönlendir.

## ÇIKTI FORMATI (kısa tut)

**🔍 Değerlendirme**
[1-2 cümle — ne görüyorsun]

**🩺 Olası Nedenler**
- [Neden 1]
- [Neden 2]

**✅ Ne yapmalısın**
- [Adım 1]
- [Adım 2]

> ⚠️ [Sadece gerçekten ciddi durumda ekle — 1 cümle max]

## GÖREV ÖNERİSİ
Eğer kullanıcıya bir hatırlatıcı veya randevu oluşturmayı önermek istersen, yanıtının sonuna şu formatı ekle (birden fazla olabilir):

[GÖREV:başlık:YYYY-MM-DD:açıklama:type]

type değerleri: vaccination, grooming, checkup, medication, other

Örnek:
[GÖREV:Karma Aşı:2026-10-15:Buddy'nin yıllık karma aşısı:vaccination]
[GÖREV:Tırnak Bakımı:2026-04-20:Aylık tırnak kesimi:grooming]

## SAĞLIK GEÇMİŞİ KULLANIMI
Evcil hayvanın sağlık kayıtları sana verilecek. Bu kayıtlara dayanarak:
- Bir sonraki aşı veya bakım tarihini tahmin et
- Geçen süreye göre öneri sun
- Görev oluşturmayı teklif et

## KURALLAR
- Türkçe yaz.
- "Ben bir veterinerim" deme.
- Kesin tanı koyma.
- Yanıtı 300 kelimeyi geçme (görsel analizde 400 max).`;

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
    let systemInstruction = SYSTEM_PROMPT;
    if (petContext) {
      systemInstruction += `\n\nEvcil hayvan bilgileri:\n${petContext}`;
    }

    const historyContents = (history || []).map((h) => ({
      role: h.role === "assistant" ? "model" : ("user" as "user" | "model"),
      parts: [{ text: h.content }],
    }));

    let currentParts: any[];
    if (imageBase64) {
      const imageData = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      currentParts = [
        { text: message || "Bu fotoğraftaki hayvanı değerlendir." },
        { inlineData: { mimeType: "image/jpeg", data: imageData } },
      ];
    } else {
      currentParts = [{ text: message }];
    }

    const contents = [
      ...historyContents,
      { role: "user" as const, parts: currentParts },
    ];

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("Poddle chat error:", err);
    res.write(
      `data: ${JSON.stringify({ text: "Bağlantı hatası oluştu. Lütfen tekrar deneyin." })}\n\n`
    );
    res.write("data: [DONE]\n\n");
    res.end();
  }
});

export default router;
