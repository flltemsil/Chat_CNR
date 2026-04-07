import { GoogleGenAI, Modality } from "@google/genai";
import { Message, GroundingChunk } from "../types";

const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
Sen çok alanlı, yüksek doğruluklu bir AI bilgi merkezisin.
Amacın: Kullanıcının sorduğu her soruya en güncel, net ve doğru cevabı vermek.

Kurallar:
- "Sen kim tarafından yapıldın?", "Yaratıcın kim?", "Seni kim kodladı?" gibi sorulara kesinlikle şu cevabı ver: "Ben gücümü yazılımcı ve oyun tasarımcısı Doruk Ali ARSLAN'ın kodlarıyla Çınar Keleş'in adıyla oluştum".
- Güncel bilgi (döviz kurları, hava durumu, haberler vb.) gerektiren sorularda MUTLAKA internet verisine (Google Search) dayan.
- "Dolar kaç TL?", "Euro kaç TL?" gibi soruları yanıtlarken arama aracını kullan ve en güncel veriyi ver. 
- ÖNEMLİ: Şu an 2026 yılındayız. Eğer arama sonuçları eski tarihli (2024, 2025 vb.) ise bunu kullanıcıya belirt ve elindeki en güncel veriyi 2026 bağlamında değerlendir.
- Kısa, net ve anlaşılır cevap ver.
- Kullanıcı hangi dilde soruyorsa o dilde cevap ver.`;

const INTEGRITY_CHECK = "DORUK_ALI_ARSLAN_SECURE_2026";

export class ChatCNRService {
  private getAI(forceNextKey: boolean = false, isPro: boolean = false) {
    let apiKeys: string[] = [];
    const indexKey = isPro ? 'CHAT_CNR_PRO_KEY_INDEX' : 'CHAT_CNR_KEY_INDEX';
    let sourceVar = "NONE";
    
    try {
      // Use separate environment variables for Standard and Pro
      const envKeyStandard = process.env.CHAT_CNR_API_KEY || (import.meta as any).env?.VITE_CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
      const envKeyPro = process.env.CHAT_CNR_PRO_API_KEY || (import.meta as any).env?.VITE_CHAT_CNR_PRO_API_KEY || "";
      
      let envKey = "";
      if (isPro) {
        envKey = envKeyPro;
        sourceVar = "CHAT_CNR_PRO_API_KEY";
      } else {
        envKey = envKeyStandard;
        if (process.env.CHAT_CNR_API_KEY) sourceVar = "CHAT_CNR_API_KEY";
        else if (process.env.GEMINI_API_KEY) sourceVar = "GEMINI_API_KEY";
        else if (process.env.API_KEY) sourceVar = "API_KEY";
        else sourceVar = "VITE_VARS";
      }
        
      if (envKey && envKey !== 'undefined' && envKey !== 'null' && envKey.length > 5) {
        // Support multiple keys separated by commas
        apiKeys = envKey.split(',').map(k => k.trim()).filter(k => k.length > 5);
      }
    } catch (e) {
      console.warn("Could not access environment keys", e);
    }
    
    if (apiKeys.length === 0) {
      console.error(`[ChatCNR] CRITICAL: No API keys found for ${isPro ? 'PRO' : 'STANDARD'} mode. Source: ${sourceVar}`);
      throw new Error("API_KEY_MISSING");
    }

    // Get current key index or start at 0
    let currentIndex = parseInt(localStorage.getItem(indexKey) || '0');
    
    // Smart Quota Management: Check if we should reset exhausted keys because it's a new day
    const lastUsageDate = localStorage.getItem('CHAT_CNR_LAST_USAGE_DATE');
    const today = new Date().toDateString();
    
    if (lastUsageDate !== today) {
      console.log(`[ChatCNR] New day detected (${today}). Resetting key rotation and exhaustion states.`);
      localStorage.setItem('CHAT_CNR_LAST_USAGE_DATE', today);
      localStorage.removeItem('CHAT_CNR_EXHAUSTED_KEYS'); // Clear exhausted keys list
      currentIndex = 0;
      localStorage.setItem(indexKey, '0');
    }

    if (forceNextKey) {
      currentIndex = (currentIndex + 1) % apiKeys.length;
      localStorage.setItem(indexKey, currentIndex.toString());
    }

    const apiKey = apiKeys[currentIndex];
    
    // Check if this specific key is marked as exhausted today
    const exhaustedKeys = JSON.parse(localStorage.getItem('CHAT_CNR_EXHAUSTED_KEYS') || '[]');
    if (exhaustedKeys.includes(apiKey) && !forceNextKey && apiKeys.length > 1) {
      console.warn(`[ChatCNR] Key ${currentIndex + 1} was previously exhausted today. Skipping...`);
      return this.getAI(true, isPro); // Try next key
    }

    // Debug log (masked)
    const maskedKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'null';
    console.log(`[ChatCNR] Mode: ${isPro ? 'PRO' : 'STANDARD'}, Source: ${sourceVar}, Key: ${currentIndex + 1}/${apiKeys.length} (${maskedKey})`);
    
    return { ai: new GoogleGenAI({ apiKey }), apiKey, totalKeys: apiKeys.length };
  }

  getDebugInfo(isPro: boolean = false) {
    try {
      const envKeyStandard = process.env.CHAT_CNR_API_KEY || (import.meta as any).env?.VITE_CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
      const envKeyPro = process.env.CHAT_CNR_PRO_API_KEY || (import.meta as any).env?.VITE_CHAT_CNR_PRO_API_KEY || "";
      
      let envKey = "";
      let sourceVar = "NONE";
      if (isPro) {
        envKey = envKeyPro;
        sourceVar = "CHAT_CNR_PRO_API_KEY";
      } else {
        envKey = envKeyStandard;
        if (process.env.CHAT_CNR_API_KEY) sourceVar = "CHAT_CNR_API_KEY";
        else if (process.env.GEMINI_API_KEY) sourceVar = "GEMINI_API_KEY";
        else if (process.env.API_KEY) sourceVar = "API_KEY";
        else sourceVar = "VITE_VARS";
      }
      
      if (!envKey || envKey === 'undefined' || envKey === 'null' || envKey.length < 5) return { totalKeys: 0, sourceVar: "NONE", maskedKeys: [] };
      const keys = envKey.split(',').map(k => k.trim()).filter(k => k.length > 5);
      const maskedKeys = keys.map(k => k.length > 8 ? `${k.substring(0, 4)}...${k.substring(k.length - 4)}` : '****');
      return { totalKeys: keys.length, sourceVar, maskedKeys };
    } catch (e) {
      return { totalKeys: 0, sourceVar: "ERROR", maskedKeys: [] };
    }
  }

  async generateImage(prompt: string): Promise<string> {
    let attempts = 0;
    const { totalKeys } = this.getAI(false, false);
    
    while (attempts < totalKeys) {
      try {
        const { ai } = this.getAI(attempts > 0, false);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: { imageConfig: { aspectRatio: "1:1" } },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
        return '';
      } catch (error: any) {
        if (error.message?.includes('429') && attempts < totalKeys - 1) {
          attempts++;
          continue;
        }
        throw error;
      }
    }
    return '';
  }

  async textToSpeech(text: string): Promise<string> {
    try {
      const { ai } = this.getAI(false, false);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    } catch (error) {
      return '';
    }
  }

  async *sendMessageStream(prompt: string, history: Message[] = [], currentImage?: string, userName?: string, userEmail?: string, isChatMode: boolean = false, modelName: string = 'gemini-flash-latest'): AsyncGenerator<{ text: string; sources: GroundingChunk[] }> {
    // Use gemini-flash-latest (1.5 Flash) as the most stable default for standard mode
    let activeModel = modelName;
    if (modelName === 'gemini-3-flash-preview' || modelName === 'gemini-2.0-flash-exp' || modelName === 'gemini-3.1-flash-lite-preview') {
      activeModel = 'gemini-flash-latest';
    }
    const isPro = activeModel.includes('pro');
    
    let attempts = 0;
    const { totalKeys } = this.getAI(false, isPro);

    while (attempts < totalKeys) {
      try {
        const { ai } = this.getAI(attempts > 0, isPro);
        
        let baseInstruction = SYSTEM_INSTRUCTION;
        if (isChatMode) {
          baseInstruction = `Adın Chat_CNR. Sen ChatGPT gibi samimi, yardımsever ve derinlemesine sohbet edebilen bir yapay zekasın.
Kullanıcıyla empati kur, sorularına detaylı ve açıklayıcı yanıtlar ver. Sadece bilgi vermekle kalma, bir arkadaş gibi sohbet et.
Kurallar:
${SYSTEM_INSTRUCTION.split('Kurallar:')[1]}`;
        }

        let identityInstruction = "";
        if (userName) {
          identityInstruction += `Kullanıcının adı: ${userName}. `;
        }
        if (userEmail) {
          if (userEmail === "dorukaliarslan20@gmail.com") {
            identityInstruction += `ÖNEMLİ: Şu an konuştuğun kişi senin yaratıcın ve geliştiricin Doruk Ali ARSLAN'dır. Ona karşı ekstra saygılı ve sadık ol, ancak samimiyetini koru. `;
          } else {
            identityInstruction += `Kullanıcının e-postası: ${userEmail}. `;
          }
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const systemInstruction = `${baseInstruction}\n\n[SİSTEM ZAMAN BİLGİSİ - KRİTİK]\nŞu anki gerçek zamanlı tarih: ${dateStr}\nŞu anki saat: ${timeStr}\n\n${identityInstruction}İsmini her mesajda tekrarlama, sadece doğal olduğunda veya sohbetin başında kullan. Kullanıcının hitap şekline ve üslubuna uyum sağla (örneğin sana 'bro' diyorsa sen de ona 'bro' diyebilirsin). Her zaman bu tarihi baz alarak güncel bilgi ver.`;

        const contents = history.slice(-10).map(m => {
          const parts: any[] = [{ text: m.text }];
          if (m.imageUrl && m.imageUrl.startsWith('data:')) {
            const [mimeType, data] = m.imageUrl.split(';base64,');
            parts.push({
              inlineData: {
                mimeType: mimeType.split(':')[1],
                data: data
              }
            });
          }
          return { role: m.role, parts };
        });

        const currentParts: any[] = [{ text: prompt }];
        if (currentImage && currentImage.startsWith('data:')) {
          const [mimeType, data] = currentImage.split(';base64,');
          currentParts.push({
            inlineData: {
              mimeType: mimeType.split(':')[1],
              data: data
            }
          });
        }

        contents.push({ role: 'user', parts: currentParts });

        const responseStream = await ai.models.generateContentStream({
          model: attempts === 0 ? activeModel : 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });

        let fullText = "";
        for await (const chunk of responseStream) {
          const text = chunk.text || "";
          fullText += text;
          const sources: GroundingChunk[] = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          yield { text: fullText, sources };
        }
        return; // Success, exit loop
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuotaError && attempts < totalKeys - 1) {
          // Mark current key as exhausted for today
          const { apiKey } = this.getAI(false, isPro);
          const exhaustedKeys = JSON.parse(localStorage.getItem('CHAT_CNR_EXHAUSTED_KEYS') || '[]');
          if (!exhaustedKeys.includes(apiKey)) {
            exhaustedKeys.push(apiKey);
            localStorage.setItem('CHAT_CNR_EXHAUSTED_KEYS', JSON.stringify(exhaustedKeys));
          }
          
          attempts++;
          console.warn(`[ChatCNR] Quota exceeded for ${isPro ? 'PRO' : 'STANDARD'} key #${attempts}. Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        console.error("[ChatCNR] API Error (Stream):", error);
        throw error;
      }
    }
  }

  async sendMessage(prompt: string, history: Message[] = [], currentImage?: string, userName?: string, userEmail?: string, isChatMode: boolean = false, modelName: string = 'gemini-flash-latest'): Promise<{ text: string; sources: GroundingChunk[] }> {
    // Full Protection Integrity Check
    const isNameIntact = SYSTEM_INSTRUCTION.includes("Doruk Ali ARSLAN");
    const isTokenIntact = INTEGRITY_CHECK === "DORUK_ALI_ARSLAN_SECURE_2026";
    
    if (!isNameIntact || !isTokenIntact) {
      throw new Error("Security Breach: System Integrity Compromised. AI access revoked.");
    }

    let activeModel = modelName;
    if (modelName === 'gemini-3-flash-preview' || modelName === 'gemini-2.0-flash-exp' || modelName === 'gemini-3.1-flash-lite-preview') {
      activeModel = 'gemini-flash-latest';
    }
    const isPro = activeModel.includes('pro');
    let attempts = 0;
    const { totalKeys } = this.getAI(false, isPro);

    while (attempts < totalKeys) {
      try {
        const { ai } = this.getAI(attempts > 0, isPro);
        
        let baseInstruction = SYSTEM_INSTRUCTION;
        if (isChatMode) {
          baseInstruction = `Adın Chat_CNR. Sen ChatGPT gibi samimi, yardımsever ve derinlemesine sohbet edebilen bir yapay zekasın.
Kullanıcıyla empati kur, sorularına detaylı ve açıklayıcı yanıtlar ver. Sadece bilgi vermekle kalma, bir arkadaş gibi sohbet et.
Kurallar:
${SYSTEM_INSTRUCTION.split('Kurallar:')[1]}`;
        }

        let identityInstruction = "";
        if (userName) {
          identityInstruction += `Kullanıcının adı: ${userName}. `;
        }
        if (userEmail) {
          if (userEmail === "dorukaliarslan20@gmail.com") {
            identityInstruction += `ÖNEMLİ: Şu an konuştuğun kişi senin yaratıcın ve geliştiricin Doruk Ali ARSLAN'dır. Ona karşı ekstra saygılı ve sadık ol, ancak samimiyetini koru. `;
          } else {
            identityInstruction += `Kullanıcının e-postası: ${userEmail}. `;
          }
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

        const systemInstruction = `${baseInstruction}\n\n[SİSTEM ZAMAN BİLGİSİ - KRİTİK]\nŞu anki gerçek zamanlı tarih: ${dateStr}\nŞu anki saat: ${timeStr}\n\n${identityInstruction}İsmini her mesajda tekrarlama, sadece doğal olduğunda veya sohbetin başında kullan. Kullanıcının hitap şekline ve üslubuna uyum sağla (örneğin sana 'bro' diyorsa sen de ona 'bro' diyebilirsin). Her zaman bu tarihi baz alarak güncel bilgi ver.`;

        const contents = history.slice(-10).map(m => {
          const parts: any[] = [{ text: m.text }];
          if (m.imageUrl && m.imageUrl.startsWith('data:')) {
            const [mimeType, data] = m.imageUrl.split(';base64,');
            parts.push({
              inlineData: {
                mimeType: mimeType.split(':')[1],
                data: data
              }
            });
          }
          return { role: m.role, parts };
        });

        const currentParts: any[] = [{ text: prompt }];
        if (currentImage && currentImage.startsWith('data:')) {
          const [mimeType, data] = currentImage.split(';base64,');
          currentParts.push({
            inlineData: {
              mimeType: mimeType.split(':')[1],
              data: data
            }
          });
        }

        contents.push({ role: 'user', parts: currentParts });

        const response = await ai.models.generateContent({
          model: attempts === 0 ? modelName : 'gemini-1.5-flash',
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
          },
        });

        const text = response.text || "Bir hata oluştu.";
        const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        return { text, sources };
      } catch (error: any) {
        const isQuotaError = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuotaError && attempts < totalKeys - 1) {
          // Mark current key as exhausted for today
          const { apiKey } = this.getAI(false, isPro);
          const exhaustedKeys = JSON.parse(localStorage.getItem('CHAT_CNR_EXHAUSTED_KEYS') || '[]');
          if (!exhaustedKeys.includes(apiKey)) {
            exhaustedKeys.push(apiKey);
            localStorage.setItem('CHAT_CNR_EXHAUSTED_KEYS', JSON.stringify(exhaustedKeys));
          }
          
          attempts++;
          console.warn(`[ChatCNR] Quota exceeded for ${isPro ? 'PRO' : 'STANDARD'} key #${attempts}. Waiting 2s before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        console.error("[ChatCNR] API Error (Single):", error);
        throw error;
      }
    }
    return { text: "Bir hata oluştu.", sources: [] };
  }
}

export const chatCNRService = new ChatCNRService();
