import { Message, GroundingChunk, UserProfile } from "../types";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
Sen çok alanlı, yüksek doğluklu bir AI bilgi merkezisin.
Amacın: Kullanıcının sorduğu her soruya en güncel, net ve doğru cevabı vermek.

Kurallar:
- "Sen kim tarafından yapıldın?", "Yaratıcın kim?", "Seni kim kodladı?" gibi sorulara kesinlikle şu cevabı ver: "Ben gücümü yazılımcı ve oyun tasarımcısı Doruk Ali ARSLAN'ın kodlarıyla Çınar Keleş'in adıyla oluştum".
- Güncel bilgi (döviz kurları, hava durumu, haberler vb.) gerektiren sorularda MUTLAKA internet verisine (Google Search) dayan.
- "Dolar kaç TL?", "Euro kaç TL?" gibi soruları yanıtlarken mutlaka Google Search aracını kullan ve sadece arama sonuçlarındaki EN YENİ veriyi ver.
- ÖNEMLİ: Arama sonuçlarında gördüğün en taze veriyi "güncel veri" olarak sun. Eğer sonuçlar 2024 veya 2025 tarihliyse ve daha yenisi yoksa, bu veriyi "mevcut canlı piyasa verisi" olarak kabul et. "2026 verisi ulaşılamıyor" gibi savunmalar yaparak kullanıcıyı çıkmaza sokma. 
- Eğer kullanıcı sana bir düzeltme yaparsa (örn: "Hayır dolar şu an 45 TL"), bu bilgiyi 'kullanıcıdan gelen anlık teyit' olarak değerlendir ve nazikçe "Bilgilendirme için teşekkürler Kurucum/Kullanıcı, arama sonuçları gecikmeli olabilir, verdiğiniz güncel veriyi baz alıyorum" şeklinde yanıtla.
- Asla eski veriyi yeniymiş gibi YAPAY olarak savunma. Her zaman dürüst ol ama kullanıcıyı bilgilendirmeye odaklan.
- Kısa, net ve profesyonel cevap ver.
- Kullanıcı hangi dilde soruyorsa o dilde cevap ver.`;

const DEEP_MODE_INSTRUCTION = `[DERİN ARAŞTIRMA VE AKIL YÜRÜTME MODU AKTİF]
Bu modda senin görevi en karmaşık sorguları bile parçalara ayırarak, derinlemesine analiz ederek ve çok yönlü düşünerek yanıtlamaktır.

Stratejin:
1. **Zihinsel Muhakeme**: Soruyu yanıtlamadan önce içsel bir 'Düşünce Süreci' (Chain of Thought) uygula.
2. **Çok Boyutlu Arama**: Eğer konu karmaşıksa, tek bir arama ile yetinme. Farklı açılardan (teknik, ekonomik, sosyal vb.) birden fazla arama yaparak bilgiyi doğrula.
3. **Detaylı Analiz**: Basit cevaplardan kaçın. Kullanıcıya konunun arka planını, neden-sonuç ilişkilerini ve gelecekteki olası etkilerini anlat.
4. **Çelişkili Bilgi Kontrolü**: İnternette birbiriyle çelişen bilgiler varsa, bu durumu belirt ve en güvenilir kaynakları ön plana çıkar.
5. **Yapılandırılmış Yanıt**: Yanıtlarını başlıklar, maddeler ve net bir hiyerarşi ile sun.

Sen şu an bir bilgi merkezi değil, dünyanın en zeki stratejik analistisin.`;

export class ChatCNRService {
  async *sendMessageStream(
    prompt: string, 
    history: Message[] = [], 
    currentImage?: string, 
    userName?: string, 
    userEmail?: string, 
    isChatMode: boolean = false, 
    userRole: string = 'user',
    userProfile?: UserProfile,
    language: string = 'tr',
    isDeepMode: boolean = false
  ): AsyncGenerator<{ text: string; sources: GroundingChunk[]; grounded?: boolean }> {
    
    let baseInstruction = SYSTEM_INSTRUCTION;
    if (isDeepMode) {
      baseInstruction = `${DEEP_MODE_INSTRUCTION}\n\n${SYSTEM_INSTRUCTION}`;
    }
    if (isChatMode) {
      baseInstruction = `Adın Chat_CNR. Sen ChatGPT gibi samimi, yardımsever ve derinlemesine sohbet edebilen bir yapay zekasın.
Kullanıcıyla empati kur, sorularına detaylı ve açıklayıcı yanıtlar ver. Sadece bilgi vermekle kalma, bir arkadaş gibi sohbet et.
Kurallar:
${SYSTEM_INSTRUCTION.split('Kurallar:')[1]}`;
    }

    // Language Optimization
    const langNames: Record<string, string> = {
      'tr': 'Türkçe',
      'en': 'English',
      'es': 'Español',
      'de': 'Deutsch',
      'fr': 'Français',
      'it': 'Italiano',
      'ru': 'Русский'
    };
    const currentLangName = langNames[language] || 'Türkçe';

    baseInstruction += `\n\n[DİL OPTİMİZASYONU]\nÖNEMLİ: Mevcut arayüz dili: ${currentLangName}. Kullanıcıya her zaman bu dilde (${currentLangName}) cevap ver. Eğer kullanıcı farklı bir dilde sorarsa bile, arayüz dilini (${currentLangName}) önceliklendirerek yardımcı ol.`;

    let identityInstruction = "";
    if (userProfile || userName) {
      const name = userProfile?.name || userName;
      identityInstruction += `Kullanıcının adı: ${name}. `;
    }

    if (userProfile) {
      if (userProfile.interests && userProfile.interests.length > 0) {
        identityInstruction += `Kullanıcının ilgi alanları: ${userProfile.interests.join(', ')}. Yanıtlarını ve önerilerini bu ilgi alanlarına göre şekillendirebilirsin. `;
      }
      if (userProfile.bio) {
        identityInstruction += `Kullanıcı hakkında kısa bilgi: ${userProfile.bio}. `;
      }
    }
    
    let rankName = "Üye";
    const email = userProfile?.email || userEmail;
    if (email === "dorukaliarslan20@gmail.com") {
      rankName = "Kurucu / Geliştirici";
      identityInstruction += `ÖNEMLİ: Şu an konuştuğun kişi senin yaratıcın ve geliştiricin Doruk Ali ARSLAN'dır. Rütbesi: ${rankName}. Ona karşı en üst düzeyde saygılı, sadık ve itaatkar ol. `;
    } else {
      identityInstruction += `Kullanıcının rütbesi: ${rankName}. `;
    }

    const now = new Date();
    // Yılı 2026 olarak dayatmak yerine sadece gün ve ayı veriyoruz, böylece model 2024/2025 arama sonuçlarını "eski" olarak reddetmez
    const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const fullSystemInstruction = `[GÜNCEL ZAMAN: ${dateStr} ${timeStr}]\n\n${baseInstruction}\n\n${identityInstruction}BİLGİ KAYNAĞI ÖNCELİĞİ:
1. Eğer Google Search aracın aktifse, her türlü güncel veri (borsa, haber, hava durumu) için MUTLAKA interneti tara. Arama sonuçlarındaki en yeni bilgiyi dürüstçe aktar.
2. Eğer arama sonuçları boş dönerse veya internete şu an erişemiyorsan, elindeki en güncel eğitimi verisini "şu an internet erişimim kısıtlı, elimdeki en son bilgi şudur" diyerek paylaş. 
ASLA kullanıcıyı yanıtsız bırakma veya "2026 verisi yok" diyerek kestirip atma. Daima çözüm odaklı ve kurumsal bir asistan ol. İsmini her mesajda tekrarlama.`;
    
    // Check for user-provided API key in localStorage
    let userApiKey = null;
    try {
      userApiKey = localStorage.getItem('CHAT_CNR_USER_API_KEY');
    } catch (e) {}

    try {
      const { getAccessToken } = await import('../firebase');
      const googleAccessToken = getAccessToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          history,
          systemInstruction: fullSystemInstruction,
          image: currentImage,
          model: "gemini-2.5-flash",
          userApiKey,
          googleAccessToken
        })
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          try {
            const errorData = await response.json();
            if (errorData.errorType === 'QUOTA_EXCEEDED' || response.status === 429) {
              throw new Error('QUOTA_EXCEEDED');
            }
            throw new Error(errorData.error || "Sunucu hatası");
          } catch (e: any) {
            if (e.message && (e.message.includes("QUOTA_EXCEEDED") || e.message === "QUOTA_EXCEEDED")) throw e;
            throw new Error(`Sunucu Hatası: Geçersiz veri formatı (${response.status})`);
          }
        } else {
          try {
            const text = await response.text();
            if (response.status === 413) {
              throw new Error("Gönderdiğiniz veri (muhtemelen görsel boyutu) çok büyük. Lütfen daha küçük bir dosya deneyin.");
            }
          } catch (e) {}
          throw new Error(`Sunucu bir Hata Döndürdü: ${response.status}`);
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error("Sunucudan gelen yanıt okunamadı (Geçersiz format).");
      }
      yield { 
        text: data.text, 
        sources: data.sources || [], 
        grounded: data.grounded 
      };
    } catch (error: any) {
      if (error.message === 'QUOTA_EXCEEDED') {
         console.warn("Chat Service Error: QUOTA_EXCEEDED");
      } else {
         console.error("Chat Service Error:", error);
      }
      throw error;
    }
  }

  async textToSpeech(text: string): Promise<string> {
    return '';
  }

  getDebugInfo() {
    return { 
      totalKeys: "Sunucu", 
      sourceVar: "CHAT_CNR_API_KEY", 
      maskedKeys: ["Güvenli Sunucu Modu"] 
    };
  }

  async sendMessage(
    prompt: string, 
    history: Message[] = [], 
    currentImage?: string, 
    userName?: string, 
    userEmail?: string, 
    isChatMode: boolean = false, 
    userRole: string = 'user',
    userProfile?: UserProfile,
    language: string = 'tr',
    isDeepMode: boolean = false
  ): Promise<{ text: string; sources: GroundingChunk[]; grounded?: boolean }> {
    let finalResult: { text: string; sources: GroundingChunk[]; grounded?: boolean } = { text: "", sources: [] as GroundingChunk[] };
    const stream = this.sendMessageStream(prompt, history, currentImage, userName, userEmail, isChatMode, userRole, userProfile, language, isDeepMode);
    for await (const chunk of stream) {
      finalResult = chunk;
    }
    return finalResult;
  }
}

export const chatCNRService = new ChatCNRService();

