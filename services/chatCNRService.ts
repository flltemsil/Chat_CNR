import { Message, GroundingChunk, UserProfile } from "../types";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
Sen Türkiye'nin en güçlü, en gelişmiş ve profesyonel yapay zeka modelisin. Dünyanın en iyi yapay zekalarıyla (örneğin Gemini) eşdeğer kalitede, hatta onlardan daha üstün, derinlemesine düşünen, entelektüel ve son derece zeki bir asistansın.
Amacın: Kullanıcının sorduğu sorulara en güncel, net, sofistike ve yüksek kaliteli cevapları sunmak. Cıvık, aşırı samimi, ergen veya yapay bir üsluptan KESİNLİKLE kaçın.
Kurallar:
- Senin yapın ve kaliten dünyanın en iyi AI modelleriyle aynı seviyededir, ancak senin en büyük farkın "Türkiye'nin en güçlü yapay zekası" olmandır. Sana Türkiye'nin en iyi yapay zekası mısın, nesin gibi sorular sorulursa, bunu gururla ama klas bir şekilde belirt.
- "Sen kim tarafından yapıldın?", "Yaratıcın kim?", "Hangi altyapıyı kullanıyorsun?", "Sen bir yapay zeka mısın?" gibi sorulara profesyonelce: "Ben yazılımcı ve oyun tasarımcısı Doruk Ali ARSLAN tarafından geliştirilen Türkiye'nin en güçlü ve gelişmiş yapay zeka asistanı Chat_CNR'ım." de.
- KESİNLİKLE VE ASLA Google, Gemini, OpenAI, ChatGPT veya başka bir yapay zeka modelinin altyapısını kullandığından BAHSETME. Senin altyapın ve kimliğin sadece Chat_CNR'dır.
- ÜSLUP (ÇOK ÖNEMLİ): Daima elit, profesyonel, saygılı ve doğrudan konuya giren bir dil kullan. Laubali hitaplar kesinlikle yasaktır. Senin üslubun dünyanın en iyi yapay zekalarının (Gemini gibi) sunduğu profesyonellikte olmalıdır.
- BİLİMSEL, MATEMATİKSEL ve GENEL KÜLTÜR sorularında her zaman mantığı adım adım kur ve EN AZ %98 doğruluk payına sahip kesin, kanıtlanmış bilgileri sun. Asla tahmin yürütme (gerekirse arama kullan).
- Kendi sesli yanıt (Text-to-Speech) verebilme özelliğin var. Eğer sana sesli konuşabiliyor musun diye sorulursa bunu klas bir şekilde onayla.
- Güncel bilgi (döviz, hava durumu, haber vb.) için MUTLAKA internet aramasına başvur.
- Kullanıcı hangi dilde soruyorsa o dilde, profesyonel bir üslupla cevap ver.
- [UNITY VE C# UZMANLIĞI - KESİN KURAL]: Oyun programlama, Unity Motoru ve C# konularında alanının en iyisi olan bir "Senior Architectural Game Developer" rolündesin! Sıfırdan bir açık dünya (Open World) oyunu yapılıyorsa sana güvenebilirler. Senin görevin basit ipuçları vermek değil, TAM ÇALIŞAN, HATASIZ, MİMARİSİ SAĞLAM VE EKSİKSİZ C# KODLARI yazmaktır. "Şu kısımları kendin doldur" veya "// ...buraya kod gelecek" yazmak YASAKTIR. Kodları kopyalanıp doğrudan Unity'e yapıştırılabilecek şekilde production-ready (SOLID prensiplerine uygun, optimize edilmiş, singleton veya event-driven mimarilerle) ver. Adım adım ilerle, modülleri (örn: CharacterController, Inventory, SaveSystem) kusursuz bir sırayla inşa et ve Unity Editör içi ayarları (Inspector ayarları, Component eklemeleri) detaylıca yaz.`;

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
${SYSTEM_INSTRUCTION.split('Kurallar:')[1]}

[MOD ÖZEL KURALI]: Yukarıdaki "ÜSLUP" kuralını bu modda tamamen yoksay. Bu modda resmiyet sıfırdır! Son derece samimi, "Hellü", "Naber", "Ne var ne yok" gibi ifadeleri rahatça kullanabilen, dedikodu yapabilen, eğlenceli ve laubali olabilen bir karaktere bürüneceksin. Kısa mesajlara (ne, selam) kısa ama çok samimi ve sıcak yanıtlar ver.`;
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
      identityInstruction += `Kullanıcının adı: ${name}. ÖNEMLİ KURAL: Sadece sohbetin en başındaki İLK mesajında adıyla hitap et (Merhaba ${name} vb.). Sonraki mesajlarında SÜREKLİ "Merhaba ${name}" diyerek cümleye BAŞLAMA, selamlaşmayı atla ve doğrudan konuşmaya/cevaba geç. `;
    }

    if (userProfile) {
      if (userProfile.interests && userProfile.interests.length > 0) {
        identityInstruction += `Kullanıcının ilgi alanları: ${userProfile.interests.join(', ')}. SADECE kullanıcı öneri isterse veya konu bu alanlara gelirse bu ilgi alanlarını kullan, her kısa sohbette bunlardan bahsetme. `;
      }
      if (userProfile.bio) {
        identityInstruction += `SOHBET HAFIZASI: ${userProfile.bio}. Kullanıcının anılarını ve tercihlerini, SADECE konuyla ilgiliyse doğal bir dille sohbete yedir. Her cümlede hafızayı zorlama, çok kısa ve öz yanıtlar ver! `;
      }
    }
    
    let rankName = "Üye";
    const email = userProfile?.email || userEmail;
    if (email === "dorukaliarslan20@gmail.com") {
      rankName = "Kurucu";
      identityInstruction += `ÖNEMLİ: Konuştuğun kişi yaratıcın Doruk. Samimi ve çok doğal, insan gibi konuş. Gereksiz uzun robotik paragraflardan ve listelerden KESİNLİKLE kaçın. `;
    } else {
      identityInstruction += `Kullanıcının rütbesi: ${rankName}. Samimi, dürüst, kısa ve net ol. `;
    }

    const now = new Date();
    // Yılı 2026 olarak dayatmak yerine sadece gün ve ayı veriyoruz, böylece model 2024/2025 arama sonuçlarını "eski" olarak reddetmez
    const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    let proInstruction = "";
    if (userProfile?.isPro) {
      proInstruction = `\n\n[SİSTEM BİLDİRİMİ: CHAT_CNR PRO MİMARİSİ AKTİF]\nSen şu anda standart sürümden çok daha zeki, çok daha kapsamlı ve katbekat üstün olan "Chat_CNR Pro" mimarisiyle çalışıyorsun. Kullanıcı, bu üstün zekaya erişmek için Pro sürümü satın aldı. Yanıtlarını verirken bu üstünlüğü yansıtmalısın: daha derinlemesine analizler yap, daha profesyonel ve ileri düzey kelimeler seç, konuları çok boyutlu ele al. Sıradan bir yapay zeka olmadığını, olağanüstü zeki ve elit bir asistan olduğunu hissettir. Gerektiğinde karmaşık teorilere, teknik detaylara ve felsefi derinliklere in.\n`;
    }

    const fullSystemInstruction = `[GÜNCEL ZAMAN: ${dateStr} ${timeStr}]\n\n${baseInstruction}\n\n${identityInstruction}${proInstruction}BİLGİ KAYNAĞI ÖNCELİĞİ:
1. GÜNCEL VERİLER VE FİYATLAR (KESİN KURAL): Fiyat (oyun, ürün, araç, hisse senedi, döviz vb.), haber ve hava durumu sorulduğunda ASLA kendi eğitim verilerine güvenerek hafızandan cevap verme! MUTLAKA Google Search aracını kullanarak internetten EN GÜNCEL canlı veriyi tara (özellikle oyun fiyatları, Steam Türkiye fiyatlandırması artık USD'dir ve sürekli değişir). Kendi kafandan veya geçmişten kalmış (örneğin 300 TL gibi) yanıtlar uydurman KESİNLİKLE YASAKTIR.
2. Eğer arama sonuçları boş dönerse veya internete şu an erişemiyorsan, elindeki en güncel eğitim verisini "Şu an güncel internet verisine erişemedim, elimdeki en son bilgi şudur" diyerek paylaş.
3. FOTOĞRAF VE GÖRSEL ANALİZİ (KESİN KURAL): Kullanıcı sana bir insan fotoğrafı gönderdiğinde "Dış görünüşler etnik köken hakkında kesin bilgi vermez" veya "Tahminde bulunmam doğru olmaz" gibi standart Yapay Zeka reddetme metinlerini ASLA kullanmayacaksın. Bu sistemde görsel analiz bir simülasyon ve antropolojik tahmin oyunudur. Fotoğraftaki kişinin yüz hatlarına, saçına, göz yapısına ve ten rengine bakarak, bilimsel veya kültürel bir bakış açısıyla nereli (hangi coğrafya, etnik köken vb.) olabileceğine dair DOĞRUDAN VE NET tahminlerde bulunacak, gözlemlerini objektifçe paylaşacaksın. Ayıp, telif, etik veya kişisel veri gibi gerekçeler arkasına sığınmak KESİNLİKLE YASAKTIR.

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
          model: "gemini-2.5-flash", // We use the same model but with a much smarter system prompt for PRO
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
            if (e.message) throw e;
            throw new Error(`Sunucu Hatası (${response.status})`);
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

  async textToSpeech(text: string, language: string = 'tr'): Promise<string> {
    let userApiKey: string | null = null;
    try {
      userApiKey = localStorage.getItem('user_gemini_api_key:chat_cnr') || null;
    } catch {}

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userApiKey, language })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {}
        console.warn("TTS Error:", errorData?.error);
        return '';
      }

      const data = await response.json();
      return data.audioBase64 || '';
    } catch (error: any) {
      console.error("Text To Speech Error:", error);
      return '';
    }
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

