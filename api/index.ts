import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Auto-load secrets from /app/.dev.env.json if available
let devEnvSecrets: Record<string, string> = {};
try {
  const devEnvPath = "/app/.dev.env.json";
  if (fs.existsSync(devEnvPath)) {
    devEnvSecrets = JSON.parse(fs.readFileSync(devEnvPath, "utf-8"));
  }
} catch (e) {
  console.warn("Could not parse /app/.dev.env.json:", e);
}

// Dedicated secret for Image Generation ONLY (PICTURE_AI)
export const getPictureAIKey = (): string => {
  return (
    process.env.PICTURE_AI ||
    process.env["PİCTURE_AI"] ||
    process.env.PICTURE_AI_KEY ||
    devEnvSecrets["PİCTURE_AI"] ||
    devEnvSecrets["PICTURE_AI"] ||
    devEnvSecrets["PICTURE_AI_KEY"] ||
    ""
  ).trim();
};

// General Chat / Text / Search / TTS keys (NEVER includes PICTURE_AI)
export const getChatCNRKeys = (): string[] => {
  const raw = (
    process.env.CHAT_CNR_API_KEY ||
    devEnvSecrets["CHAT_CNR_API_KEY"] ||
    process.env.GEMINI_API_KEY ||
    devEnvSecrets["GEMINI_API_KEY"] ||
    ""
  ).trim();
  return raw.split(",").map(k => k.trim()).filter(k => k.length > 0);
};

const picKeyFound = getPictureAIKey();
if (picKeyFound) {
  console.log(`[PİCTURE_AI] Secret successfully loaded and connected! (Dedicated SOLELY for image generation, length: ${picKeyFound.length})`);
} else {
  console.warn(`[PİCTURE_AI] Warning: PICTURE_AI secret not found in environment.`);
}

// Health check - At the top to respond quickly
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// App Version Check - Always fresh, no-cache
app.get("/api/version", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.json({
    version: "2.4.0",
    releaseDate: "2026-09-21",
    releaseNotes: [
      "Mobil ve masaüstü konumlandırma ve dokunmatik kontroller uçtan uca optimize edildi.",
      "Tüm kullanıcılar (Ücretsiz & Pro) için kesintisiz canlı güncelleme ve anlık bildirim sistemi.",
      "APK ve web önbellek kilitlemesini önleyen otomatik Cache-Busting altyapısı.",
      "Google Arama, Hey CNR sesli asistan ve akıllı profil hafızası performans geliştirmeleri."
    ]
  });
});

// AI Chat Proxy Route
app.post("/api/chat", async (req, res) => {
  const { prompt, history, systemInstruction, image, userApiKey, googleAccessToken, model } = req.body;
  const modelName = model || "gemini-2.5-flash"; 

  const generateWithKey = async (key: string, useSearch = true) => {
    const ai = new GoogleGenAI({ apiKey: key });
    const rawContents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (!msg.text) continue;
        rawContents.push({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.text }]
        });
      }
    }

    const currentParts: any[] = [{ text: prompt }];
    if (image) {
      currentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(',')[1]
        }
      });
    }

    rawContents.push({
      role: 'user',
      parts: currentParts
    });

    const contents: any[] = [];
    for (const item of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
        contents[contents.length - 1].parts.push({ text: "\n" }, ...item.parts);
      } else {
        contents.push({ role: item.role, parts: [...item.parts] });
      }
    }

    const config: any = {
      systemInstruction: systemInstruction,
      temperature: 0.1, 
      tools: [],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    if (useSearch) {
      config.tools.push({ googleSearch: {} });
    }

    if (contents.length > 0 && contents[0].role === 'model') {
       contents.unshift({ role: 'user', parts: [{ text: "Merhaba" }] });
    }

    let response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config
    });

    return response;
  };

  try {
    // If user provided their own key, try that FIRST
    if (userApiKey && String(userApiKey).trim().length > 10) {
      try {
        // Try with search first
        const response = await generateWithKey(userApiKey, true) as any;
        let usedSources: any[] = [];
        
        // Improved grounding metadata extraction
        const metadata = response.candidates?.[0]?.groundingMetadata || response.groundingMetadata;
        if (metadata?.groundingChunks) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web) {
              usedSources.push({
                web: { uri: chunk.web.uri, title: chunk.web.title }
              });
            }
          }
        }
        
        const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "";
        if (!responseText) {
          console.warn("AI returned empty text directly. Full response:", JSON.stringify(response, null, 2));
        }
        return res.json({ text: responseText, sources: usedSources, grounded: true });
      } catch (err: any) {
        const errorMsg = String(err.message || "");
        const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
        
        if (isQuota) {
          console.warn("User Key Error: QUOTA EXCEEDED");
          console.warn("User key search quota hit, trying without search...");
          try {
            const response = await generateWithKey(userApiKey, false) as any;
            const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "";
            return res.json({ text: responseText, sources: [], grounded: false });
          } catch (innerErr: any) {
            const innerErrorMsg = String(innerErr.message || "");
            if (innerErrorMsg.includes("429") || innerErrorMsg.includes("quota") || innerErrorMsg.includes("RESOURCE_EXHAUSTED")) {
               console.warn("User provided key completely failed due to QUOTA.");
            } else {
               console.warn("User provided key completely failed:", innerErrorMsg);
            }
            console.warn("Falling back to system keys...");
          }
        } else {
          console.warn("User provided key failed (non-quota):", errorMsg);
          console.warn("Falling back to system keys...");
        }
      }
    }

    const apiKeys = getChatCNRKeys();
    if (apiKeys.length === 0) {
      return res.status(400).json({ error: "API_KEY_MISSING" });
    }
    
    // Shuffle apiKeys to distribute load evenly
    for (let i = apiKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [apiKeys[i], apiKeys[j]] = [apiKeys[j], apiKeys[i]];
    }
    
    let lastError: any = null;
    let success = false;
    let responseData: any = null;

    // FIRST PASS: Try all keys with search
    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      try {
        console.log(`Trying system key ${i + 1}/${apiKeys.length} with Search...`);
        const response = await generateWithKey(currentKey, true) as any;
        let usedSources: any[] = [];
        
        const metadata = response.candidates?.[0]?.groundingMetadata || response.groundingMetadata;
        if (metadata?.groundingChunks) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web) {
              usedSources.push({ web: { uri: chunk.web.uri, title: chunk.web.title } });
            }
          }
        }
        
        const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "";
        if (!responseText) {
           console.warn(`Key ${i + 1} with search succeeded but returned no text.`);
           // If search returned no text, maybe try next key or continue?
           // Usually it's better to treat empty as failure to trigger second pass
           throw new Error("Empty response from search");
        }
        responseData = { text: responseText, sources: usedSources, grounded: true };
        success = true;
        break;
      } catch (error: any) {
        lastError = error;
        const errorMsg = String(error.message || "");
        // Simplify quota error log to avoid spam
        const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
        if (isQuota) {
          console.warn(`System Key ${i + 1} with Search failed due to QUOTA.`);
          continue;
        } else {
          console.warn(`System Key ${i + 1} with Search failed:`, errorMsg);
          continue;
        }
      }
    }

    // SECOND PASS: If search failed for ALL keys, try ALL keys WITHOUT search as fallback
    if (!success) {
      console.warn("All search attempts failed or returned empty results. Fallback: System keys without search...");
      for (let i = 0; i < apiKeys.length; i++) {
        const currentKey = apiKeys[i];
        try {
          console.log(`Trying system key ${i + 1}/${apiKeys.length} WITHOUT Search...`);
          const response = await generateWithKey(currentKey, false) as any;
          const responseText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "";
          if (!responseText) {
             console.warn(`Key ${i + 1} without search succeeded but returned no text.`);
             continue;
          }
          responseData = { text: responseText, sources: [], grounded: false };
          success = true;
          break;
        } catch (error: any) {
          lastError = error;
          const errorMsg = String(error.message || "");
          // Simplify quota error log to avoid spam
          const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
          if (isQuota) {
             console.warn(`System Key ${i + 1} WITHOUT Search failed due to QUOTA.`);
             continue;
          } else {
             console.warn(`System Key ${i + 1} WITHOUT Search failed:`, errorMsg);
             continue; // Try next key even if not quota, might be model refusal on one key
          }
        }
      }
    }

    if (success) {
      return res.json(responseData);
    } else {
      throw lastError;
    }

  } catch (error: any) {
    let errorMsg = String(error.message || "AI Error");
    
    // Cleanup API error if it contains JSON string
    if (errorMsg.includes('{"error":')) {
      try {
        const jsonStr = errorMsg.substring(errorMsg.indexOf('{'));
        const parsed = JSON.parse(jsonStr);
        if (parsed.error?.message) {
          errorMsg = parsed.error.message;
        }
      } catch (e) {}
    }

    // Cleanup ugly JSON parsing errors from Google APIs (like 503 HTML pages)
    if (errorMsg.includes("is not valid JSON") || errorMsg.includes("Unexpected token")) {
      errorMsg = "API Servisi geçici olarak yanıt vermiyor (Geçersiz yanıt). Lütfen tekrar deneyin.";
    }

    const errorType = errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid") ? "API_KEY_INVALID" : 
                      (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED") ? "QUOTA_EXCEEDED" : "GENERAL_ERROR");

    if (errorType === "QUOTA_EXCEEDED") {
       console.warn("Final Server AI Error: QUOTA_EXCEEDED");
    } else {
       console.error("Final Server AI Error:", errorMsg);
    }
    
    const status = errorType === "QUOTA_EXCEEDED" ? 429 : 500;
    res.status(status).json({ 
      error: errorType === "QUOTA_EXCEEDED" ? "QUOTA_EXCEEDED" : errorMsg,
      errorType: errorType
    });
  }
});

// Dedicated Google Search & Universal Language Translation Route
app.post("/api/google-search", async (req, res) => {
  const { query, userLanguage, targetLanguage, userApiKey } = req.body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Arama sorgusu belirtilmelidir." });
  }

  const detectedTargetLang = targetLanguage || userLanguage || "Türkçe";
  const modelName = "gemini-2.5-flash";

  const systemInstruction = `Sen Google Arama ve Çok Dilli Çeviri Motorusun (Chat_CNR Google Search & Universal Translation Engine).
KULLANICININ GOOGLE DİLİ: "${detectedTargetLang}".

TEMEL AMACIN VE TAVİZSİZ KURALLARIN:
1. Kullanıcının arama sorgusu ("${query}") için 'googleSearch' aracını kullanarak Google üzerinden dünya çapındaki en taze, en güncel ve en zengin internet verilerini topla.
2. [TAM VE EKSİKSİZ ÇEVİRİ KURALI - HER ŞEYİ KULLANICININ DİLİNE ÇEVİR]:
Kullanıcı Google'ını "${detectedTargetLang}" dilinde kullanmaktadır.
İnternetten bulduğun sonuçlar, kaynaklar, haberler, makaleler veya web siteleri İngilizce, Çince, Rusça, Fransızca, Almanca veya hangi dilde olursa olsun;
- Bütün özetleri ve açıklamaları,
- Önemli maddeleri, gerçekleri ve bulguları,
- Ziyaret ettiğin web sayfalarının başlıklarını ve kaynak içeriklerini,
- İpuçlarını ve cevapları
İSTİSNASIZ BİR ŞEKİLDE eksiksiz olarak kullanıcının dili olan "${detectedTargetLang}" diline çevirerek sunacaksın!
Asla yabancı dilde çevrilmemiş cümle veya anlaşılmaz yabancı terim bırakma.

3. YANIT FORMATI:
- **Net ve Kapsamlı Özet**: Kullanıcının sorusuna doğrudan, akıcı ve eksiksiz yanıt (tamamen ${detectedTargetLang} dilinde).
- **Önemli Bulgular ve Ayrıntılar**: Madde madde en can alıcı güncel bilgiler.
- **İncelenen Web Kaynakları**: Ziyaret edilen sitelerin ne hakkında olduğunu "${detectedTargetLang}" dilinde özetle.`;

  const runSearchWithKey = async (key: string) => {
    const ai = new GoogleGenAI({ apiKey: key });
    const searchConfig: any = {
      systemInstruction,
      temperature: 0.2,
      tools: [{ googleSearch: {} }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
      ],
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Google Arama Sorgusu: "${query.trim()}". Lütfen Google'da ara ve bütün sonuçları eksiksiz bir şekilde "${detectedTargetLang}" diline çevirerek sun.`,
            },
          ],
        },
      ],
      config: searchConfig,
    });
    return response;
  };

  try {
    // 1. Try userApiKey if provided
    if (userApiKey && String(userApiKey).trim().length > 10) {
      try {
        const response = (await runSearchWithKey(userApiKey)) as any;
        const metadata = response.candidates?.[0]?.groundingMetadata || response.groundingMetadata;
        const usedSources: any[] = [];
        if (metadata?.groundingChunks) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web) {
              usedSources.push({
                uri: chunk.web.uri,
                title: chunk.web.title,
              });
            }
          }
        }
        const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return res.json({
          text: responseText,
          sources: usedSources,
          searchQueries: metadata?.webSearchQueries || [],
          detectedLanguage: detectedTargetLang,
          grounded: true,
        });
      } catch (err: any) {
        console.warn("User key failed for Google Search, falling back to system keys...");
      }
    }

    // 2. Try system keys
    const apiKeys = getChatCNRKeys();
    if (apiKeys.length === 0) {
      return res.status(400).json({ error: "API anahtarı tanımlanmamış." });
    }
    // Shuffle
    for (let i = apiKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [apiKeys[i], apiKeys[j]] = [apiKeys[j], apiKeys[i]];
    }

    let lastError: any = null;
    for (let i = 0; i < apiKeys.length; i++) {
      const currentKey = apiKeys[i];
      try {
        const response = (await runSearchWithKey(currentKey)) as any;
        const metadata = response.candidates?.[0]?.groundingMetadata || response.groundingMetadata;
        const usedSources: any[] = [];
        if (metadata?.groundingChunks) {
          for (const chunk of metadata.groundingChunks) {
            if (chunk.web) {
              usedSources.push({
                uri: chunk.web.uri,
                title: chunk.web.title,
              });
            }
          }
        }
        const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return res.json({
          text: responseText,
          sources: usedSources,
          searchQueries: metadata?.webSearchQueries || [],
          detectedLanguage: detectedTargetLang,
          grounded: true,
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err.message || "");
        if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          console.warn(`System key ${i + 1} Google Search quota hit, trying next key...`);
          continue;
        }
        console.warn(`System key ${i + 1} Google Search failed:`, msg);
      }
    }

    throw lastError || new Error("Arama sonuçları alınamadı.");
  } catch (error: any) {
    const errorMsg = String(error.message || "Google arama hatası");
    const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");
    res.status(isQuota ? 429 : 500).json({
      error: isQuota ? "QUOTA_EXCEEDED" : errorMsg,
    });
  }
});


// Text to Speech Proxy Route
app.post("/api/tts", async (req, res) => {
  const { text, userApiKey, language } = req.body;
  const modelName = "gemini-3.1-flash-tts-preview";

  const generateWithKey = async (key: string) => {
    const ai = new GoogleGenAI({ apiKey: key });
    
    // Choose appropriate language and voice based on input lang
    let ttsLang = "tr-tr";
    let voice = "Puck"; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    
    if (language === 'en') {
        ttsLang = "en-us";
        voice = "Zephyr";
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        }
      }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error("No audio generated by the AI.");
    }

    return audioBase64;
  };

  try {
    if (userApiKey && String(userApiKey).trim().length > 10) {
      try {
        const audioUrl = await generateWithKey(userApiKey);
        return res.json({ audioBase64: audioUrl });
      } catch (err: any) {
        console.warn("User provided key failed for TTS:", err.message);
      }
    }

    const apiKeys = getChatCNRKeys();
    if (apiKeys.length === 0) {
      return res.status(400).json({ error: "API_KEY_MISSING" });
    }

    for (let i = apiKeys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [apiKeys[i], apiKeys[j]] = [apiKeys[j], apiKeys[i]];
    }

    let lastError: any = null;
    let successUrl: string | null = null;

    for (let i = 0; i < apiKeys.length; i++) {
      try {
        successUrl = await generateWithKey(apiKeys[i]);
        break;
      } catch (error: any) {
        lastError = error;
      }
    }

    if (successUrl) {
      return res.json({ audioBase64: successUrl });
    } else {
      throw lastError;
    }

  } catch (error: any) {
    const errorMsg = String(error.message || "Ses üretim hatası");
    console.error("TTS Error:", errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});

// Dedicated Image Generation Route - Powered SOLELY by PICTURE_AI secret
app.get("/api/picture-ai/status", (req, res) => {
  const key = getPictureAIKey();
  res.json({
    connected: !!key && key.length > 5,
    keyMasked: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    target: "SADECE_GORUNTU_URETIMI"
  });
});

app.post("/api/generate-image", async (req, res) => {
  const { prompt, aspectRatio = "1:1", userApiKey } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Görsel üretimi için geçerli bir açıklama (prompt) gereklidir." });
  }

  // Strictly use PICTURE_AI key for image generation (or user-provided key if supplied)
  const pictureKey = (userApiKey && String(userApiKey).trim().length > 10)
    ? String(userApiKey).trim()
    : getPictureAIKey();

  if (!pictureKey) {
    return res.status(400).json({
      error: "PİCTURE_AI gizli anahtarı bulunamadı. Lütfen AI Studio Secrets içerisinde PİCTURE_AI tanımlandığından emin olun."
    });
  }

  const ai = new GoogleGenAI({ apiKey: pictureKey });
  const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
  const selectedRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

  // Attempt image generation with supported image models
  const candidateModels = [
    "gemini-3.1-flash-lite-image",
    "gemini-3.1-flash-image",
    "gemini-2.5-flash-image",
    "gemini-3-pro-image"
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      console.log(`[PİCTURE_AI] Generating image with model: ${model}, ratio: ${selectedRatio}...`);
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: prompt.trim() }]
        },
        config: {
          imageConfig: {
            aspectRatio: selectedRatio as any
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      let foundBase64: string | null = null;
      let textDesc = "";

      for (const part of parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/png";
          foundBase64 = `data:${mime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          textDesc += part.text + " ";
        }
      }

      if (foundBase64) {
        console.log(`[PİCTURE_AI] Image generated successfully using model ${model}`);
        return res.json({
          imageUrl: foundBase64,
          text: textDesc.trim() || `"${prompt.trim()}" için görsel Chat_CNR (PİCTURE_AI) ile başarıyla oluşturuldu.`,
          prompt: prompt.trim(),
          aspectRatio: selectedRatio,
          modelUsed: model
        });
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err.message || "");
      console.warn(`[PİCTURE_AI] Model ${model} generation attempt:`, errMsg.slice(0, 150));
      if (errMsg.includes("404") || errMsg.includes("not found")) {
        continue;
      }
    }
  }

  const errorMsg = String(lastError?.message || "Görsel üretilemedi.");
  const isQuota = errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("RESOURCE_EXHAUSTED");

  return res.status(isQuota ? 429 : 500).json({
    error: isQuota 
      ? "PİCTURE_AI anahtarının görüntü üretim kotası şu anda beklemede veya dolmuş durumda. Lütfen birkaç saniye sonra tekrar deneyin veya AI Studio üzerinden kotanızı kontrol edin."
      : errorMsg,
    details: errorMsg
  });
});

app.post("/api/analyze-preferences", async (req, res) => {
  const { history, currentBio, currentInterests, userApiKey } = req.body;
  if (!history || history.length === 0) return res.json({});

  const modelName = "gemini-2.5-flash"; 
  
  const generateWithKey = async (key: string) => {
    const ai = new GoogleGenAI({ apiKey: key });
    
    const recentHistory = history.slice(-40);
    const conversationStr = recentHistory.map((m: any) => `${m.role}: ${m.text}`).join("\n");
    
    const prompt = `Aşağıdaki sohbet geçmişini analiz ederek kullanıcının ZEVKLERİ, İLGİ ALANLARI, SEVDİĞİ/NEFRET ETTİĞİ ŞEYLER, MESLEĞİ, HOBİLERİ, KONUŞMA STİLİ TERCİHLERİ, DETAYLI ÖZEL BİLGİLERİ (Örn: isimler, mekanlar, anılar, planlar) ve GENEL PROFİLİ (Yapay zekanın nasıl davranmasını istediği) hakkında çok detaylı çıkarımlar yap. Amacımız yapay zekanın her kullanıcıya GÖRE ÖZELLEŞMİŞ ve UZUN SÜRELİ HAFIZAYA SAHİP yanıtlar vermesidir.

[ÖNEMLİ KURALLAR]
1. MEVCUT BİLİNENLERİ KORU: "Mevcut Hafıza" ve "Mevcut İlgi Alanları" içerisindeki doğru, kalıcı ve geçmiş bilgileri KESİNLİKLE silme veya unutma. Onları yeni keşfedilen bilgilerle SENTEZLE ve koruyarak zenginleştir. Hafızayı daraltma, genişlet!
2. TEKİL BİLGİ BİRİKİMİ: Eğer kullanıcı son mesajlarda belirli bir şeyden bahsetmediyse ama "Mevcut Hafıza"da bu zaten kayıtlıysa, o bilgiyi kaybetme, hafızada tutmaya devam et. Yalnızca kullanıcı açıkça bir özelliğini/durumunu değiştirdiğini söylerse (örn: "artık yazılımcı değilim öğrenciyim") eski bilgiyi değiştir.
3. KİŞİSELLEŞTİRME: Kullanıcının mesleğini (örneğin Doruk oyun geliştiricisi, tasarımcı vb.), ilgi alanlarını ve Chat_CNR'dan beklentilerini net bir şekilde sentezle.

Mevcut Hafıza (Bio): ${currentBio || "Yok"}
Mevcut İlgi Alanları: ${currentInterests ? currentInterests.join(", ") : "Yok"}

Sohbet Geçmişi (En Son Mesajlar):
${conversationStr}

Sonucu AŞAĞIDAKİ GİBİ SADECE JSON formatında döndür. Hiçbir fazladan yazı yazma, sadece JSON.
{
  "bio": "Kullanıcının tüm geçmiş tercihleri, anıları ve konuşma tercihlerinin ÇOK DETAYLI, sürekli genişleyen bellek özeti.",
  "interests": ["güncellenmiş", "ve", "eski", "ilgi", "alanlarının", "birlesimi"]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text) || "{}";
    try {
        return JSON.parse(text);
    } catch(e) {
        return {};
    }
  };

  try {
    let keyToUse = userApiKey;
    if (!keyToUse) {
       const apiKeys = getChatCNRKeys();
       if (apiKeys.length === 0) return res.status(400).json({ error: "No API Key" });
       keyToUse = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    }

    const data = await generateWithKey(keyToUse);
    res.json(data);
  } catch (err: any) {
    if (err?.status === 503 || err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE")) {
      console.warn("Background analysis skipped: Model is experiencing high demand (503).");
      return res.json({});
    }
    console.warn("Analyze Prefs Error (Background):", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Vercel handles serving static files automatically, but for local container execution we start standard server.
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

if (!isVercel) {
  startLocalServer();
}

async function startLocalServer() {
  const PORT = 3000;
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
    
    // Explicit SPA fallback for development - only for non-file requests
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip files (requests with extensions)
      if (url.includes('.') && !url.endsWith('.html')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Export for Vercel
export default app;
