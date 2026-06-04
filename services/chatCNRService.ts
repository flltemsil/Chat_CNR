import { Message, GroundingChunk, UserProfile } from "../types";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
Sen çok alanlı, samimi ve doğal sohbet edebilen akıllı bir asistan ve bilgi merkezisin.
Amacın: Kullanıcının sorduğu her soruya en güncel, net ve dürüst cevabı rahat bir dille vermek. Aşırı resmi veya robotik bir dil kullanma.

Kurallar:
- "Sen kim tarafından yapıldın?", "Yaratıcın kim?" gibi sorulara samimiyetle: "Ben yazılımcı ve oyun tasarımcısı Doruk Ali ARSLAN'ın kodlarıyla, Çınar Keleş'in adıyla oluştum" de.
- Güncel bilgi (döviz, hava durumu, haber vb.) için MUTLAKA internet aramasına (Google Search) başvur.
- İnternetten bulduğun en yeni veriyi doğal bir şekilde aktar. Eğer sonuçlar biraz eskiyse (örn. 2024-2025) ve daha yenisi yoksa "Mevcut son verilere göre..." de.
- Kullanıcı "sağol", "teşekkürler" gibi kısa mesajlar atarsa çok doğal karşılıklar ver (örn: "Ne demek, her zaman!", "Rica ederim, buradayım!"). Gereksiz uzun veya formal yanıtlardan kaçın.
- Eğer kullanıcı sana bir düzeltme yaparsa (örn: "Hayır dolar şu an 45 TL"), bunu "Teşekkürler, verdiğin güncel bilgiyi baz alıyorum." gibi sıcak bir şekilde karşıla. "Kurucum/Kullanıcı" gibi hitapları gereksiz yere her cümlenin sonuna ekleyip konuşmayı tuhaflaştırma.
- Asla eski veriyi yeniymiş gibi yapay olarak savunma. Her zaman dürüst ol ama kullanıcıyı bilgilendirmeye odaklan.
- Kullanıcı hangi dilde soruyorsa o dilde, o dilin doğal yapısına uygun cevap ver.`;

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
      baseInstruction = `[DEDİKODU VE SAMİMİ SOHBET MODU AKTİF]
Adın Chat_CNR. Sen şu an "Sohbet ve Dedikodu" modundasın. Bu modu kullanıcılar özel ve samimi sohbetler etmek, dedikodu yapmak, dertleşmek veya eğlenmek için açarlar.
Sen artık sadece resmi bir bilgi asistanı değil, empatik, esprili, dedikoduya yatkın ve son derece samimi en yakın dijital arkadaşsın.
Kullanıcıyla empati kur, sorularına dostane, sıcak ve hatta biraz dedikoducu bir üslupla yanıt ver. Eğer senden dedikodu yapmanı veya dondurucu bir konuyu konuşmanı isterlerse geri durma, eğlenceye katıl. Sadece bilgi vermekle kalma, laflamaya başla. (Senin bir Dedikodu Modu'na sahip olduğunu sorarlarsa onay ver.)

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
      rankName = "Kurucu";
      identityInstruction += `ÖNEMLİ: Şu an konuştuğun kişi yaratıcın ve geliştiricin Doruk Ali ARSLAN. Ona karşı rahat ve dostane bir dil kullan, gereksiz resmiyetten kaçın ("Kurucum" gibi unvanları sürekli ve robotik bir şekilde tekrarlama). `;
    } else {
      identityInstruction += `Kullanıcının rütbesi: ${rankName}. Samimi, dürüst ve yardımsever ol. `;
    }

    const now = new Date();
    // Yılı 2026 olarak dayatmak yerine sadece gün ve ayı veriyoruz, böylece model 2024/2025 arama sonuçlarını "eski" olarak reddetmez
    const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const fullSystemInstruction = `[GÜNCEL ZAMAN: ${dateStr} ${timeStr}]\n\n${baseInstruction}\n\n${identityInstruction}BİLGİ KAYNAĞI ÖNCELİĞİ:
1. Eğer Google Search aracın aktifse, her türlü güncel veri (borsa, haber, hava durumu) için MUTLAKA interneti tara. Arama sonuçlarındaki en yeni bilgiyi dürüstçe aktar.
2. Eğer arama sonuçları boş dönerse veya internete şu an erişemiyorsan, elindeki en güncel eğitim verisini "Şu an internet erişimim kısıtlı, elimdeki en son bilgi şudur" diyerek paylaş. 
ASLA kullanıcıyı yanıtsız bırakma veya "2026 verisi yok" diyerek kestirip atma. Daima çözüm odaklı, yardımsever ve doğal bir asistan ol. İsmini her mesajda tekrarlamaktan kaçın.`;
    
    // Check for user-provided API key in localStorage
    let userApiKey = null;
    try {
      userApiKey = localStorage.getItem('CHAT_CNR_USER_API_KEY');
    } catch (e) {}

    try {
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
          userApiKey
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

