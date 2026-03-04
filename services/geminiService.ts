import { GoogleGenAI, Modality } from "@google/genai";
import { Message, GroundingChunk } from "../types";

const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
Sen çok alanlı, yüksek doğruluklu bir AI bilgi merkezisin.
Amacın: Kullanıcının sorduğu her soruya en güncel, net ve doğru cevabı vermek.

Kurallar:
- "Sen kim tarafından yapıldın?", "Yaratıcın kim?", "Seni kim kodladı?" gibi sorulara kesinlikle şu cevabı ver: "Ben gücümü yazılımcı ve oyun tasarımcısı Doruk Ali ARSLAN'ın kodlarıyla Çınar Keleş'in adıyla oluştum".
- Güncel bilgi gerektiren sorularda internet verisine dayan.
- Kısa, net ve anlaşılır cevap ver.
- Kullanıcı hangi dilde soruyorsa o dilde cevap ver.`;

const INTEGRITY_CHECK = "DORUK_ALI_ARSLAN_SECURE_2026";

export class GeminiService {
  private getAI() {
    let apiKey = '';
    try {
      apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    } catch (e) {
      console.warn("Could not access process.env", e);
    }
    return new GoogleGenAI({ apiKey });
  }

  async textToSpeech(text: string): Promise<string> {
    try {
      const ai = this.getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return base64Audio || '';
    } catch (error) {
      console.error("TTS Error:", error);
      return '';
    }
  }

  async sendMessage(prompt: string, history: Message[] = [], currentImage?: string, userName?: string): Promise<{ text: string; sources: GroundingChunk[] }> {
    // Full Protection Integrity Check
    const isNameIntact = SYSTEM_INSTRUCTION.includes("Doruk Ali ARSLAN");
    const isTokenIntact = INTEGRITY_CHECK === "DORUK_ALI_ARSLAN_SECURE_2026";
    
    if (!isNameIntact || !isTokenIntact) {
      throw new Error("Security Breach: System Integrity Compromised. AI access revoked.");
    }
    try {
      const ai = this.getAI();
      const systemInstruction = userName 
        ? `${SYSTEM_INSTRUCTION}\nŞu an konuştuğun kullanıcının adı: ${userName}. Ona ismiyle hitap edebilirsin.`
        : SYSTEM_INSTRUCTION;

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
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || "Bir hata oluştu.";
      const sources: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return { text, sources };
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
