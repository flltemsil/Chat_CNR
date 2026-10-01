import pptxgen from 'pptxgenjs';

export type SlideLayout = 'title' | 'bullets' | 'split' | 'stat' | 'conclusion';
export type ThemeKey = 'modernDark' | 'corporateBlue' | 'emeraldPro' | 'sunsetVibe' | 'minimalLight';

export interface PresentationSlide {
  id: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  leftBullets?: string[];
  rightBullets?: string[];
  splitTitleLeft?: string;
  splitTitleRight?: string;
  statNumber?: string;
  statLabel?: string;
  content?: string;
  layout: SlideLayout;
  speakerNotes?: string;
  badge?: string;
}

export interface PresentationThemeConfig {
  name: string;
  bgHex: string;
  cardBgHex: string;
  titleColorHex: string;
  textColorHex: string;
  accentColorHex: string;
  subtextColorHex: string;
  isDark: boolean;
}

export const PRESENTATION_THEMES: Record<ThemeKey, PresentationThemeConfig> = {
  modernDark: {
    name: 'Modern Koyu',
    bgHex: '0F172A', // slate-900
    cardBgHex: '1E293B', // slate-800
    titleColorHex: 'F8FAFC',
    textColorHex: 'E2E8F0',
    accentColorHex: '38BDF8', // sky-400
    subtextColorHex: '94A3B8',
    isDark: true,
  },
  corporateBlue: {
    name: 'Kurumsal Lacivert',
    bgHex: '0A192F', // deep navy
    cardBgHex: '172A45',
    titleColorHex: 'FFFFFF',
    textColorHex: 'CCD6F6',
    accentColorHex: '64FFDA', // cyan accent
    subtextColorHex: '8892B0',
    isDark: true,
  },
  emeraldPro: {
    name: 'Zümrüt Yeşil',
    bgHex: '064E3B', // emerald-900
    cardBgHex: '065F46',
    titleColorHex: 'FFFFFF',
    textColorHex: 'D1FAE5',
    accentColorHex: '34D399', // emerald-400
    subtextColorHex: 'A7F3D0',
    isDark: true,
  },
  sunsetVibe: {
    name: 'Gün Batımı',
    bgHex: '2E1065', // violet-950
    cardBgHex: '3B0764',
    titleColorHex: 'FFFFFF',
    textColorHex: 'F3E8FF',
    accentColorHex: 'F43F5E', // rose-500
    subtextColorHex: 'D8B4FE',
    isDark: true,
  },
  minimalLight: {
    name: 'Minimal Beyaz',
    bgHex: 'FFFFFF',
    cardBgHex: 'F1F5F9', // slate-100
    titleColorHex: '0F172A', // slate-900
    textColorHex: '334155',
    accentColorHex: '2563EB', // blue-600
    subtextColorHex: '64748B',
    isDark: false,
  },
};

export interface PresentationDeck {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  theme: ThemeKey;
  slides: PresentationSlide[];
  createdAt: string;
}

export class PresentationService {
  private STORAGE_KEY = 'chat_cnr_presentations_v1';

  getSavedDecks(): PresentationDeck[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load saved presentations', e);
    }
    return [];
  }

  saveDeck(deck: PresentationDeck): void {
    try {
      const decks = this.getSavedDecks();
      const idx = decks.findIndex((d) => d.id === deck.id);
      if (idx >= 0) {
        decks[idx] = deck;
      } else {
        decks.unshift(deck);
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(decks.slice(0, 30)));
    } catch (e) {
      console.error('Failed to save presentation', e);
    }
  }

  deleteDeck(deckId: string): void {
    try {
      const decks = this.getSavedDecks().filter((d) => d.id !== deckId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to delete presentation', e);
    }
  }

  /**
   * Export PresentationDeck to genuine Microsoft PowerPoint (.pptx) file
   */
  async exportToPptx(deck: PresentationDeck): Promise<void> {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = deck.title;
    pptx.author = deck.author || 'Chat_CNR AI';

    const theme = PRESENTATION_THEMES[deck.theme] || PRESENTATION_THEMES.modernDark;

    for (const slideData of deck.slides) {
      const slide = pptx.addSlide();
      slide.background = { color: theme.bgHex };

      // Speaker Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }

      // Badge (optional top tag)
      if (slideData.badge) {
        slide.addText(slideData.badge.toUpperCase(), {
          x: 0.8,
          y: 0.4,
          w: 4.0,
          h: 0.35,
          fontSize: 10,
          bold: true,
          color: theme.accentColorHex,
          fontFace: 'Arial',
        });
      }

      switch (slideData.layout) {
        case 'title': {
          // Decorative accent line
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 1.8,
            w: 1.2,
            h: 0.08,
            fill: { color: theme.accentColorHex },
          });

          // Main Title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 2.1,
            w: 11.5,
            h: 1.8,
            fontSize: 40,
            bold: true,
            color: theme.titleColorHex,
            fontFace: 'Arial',
            valign: 'middle',
          });

          // Subtitle
          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 0.8,
              y: 4.0,
              w: 11.0,
              h: 1.0,
              fontSize: 20,
              color: theme.subtextColorHex,
              fontFace: 'Arial',
            });
          }

          // Author / Date
          slide.addText(`${deck.author || 'Chat_CNR AI'} • ${new Date().toLocaleDateString('tr-TR')}`, {
            x: 0.8,
            y: 6.2,
            w: 8.0,
            h: 0.4,
            fontSize: 12,
            color: theme.subtextColorHex,
            fontFace: 'Arial',
          });
          break;
        }

        case 'bullets': {
          // Slide Title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.7,
            w: 11.5,
            h: 0.9,
            fontSize: 28,
            bold: true,
            color: theme.titleColorHex,
            fontFace: 'Arial',
          });

          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 0.8,
              y: 1.5,
              w: 11.5,
              h: 0.5,
              fontSize: 15,
              color: theme.subtextColorHex,
              fontFace: 'Arial',
            });
          }

          // Bullets Container Card
          const cardY = slideData.subtitle ? 2.1 : 1.7;
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: cardY,
            w: 11.7,
            h: 4.8,
            rectRadius: 0.15,
            fill: { color: theme.cardBgHex },
            line: { color: theme.accentColorHex, width: 1, transparency: 80 },
          });

          const bullets = slideData.bullets && slideData.bullets.length > 0
            ? slideData.bullets
            : (slideData.content ? [slideData.content] : ['Bilgi maddesi']);

          const textItems = bullets.map((b) => ({
            text: b + '\n\n',
            options: {
              fontSize: 16,
              color: theme.textColorHex,
              fontFace: 'Arial',
              bullet: { code: '2022', color: theme.accentColorHex },
              lineSpacing: 26,
            },
          }));

          slide.addText(textItems as any, {
            x: 1.2,
            y: cardY + 0.4,
            w: 10.9,
            h: 4.0,
            valign: 'top',
          });
          break;
        }

        case 'split': {
          // Title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.7,
            w: 11.5,
            h: 0.9,
            fontSize: 28,
            bold: true,
            color: theme.titleColorHex,
            fontFace: 'Arial',
          });

          // Left Box
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 1.8,
            w: 5.6,
            h: 5.0,
            rectRadius: 0.15,
            fill: { color: theme.cardBgHex },
          });

          slide.addText(slideData.splitTitleLeft || 'Özellikler & Avantajlar', {
            x: 1.1,
            y: 2.1,
            w: 5.0,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: theme.accentColorHex,
            fontFace: 'Arial',
          });

          const leftItems = (slideData.leftBullets || slideData.bullets?.slice(0, 3) || ['Öne çıkan özellik 1']).map((b) => ({
            text: b + '\n\n',
            options: {
              fontSize: 14,
              color: theme.textColorHex,
              bullet: { code: '2022', color: theme.accentColorHex },
            },
          }));

          slide.addText(leftItems as any, {
            x: 1.1,
            y: 2.7,
            w: 5.0,
            h: 3.8,
            valign: 'top',
          });

          // Right Box
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.9,
            y: 1.8,
            w: 5.6,
            h: 5.0,
            rectRadius: 0.15,
            fill: { color: theme.cardBgHex },
          });

          slide.addText(slideData.splitTitleRight || 'Uygulama & Çözüm', {
            x: 7.2,
            y: 2.1,
            w: 5.0,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: theme.titleColorHex,
            fontFace: 'Arial',
          });

          const rightItems = (slideData.rightBullets || slideData.bullets?.slice(3) || ['Uygulama detayı 1']).map((b) => ({
            text: b + '\n\n',
            options: {
              fontSize: 14,
              color: theme.textColorHex,
              bullet: { code: '2022', color: theme.subtextColorHex },
            },
          }));

          slide.addText(rightItems as any, {
            x: 7.2,
            y: 2.7,
            w: 5.0,
            h: 3.8,
            valign: 'top',
          });
          break;
        }

        case 'stat': {
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.7,
            w: 11.5,
            h: 0.9,
            fontSize: 28,
            bold: true,
            color: theme.titleColorHex,
            fontFace: 'Arial',
          });

          // Stat Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 1.8,
            w: 5.0,
            h: 5.0,
            rectRadius: 0.2,
            fill: { color: theme.cardBgHex },
            line: { color: theme.accentColorHex, width: 2 },
          });

          slide.addText(slideData.statNumber || '%98', {
            x: 1.0,
            y: 2.6,
            w: 4.6,
            h: 1.5,
            fontSize: 54,
            bold: true,
            align: 'center',
            color: theme.accentColorHex,
            fontFace: 'Arial',
          });

          slide.addText(slideData.statLabel || 'Başarı ve Doğruluk Oranı', {
            x: 1.0,
            y: 4.2,
            w: 4.6,
            h: 1.0,
            fontSize: 16,
            bold: true,
            align: 'center',
            color: theme.titleColorHex,
            fontFace: 'Arial',
          });

          // Description Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 6.2,
            y: 1.8,
            w: 6.3,
            h: 5.0,
            rectRadius: 0.2,
            fill: { color: theme.cardBgHex },
          });

          const statBullets = slideData.bullets || [slideData.content || 'Detaylı metrik açıklaması'];
          const descItems = statBullets.map((b) => ({
            text: b + '\n\n',
            options: {
              fontSize: 15,
              color: theme.textColorHex,
              bullet: { code: '2022', color: theme.accentColorHex },
            },
          }));

          slide.addText(descItems as any, {
            x: 6.6,
            y: 2.3,
            w: 5.5,
            h: 4.0,
            valign: 'top',
          });
          break;
        }

        case 'conclusion': {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 1.5,
            y: 1.5,
            w: 10.3,
            h: 4.8,
            rectRadius: 0.2,
            fill: { color: theme.cardBgHex },
            line: { color: theme.accentColorHex, width: 1.5 },
          });

          slide.addText(slideData.title, {
            x: 2.0,
            y: 2.0,
            w: 9.3,
            h: 1.0,
            fontSize: 34,
            bold: true,
            align: 'center',
            color: theme.accentColorHex,
            fontFace: 'Arial',
          });

          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 2.0,
              y: 3.1,
              w: 9.3,
              h: 0.8,
              fontSize: 18,
              align: 'center',
              color: theme.titleColorHex,
              fontFace: 'Arial',
            });
          }

          const concBullets = slideData.bullets || [slideData.content || 'Teşekkürler & İletişim'];
          const cItems = concBullets.map((b) => ({
            text: b + '\n',
            options: {
              fontSize: 16,
              align: 'center',
              color: theme.textColorHex,
            },
          }));

          slide.addText(cItems as any, {
            x: 2.0,
            y: 4.1,
            w: 9.3,
            h: 1.6,
            valign: 'top',
          });
          break;
        }
      }
    }

    const safeTitle = (deck.title || 'Sunum').replace(/[/\\?%*:|"<>]/g, '_');
    await pptx.writeFile({ fileName: `${safeTitle}.pptx` });
  }

  /**
   * Generates a complete presentation with AI using our server proxy or structured generator
   */
  async generatePresentationWithAI(
    topic: string,
    slideCount: number = 6,
    theme: ThemeKey = 'modernDark',
    language: string = 'tr'
  ): Promise<PresentationDeck> {
    const prompt = `Lütfen aşağıdaki konu hakkında profesyonel, yüksek kaliteli, tam kapsamlı ${slideCount} slaytlık bir PowerPoint sunumu oluştur.
Konu: "${topic}"
Dil: ${language === 'tr' ? 'Türkçe' : language === 'de' ? 'Almanca' : 'İngilizce'}

Lütfen yanıtını SADECE geçerli bir JSON nesnesi olarak ver (Markdown kod blokları \`\`\`json veya düz metin olabilir, başka açıklama yazma). JSON şeması tam olarak şöyle olmalıdır:
{
  "title": "Sunum Ana Başlığı",
  "subtitle": "Kısa ve Çarpıcı Alt Başlık",
  "author": "Chat_CNR Sunum Stüdyosu",
  "slides": [
    {
      "id": "slide-1",
      "layout": "title",
      "title": "Giriş Slaytı Başlığı",
      "subtitle": "Sunum Özeti ve Vizyon",
      "badge": "GİRİŞ",
      "speakerNotes": "Sunucu konuşma notları"
    },
    {
      "id": "slide-2",
      "layout": "bullets",
      "title": "Ana Başlık 1",
      "subtitle": "Açıklayıcı alt başlık",
      "badge": "GENEL BAKIŞ",
      "bullets": [
        "Detaylı, anlamlı 1. madde açıklaması",
        "İkinci önemli nokta ve analitik veri",
        "Üçüncü anahtar çıkarım ve strateji"
      ],
      "speakerNotes": "Konuşmacı notları"
    },
    {
      "id": "slide-3",
      "layout": "split",
      "title": "Karşılaştırma / İki Boyutlu Analiz",
      "splitTitleLeft": "Fırsatlar & Avantajlar",
      "leftBullets": ["Avantaj 1", "Avantaj 2", "Avantaj 3"],
      "splitTitleRight": "Stratejik Çözümler",
      "rightBullets": ["Çözüm 1", "Çözüm 2", "Çözüm 3"],
      "badge": "ANALİZ",
      "speakerNotes": "Konuşmacı notları"
    },
    {
      "id": "slide-4",
      "layout": "stat",
      "title": "Etki ve Başarı Göstergeleri",
      "statNumber": "%85+",
      "statLabel": "Verimlilik Artışı",
      "badge": "METRİKLER",
      "bullets": [
        "Ölçülen performans kazanımları",
        "Süreç optimizasyonu ve zaman tasarrufu",
        "Gelecek dönem büyüme projeksiyonu"
      ],
      "speakerNotes": "Konuşmacı notları"
    },
    {
      "id": "slide-5",
      "layout": "conclusion",
      "title": "Sonuç & Eylem Planı",
      "subtitle": "Gelecek Adımlar ve Vizyon",
      "badge": "SONUÇ",
      "bullets": [
        "Ana kazanımların özeti",
        "Hemen uygulanacak 3 öncelikli adım",
        "Sorular & İletişim: Chat_CNR AI Hub"
      ],
      "speakerNotes": "Kapanış teşekkür konuşması"
    }
  ]
}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: 'Sen profesyonel bir PowerPoint sunum tasarımcısı ve iş stratejisti yapay zekasın. Yalnızca istenen JSON formatında yanıt ver.',
          model: 'gemini-2.5-flash',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
            const deck: PresentationDeck = {
              id: 'deck_' + Date.now(),
              title: parsed.title || topic,
              subtitle: parsed.subtitle,
              author: parsed.author || 'Chat_CNR AI',
              theme: theme,
              slides: parsed.slides.map((s: any, idx: number) => ({
                id: s.id || `slide-${idx + 1}`,
                title: s.title || `Slayt ${idx + 1}`,
                subtitle: s.subtitle,
                layout: s.layout || (idx === 0 ? 'title' : idx === parsed.slides.length - 1 ? 'conclusion' : 'bullets'),
                bullets: s.bullets || [],
                leftBullets: s.leftBullets,
                rightBullets: s.rightBullets,
                splitTitleLeft: s.splitTitleLeft,
                splitTitleRight: s.splitTitleRight,
                statNumber: s.statNumber,
                statLabel: s.statLabel,
                content: s.content,
                speakerNotes: s.speakerNotes,
                badge: s.badge,
              })),
              createdAt: new Date().toISOString(),
            };
            this.saveDeck(deck);
            return deck;
          }
        }
      }
    } catch (err) {
      console.warn('AI presentation parse fallback:', err);
    }

    // High quality offline fallback deck based on the topic
    return this.createTemplateDeck(topic, theme);
  }

  createTemplateDeck(topic: string, theme: ThemeKey = 'modernDark'): PresentationDeck {
    const deck: PresentationDeck = {
      id: 'deck_' + Date.now(),
      title: topic || 'Chat_CNR Sunum Dosyası',
      subtitle: 'Kapsamlı Analiz, Stratejik Vizyon ve Çözümler',
      author: 'Chat_CNR AI',
      theme: theme,
      createdAt: new Date().toISOString(),
      slides: [
        {
          id: 'slide-1',
          layout: 'title',
          title: topic || 'Chat_CNR Profesyonel Sunum',
          subtitle: 'Geleceğe Yönelik Stratejiler, Uygulama Modelleri ve Çıkarımlar',
          badge: 'GİRİŞ',
          speakerNotes: 'Giriş slaytı: Katılımcıları selamlayın ve sunumun hedefini özetleyin.',
        },
        {
          id: 'slide-2',
          layout: 'bullets',
          title: 'Genel Bakış & Mevcut Durum Analizi',
          subtitle: 'Sektörel dinamikler ve temel dinamik parametreler',
          badge: 'DURUM TESPİTİ',
          bullets: [
            `${topic} alanında küresel gelişmeler hızla ivme kazanıyor.`,
            'Dijitalleşme ve otomasyon süreçleri operasyonel maliyetleri ciddi ölçüde düşürüyor.',
            'Veri odaklı karar mekanizmaları stratejik başarı için kritik öneme sahip.',
            'Yapay zeka entegrasyonu rekabette kalıcı avantaj yaratıyor.',
          ],
          speakerNotes: 'Bu slaytta sektördeki güncel durum ve dönüştürücü etkilerden bahsedin.',
        },
        {
          id: 'slide-3',
          layout: 'split',
          title: 'Fırsatlar & Uygulama Adımları',
          subtitle: 'Karşılaştırmalı stratejik aksiyon planı',
          badge: 'STRATEJİ',
          splitTitleLeft: 'Stratejik Fırsatlar',
          leftBullets: [
            'Pazar payında hızlı büyüme potansiyeli',
            'Müşteri memnuniyetinde hissedilir artış',
            'Teknolojik inovasyon ile lider konuma gelme',
          ],
          splitTitleRight: 'Uygulama Modeli',
          rightBullets: [
            '1. Aşama: Altyapı ve veri analitiği hazırlığı',
            '2. Aşama: Pilot uygulama ve performans ölçümü',
            '3. Aşama: Ölçeklendirme ve tam entegrasyon',
          ],
          speakerNotes: 'İki sütunlu analiz: Sol tarafta fırsatları, sağ tarafta bu fırsatları hayata geçirecek adımları sunun.',
        },
        {
          id: 'slide-4',
          layout: 'stat',
          title: 'Performans & Ölçülebilir Etki',
          subtitle: 'Hedeflenen başarı kriterleri ve büyüme göstergeleri',
          badge: 'METRİKLER',
          statNumber: '%350',
          statLabel: 'Öngörülen Verim & Büyüme Oranı',
          bullets: [
            'İş akışlarında %60 daha hızlı tamamlama süresi.',
            'Hata oranlarında %90 oranında azalma.',
            'Tüm ekipler arasında anlık veri senkronizasyonu.',
          ],
          speakerNotes: 'İstatistikleri vurgulayarak projenin geri dönüş oranını somutlaştırın.',
        },
        {
          id: 'slide-5',
          layout: 'conclusion',
          title: 'Sonuç & Vizyon',
          subtitle: 'Birlikte Geleceği İnşa Edelim',
          badge: 'KAPANIŞ',
          bullets: [
            'Özet: Stratejik kararlılık ve doğru teknoloji seçimi başarının anahtarıdır.',
            'İletişim: Chat_CNR Yapay Zeka Bilgi Merkezi',
            'Teşekkürler! Sorularınız için hazırız.',
          ],
          speakerNotes: 'Kapanış ve soru-cevap bölümüne geçiş.',
        },
      ],
    };

    this.saveDeck(deck);
    return deck;
  }
}

export const presentationService = new PresentationService();
