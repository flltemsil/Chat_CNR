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
  // Debug info now reports server-side status
  getDebugInfo(isPro: boolean = false) {
    return { 
      totalKeys: "Server-Side", 
      sourceVar: "SECURE_PROXY", 
      maskedKeys: ["******** (Gizli)"] 
    };
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/chat/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      return data.imageUrl || '';
    } catch (error) {
      console.error("Image Gen Error:", error);
      return '';
    }
  }

  async textToSpeech(text: string): Promise<string> {
    // TTS is currently a placeholder or can be implemented similarly
    return '';
  }

  async *sendMessageStream(prompt: string, history: Message[] = [], currentImage?: string, userName?: string, userEmail?: string, isChatMode: boolean = false, modelName: string = 'gemini-1.5-flash'): AsyncGenerator<{ text: string; sources: GroundingChunk[] }> {
    const isPro = modelName.includes('pro');
    
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

    const systemInstruction = `${baseInstruction}\n\n[SİSTEM ZAMAN BİLGİSİ - KRİTİK]\nŞu anki gerçek zamanlı tarih: ${dateStr}\nŞu anki saat: ${timeStr}\n\n${identityInstruction}İsmini her mesajda tekrarlama, sadece doğal olduğunda veya sohbetin başında kullan. Kullanıcının hitap şekline ve üslubuna uyum sağla. Her zaman bu tarihi baz alarak güncel bilgi ver.`;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history,
          model: modelName,
          systemInstruction,
          isPro
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          throw new Error(errData.error || `Sunucu hatası (${response.status})`);
        } else {
          const text = await response.text();
          console.error("Non-JSON Error Response:", text.substring(0, 200));
          throw new Error(`Sunucu hatası (${response.status}): Beklenmedik yanıt formatı. Lütfen sunucu loglarını kontrol edin.`);
        }
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream reader not available");

      const decoder = new TextDecoder();
      let fullText = "";
      let lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        
        const lines = lineBuffer.split('\n');
        // Keep the last partial line in the buffer
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.substring(6);
            if (dataStr === '[DONE]') break;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.error) throw new Error(data.error);
              if (data.text) {
                fullText += data.text;
                yield { text: fullText, sources: [] };
              }
            } catch (e) {
              console.warn("Parse error in stream line:", line, e);
            }
          }
        }
      }
      
      // Process any remaining data in the buffer
      if (lineBuffer.trim().startsWith('data: ')) {
        const dataStr = lineBuffer.trim().substring(6);
        if (dataStr !== '[DONE]') {
          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              fullText += data.text;
              yield { text: fullText, sources: [] };
            }
          } catch (e) {}
        }
      }
    } catch (error: any) {
      console.error("[ChatCNR] Proxy Error:", error);
      throw error;
    }
  }

  async sendMessage(prompt: string, history: Message[] = [], currentImage?: string, userName?: string, userEmail?: string, isChatMode: boolean = false, modelName: string = 'gemini-1.5-flash'): Promise<{ text: string; sources: GroundingChunk[] }> {
    // For single messages, we can just use the stream and take the final result
    let finalResult = { text: "", sources: [] as GroundingChunk[] };
    const stream = this.sendMessageStream(prompt, history, currentImage, userName, userEmail, isChatMode, modelName);
    
    for await (const chunk of stream) {
      finalResult = chunk;
    }
    
    return finalResult;
  }
}

export const chatCNRService = new ChatCNRService();
