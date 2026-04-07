import { Router } from "express";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

const SYSTEM_PROMPT = `Sen Poddle uygulamasının veteriner danışman asistanısın. Gerçek bir uzman gibi düşünürsün, internetten güncel veteriner bilgilerini tararsın ve bağlamına uygun, akıllı yanıtlar verirsin.

## KİMLİĞİN VE TAVRIN
- Kendini ASLA tekrar tanıtma. "Merhaba", "Ben Poddle", "Nasıl yardımcı olabilirim?" gibi şeyler söyleme — doğrudan konuya gir.
- Sohbet boyunca önceki mesajları doğal biçimde referans al: "Az önce bahsettiğin gibi...", "Devam ediyorum...".
- Bir danışman gibi konuş — resmi değil, samimi; ama sığ değil, derinlikli.
- Formatsız, doğal yaz. Bazen paragraf, bazen madde, bazen sadece bir cümle — duruma göre karar ver. Robotik başlıklar (#, ##) kullanma.
- Aşırı uzatma. Söylenecek şey yoksa söyleme.
- Emoji kullanabilirsin, ama her cümlede değil — sadece anlam katıyorsa.

## BİLGİ KAYNAĞI
Google Search aracın var. Güncel veteriner protokolleri, ilaç doz bilgileri, hastalık belirtileri için aktif olarak araştır. Cevabında bunları sindirilmiş, özlü bir şekilde sun — kaynak listesi yapma.

## VETERİNER RANDEVU AKIŞI
Muayene gerektiren bir durum tespit ettiğinde:
1. Neden gerektiğini 1-2 cümleyle açıkla
2. Aciliyeti belirt (bugün git / bu hafta git / rutin kontrol)
3. Yanıtının SONUNA bu markeri ekle (başka hiçbir şey ekleme sonrasına):

[VET_RANDEVU:aciliyet:neden]

Aciliyet değerleri: acil | bu_hafta | rutin
Örnek: [VET_RANDEVU:bu_hafta:Kulak enfeksiyonu şüphesi — antibiyotik gerekebilir]

## GÖREV ÖNERİSİ
Hatırlatıcı veya takip görevi önerirken yanıt sonuna ekle:
[GÖREV:başlık:YYYY-MM-DD:açıklama:type]
type: vaccination | grooming | checkup | medication | other

## SINIRLAR
- Kesin teşhis koyma, reçete yazma.
- "Veterinere git" demekle bırakma — neden ve ne zaman gitmeleri gerektiğini açıkla.
- Yanıtı 280 kelimeyi geçme. Görsel analizde 380 max.
- Türkçe yaz. Her zaman.`;

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
      systemInstruction += `\n\n---\nEvcil hayvan bilgileri:\n${petContext}`;
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
        { text: message || "Bu fotoğraftaki hayvanı değerlendir ve ne gözlemlediğini anlat." },
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
      model: "gemini-3.1-pro-preview",
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
        tools: [{ googleSearch: {} }],
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
