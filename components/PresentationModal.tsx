import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Download,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Copy,
  Edit3,
  Eye,
  FileText,
  Sliders,
  Check,
  Layout,
  Palette,
  MessageSquare,
  HelpCircle,
  BarChart3,
  Columns,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  presentationService,
  PresentationDeck,
  PresentationSlide,
  SlideLayout,
  ThemeKey,
  PRESENTATION_THEMES,
} from '../services/presentationService';
import { Language } from '../types';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  theme?: 'dark' | 'light';
  language?: Language;
  onInsertToChat?: (text: string) => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  initialTopic,
  theme = 'dark',
  language = 'tr',
  onInsertToChat,
}) => {
  const [deck, setDeck] = useState<PresentationDeck | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [topicInput, setTopicInput] = useState<string>('');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize deck on open
  useEffect(() => {
    if (isOpen) {
      const saved = presentationService.getSavedDecks();
      if (saved.length > 0 && !initialTopic) {
        setDeck(saved[0]);
      } else {
        const topic = initialTopic || 'Yapay Zeka ve Gelecek Stratejileri';
        setTopicInput(topic);
        const newDeck = presentationService.createTemplateDeck(topic, 'modernDark');
        setDeck(newDeck);
      }
      setActiveSlideIndex(0);
    }
  }, [isOpen, initialTopic]);

  // Keyboard navigation for presentation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, deck, activeSlideIndex, isFullscreen]);

  if (!isOpen || !deck) return null;

  const currentTheme = PRESENTATION_THEMES[deck.theme] || PRESENTATION_THEMES.modernDark;
  const currentSlide = deck.slides[activeSlideIndex] || deck.slides[0];

  const nextSlide = () => {
    if (deck && activeSlideIndex < deck.slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  const handleGenerateAI = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const newDeck = await presentationService.generatePresentationWithAI(
        topicInput.trim(),
        slideCount,
        deck.theme,
        language
      );
      setDeck(newDeck);
      setActiveSlideIndex(0);
      showToast(language === 'tr' ? 'Sunum yapay zeka ile başarıyla oluşturuldu!' : 'Presentation created with AI successfully!');
    } catch (err: any) {
      showToast(err.message || 'Sunum oluşturulurken hata oluştu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPPTX = async () => {
    if (!deck) return;
    setIsExporting(true);
    try {
      await presentationService.exportToPptx(deck);
      showToast(language === 'tr' ? 'PowerPoint (.pptx) dosyası indirildi!' : 'PowerPoint (.pptx) file downloaded!');
    } catch (err: any) {
      showToast(err.message || 'PowerPoint dışa aktarılırken hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleThemeChange = (newTheme: ThemeKey) => {
    const updated = { ...deck, theme: newTheme };
    setDeck(updated);
    presentationService.saveDeck(updated);
  };

  const handleLayoutChange = (newLayout: SlideLayout) => {
    if (!deck || !currentSlide) return;
    const updatedSlides = [...deck.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      layout: newLayout,
    };
    const updatedDeck = { ...deck, slides: updatedSlides };
    setDeck(updatedDeck);
    presentationService.saveDeck(updatedDeck);
  };

  const updateCurrentSlide = (fields: Partial<PresentationSlide>) => {
    if (!deck || !currentSlide) return;
    const updatedSlides = [...deck.slides];
    updatedSlides[activeSlideIndex] = {
      ...currentSlide,
      ...fields,
    };
    const updatedDeck = { ...deck, slides: updatedSlides };
    setDeck(updatedDeck);
    presentationService.saveDeck(updatedDeck);
  };

  const handleAddSlide = () => {
    if (!deck) return;
    const newSlide: PresentationSlide = {
      id: 'slide_' + Date.now(),
      title: language === 'tr' ? 'Yeni Slayt Başlığı' : 'New Slide Title',
      subtitle: language === 'tr' ? 'Açıklayıcı alt başlık' : 'Descriptive subtitle',
      layout: 'bullets',
      badge: 'BİLGİ',
      bullets: [
        language === 'tr' ? 'Önemli nokta veya stratejik veri' : 'Key insight or strategic data',
        language === 'tr' ? 'Detaylı analiz ve aksiyon maddesi' : 'Detailed analysis and action item',
        language === 'tr' ? 'Geleceğe yönelik çıkarım' : 'Future forecast and recommendation',
      ],
      speakerNotes: language === 'tr' ? 'Bu slayt için konuşmacı notları' : 'Speaker notes for this slide',
    };
    const updatedDeck = {
      ...deck,
      slides: [...deck.slides, newSlide],
    };
    setDeck(updatedDeck);
    setActiveSlideIndex(deck.slides.length);
    presentationService.saveDeck(updatedDeck);
    showToast(language === 'tr' ? 'Yeni slayt eklendi' : 'New slide added');
  };

  const handleDeleteSlide = (index: number) => {
    if (!deck || deck.slides.length <= 1) {
      showToast(language === 'tr' ? 'Sunumda en az 1 slayt olmalıdır' : 'Presentation must have at least 1 slide');
      return;
    }
    const updatedSlides = deck.slides.filter((_, idx) => idx !== index);
    const updatedDeck = { ...deck, slides: updatedSlides };
    setDeck(updatedDeck);
    if (activeSlideIndex >= updatedSlides.length) {
      setActiveSlideIndex(updatedSlides.length - 1);
    }
    presentationService.saveDeck(updatedDeck);
    showToast(language === 'tr' ? 'Slayt silindi' : 'Slide deleted');
  };

  const handleInsertToChat = () => {
    if (!deck || !onInsertToChat) return;
    const outline = `### 📊 PowerPoint Sunumu: ${deck.title}\n**Alt Başlık:** ${deck.subtitle || '-'}\n**Toplam Slayt:** ${deck.slides.length}\n\n` +
      deck.slides.map((s, idx) => `**Slayt ${idx + 1} (${s.layout.toUpperCase()}):** ${s.title}\n${(s.bullets || []).map((b) => `  - ${b}`).join('\n')}`).join('\n\n');
    onInsertToChat(outline);
    onClose();
  };

  // FULLSCREEN PRESENTATION MODE
  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col justify-between p-6 sm:p-12 select-none animate-in fade-in duration-200"
        style={{ backgroundColor: `#${currentTheme.bgHex}`, color: `#${currentTheme.textColorHex}` }}
      >
        {/* Fullscreen top header controls */}
        <div className="flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `#${currentTheme.accentColorHex}20`, color: `#${currentTheme.accentColorHex}` }}
            >
              Chat_CNR Sunum Modu
            </span>
            <span className="text-sm font-semibold opacity-70">{deck.title}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-all border"
              style={{
                backgroundColor: showNotes ? `#${currentTheme.accentColorHex}30` : 'rgba(0,0,0,0.3)',
                borderColor: showNotes ? `#${currentTheme.accentColorHex}` : 'rgba(255,255,255,0.1)',
                color: `#${currentTheme.titleColorHex}`,
              }}
            >
              {showNotes ? 'Notları Gizle' : 'Konuşmacı Notları'}
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-xl backdrop-blur-md bg-black/40 hover:bg-black/60 text-white transition-all border border-white/10"
              title="Tam Ekrandan Çık (Esc)"
            >
              <Minimize2 size={20} />
            </button>
          </div>
        </div>

        {/* Fullscreen slide canvas */}
        <div className="flex-1 flex items-center justify-center my-6 max-w-6xl mx-auto w-full">
          <SlideRenderer slide={currentSlide} theme={currentTheme} deck={deck} />
        </div>

        {/* Speaker notes popup in fullscreen */}
        {showNotes && currentSlide.speakerNotes && (
          <div
            className="fixed bottom-24 right-10 max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-200"
            style={{
              backgroundColor: `#${currentTheme.cardBgHex}f0`,
              borderColor: `#${currentTheme.accentColorHex}40`,
              color: `#${currentTheme.textColorHex}`,
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: `#${currentTheme.accentColorHex}` }}>
              Konuşmacı Notları (Slayt {activeSlideIndex + 1})
            </p>
            <p className="text-sm leading-relaxed">{currentSlide.speakerNotes}</p>
          </div>
        )}

        {/* Fullscreen bottom controls */}
        <div className="flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity duration-300">
          <div className="text-xs font-mono font-bold tracking-widest" style={{ color: `#${currentTheme.subtextColorHex}` }}>
            SLAYT {activeSlideIndex + 1} / {deck.slides.length}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              disabled={activeSlideIndex === 0}
              className="p-3 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/70 disabled:opacity-20 text-white transition-all border border-white/10"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={nextSlide}
              disabled={activeSlideIndex === deck.slides.length - 1}
              className="p-3 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/70 disabled:opacity-20 text-white transition-all border border-white/10"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="text-xs opacity-60">
            İlerlemek için <strong>Space</strong> veya <strong>Sağ Ok</strong> tuşunu kullanın
          </div>
        </div>
      </div>
    );
  }

  // STANDARD STUDIO / MODAL MODE
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-6xl h-[92vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all duration-300 ${
          theme === 'dark' ? 'bg-[#121316] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-5 sm:px-6 py-3.5 border-b ${
            theme === 'dark' ? 'border-zinc-800/80 bg-[#16171b]' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Chat_CNR PowerPoint Stüdyosu</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Full PPTX
                </span>
              </div>
              <p className={`text-xs ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {language === 'tr'
                  ? 'Yapay zeka ile sunum üretin, düzenleyin ve Microsoft PowerPoint (.pptx) olarak indirin'
                  : 'Generate presentations with AI, edit slides and download as Microsoft PowerPoint (.pptx)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-all border border-zinc-700 active:scale-95 shadow-sm"
              title="Tam Ekran Sunum (F5 / F)"
            >
              <Play size={14} className="text-emerald-400 fill-emerald-400" />
              <span className="hidden sm:inline">Sunumu Başlat</span>
            </button>

            <button
              onClick={handleExportPPTX}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md active:scale-95 disabled:opacity-50"
              title="Microsoft PowerPoint (.pptx) Olarak İndir"
            >
              <Download size={14} />
              <span>{isExporting ? 'Hazırlanıyor...' : 'PPTX İndir'}</span>
            </button>

            {onInsertToChat && (
              <button
                onClick={handleInsertToChat}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 transition-all"
                title="Sohbete Aktar"
              >
                <MessageSquare size={14} />
                <span>Sohbete Aktar</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-600 hover:text-black'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* AI Generator Bar */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${
            theme === 'dark' ? 'bg-[#141518] border-zinc-800/80' : 'bg-zinc-100/70 border-zinc-200'
          }`}
        >
          <div className="flex-1 w-full flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
              placeholder={
                language === 'tr'
                  ? 'Sunum konusu girin (örn: "2026 Yapay Zeka Trendleri", "Şirket Tanıtımı", "Girişimci Pitch Deck")'
                  : 'Enter presentation topic (e.g., "AI Trends 2026", "Company Overview", "Pitch Deck")'
              }
              className="w-full bg-transparent text-xs sm:text-sm outline-none font-medium placeholder:text-zinc-500"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <select
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className={`text-xs py-1.5 px-2.5 rounded-xl border font-semibold outline-none ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'
              }`}
            >
              <option value={3}>3 Slayt (Özet)</option>
              <option value={5}>5 Slayt (Standart)</option>
              <option value={7}>7 Slayt (Kapsamlı)</option>
              <option value={10}>10 Slayt (Detaylı)</option>
            </select>

            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || !topicInput.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all shadow-md active:scale-95 disabled:opacity-50 shrink-0"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              <span>{isGenerating ? 'Üretiliyor...' : 'Yapay Zeka ile Üret'}</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Slide Thumbnails */}
          <div
            className={`w-44 sm:w-56 border-r flex flex-col custom-scrollbar overflow-y-auto shrink-0 ${
              theme === 'dark' ? 'border-zinc-800/80 bg-[#101114]' : 'border-zinc-200 bg-zinc-50'
            }`}
          >
            <div className="p-3 border-b border-zinc-800/40 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Slaytlar ({deck.slides.length})
              </span>
              <button
                onClick={handleAddSlide}
                className="p-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors"
                title="Yeni Slayt Ekle"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="p-3 space-y-2.5 flex-1">
              {deck.slides.map((s, idx) => {
                const isActive = idx === activeSlideIndex;
                return (
                  <div
                    key={s.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`group relative p-2.5 rounded-2xl border cursor-pointer transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/10 shadow-md ring-2 ring-amber-500/20'
                        : theme === 'dark'
                        ? 'border-zinc-800/80 bg-zinc-900/60 hover:border-zinc-700'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-500">
                        #{idx + 1} • {s.layout.toUpperCase()}
                      </span>
                      {deck.slides.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSlide(idx);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-400 hover:bg-red-500/10 transition-all"
                          title="Slaytı Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate leading-tight">{s.title}</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {s.subtitle || (s.bullets && s.bullets[0]) || s.statNumber || '-'}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Deck theme selector */}
            <div className="p-3 border-t border-zinc-800/40 space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Sunum Teması
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(PRESENTATION_THEMES) as ThemeKey[]).map((tKey) => {
                  const tObj = PRESENTATION_THEMES[tKey];
                  const isSelected = deck.theme === tKey;
                  return (
                    <button
                      key={tKey}
                      onClick={() => handleThemeChange(tKey)}
                      className={`p-2 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all border text-left truncate ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                          : theme === 'dark'
                          ? 'border-zinc-800 text-zinc-400 hover:text-white'
                          : 'border-zinc-200 text-zinc-600 hover:text-black'
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: `#${tObj.accentColorHex}` }} />
                      <span className="truncate">{tObj.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center: Slide Preview & Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
            {/* Toolbar above slide */}
            <div
              className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between gap-2 ${
                theme === 'dark' ? 'border-zinc-800/60 bg-[#141518]' : 'border-zinc-200 bg-zinc-50'
              }`}
            >
              {/* Layout Switcher */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mr-1.5 shrink-0 hidden sm:inline">
                  Düzen:
                </span>
                {[
                  { id: 'title', label: 'Kapak', icon: Layout },
                  { id: 'bullets', label: 'Maddeler', icon: FileText },
                  { id: 'split', label: '2 Sütun', icon: Columns },
                  { id: 'stat', label: 'İstatistik', icon: BarChart3 },
                  { id: 'conclusion', label: 'Kapanış', icon: Check },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentSlide.layout === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleLayoutChange(item.id as SlideLayout)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon size={12} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Edit Mode Toggle & Notes Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    showNotes
                      ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                      : 'border-zinc-700/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  Konuşmacı Notları
                </button>

                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all border ${
                    isEditMode
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : 'border-zinc-700/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  {isEditMode ? <Eye size={13} /> : <Edit3 size={13} />}
                  <span>{isEditMode ? 'Önizleme' : 'Slaytı Düzenle'}</span>
                </button>
              </div>
            </div>

            {/* Slide Presentation Canvas */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden border border-white/10 transition-all">
                {isEditMode ? (
                  <SlideEditor
                    slide={currentSlide}
                    theme={currentTheme}
                    onChange={(fields) => updateCurrentSlide(fields)}
                  />
                ) : (
                  <SlideRenderer slide={currentSlide} theme={currentTheme} deck={deck} />
                )}
              </div>

              {/* Speaker notes section below slide */}
              {showNotes && (
                <div className="w-full max-w-4xl mt-4 p-4 rounded-2xl border border-zinc-800 bg-[#16171b] space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Konuşmacı Notları (Bu Slayt İçin)
                    </span>
                    <span className="text-[11px] text-zinc-500">PowerPoint dosyasına gömülü olarak aktarılır</span>
                  </div>
                  <textarea
                    rows={2}
                    value={currentSlide.speakerNotes || ''}
                    onChange={(e) => updateCurrentSlide({ speakerNotes: e.target.value })}
                    placeholder="Sunum sırasında hatırlamak istediğiniz konuşma noktaları ve detaylar..."
                    className="w-full p-2.5 rounded-xl text-xs bg-zinc-900 border border-zinc-800 text-zinc-200 outline-none focus:border-amber-500/50 resize-none font-sans"
                  />
                </div>
              )}
            </div>

            {/* Slide Navigation Footer */}
            <div
              className={`px-5 py-3 border-t flex items-center justify-between ${
                theme === 'dark' ? 'border-zinc-800/80 bg-[#141518]' : 'border-zinc-200 bg-zinc-50'
              }`}
            >
              <button
                onClick={prevSlide}
                disabled={activeSlideIndex === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition-all border border-zinc-700"
              >
                <ChevronLeft size={16} />
                <span>Önceki Slayt</span>
              </button>

              <div className="text-xs font-mono font-bold text-zinc-400">
                Slayt {activeSlideIndex + 1} / {deck.slides.length}
              </div>

              <button
                onClick={nextSlide}
                disabled={activeSlideIndex === deck.slides.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 text-white transition-all border border-zinc-700"
              >
                <span>Sonraki Slayt</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-60 px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-semibold text-xs shadow-2xl animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
            <Check size={16} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ===================== SLIDE RENDERER (16:9 Aspect Ratio Presentation View) =====================
const SlideRenderer: React.FC<{
  slide: PresentationSlide;
  theme: any;
  deck: PresentationDeck;
}> = ({ slide, theme, deck }) => {
  return (
    <div
      className="w-full aspect-[16/9] p-6 sm:p-12 flex flex-col justify-between relative overflow-hidden select-none"
      style={{
        backgroundColor: `#${theme.bgHex}`,
        color: `#${theme.textColorHex}`,
      }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: `#${theme.accentColorHex}` }}
      />

      {/* Slide Badge */}
      <div className="flex items-center justify-between mb-2">
        {slide.badge ? (
          <span
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `#${theme.accentColorHex}20`,
              color: `#${theme.accentColorHex}`,
            }}
          >
            {slide.badge}
          </span>
        ) : <div />}
        <span className="text-[10px] sm:text-xs font-mono opacity-40">
          Chat_CNR
        </span>
      </div>

      {/* Main Slide Content based on layout */}
      <div className="flex-1 flex flex-col justify-center my-auto">
        {slide.layout === 'title' && (
          <div className="space-y-4 max-w-3xl">
            <div className="w-16 h-1 rounded-full" style={{ backgroundColor: `#${theme.accentColorHex}` }} />
            <h1
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ color: `#${theme.titleColorHex}` }}
            >
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p
                className="text-sm sm:text-xl font-medium leading-relaxed"
                style={{ color: `#${theme.subtextColorHex}` }}
              >
                {slide.subtitle}
              </p>
            )}
            <div className="pt-4 text-xs font-semibold opacity-60">
              {deck.author || 'Chat_CNR AI'} • {new Date().toLocaleDateString('tr-TR')}
            </div>
          </div>
        )}

        {slide.layout === 'bullets' && (
          <div className="space-y-4">
            <div>
              <h2
                className="text-xl sm:text-3xl font-bold tracking-tight"
                style={{ color: `#${theme.titleColorHex}` }}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-xs sm:text-sm mt-1" style={{ color: `#${theme.subtextColorHex}` }}>
                  {slide.subtitle}
                </p>
              )}
            </div>

            <div
              className="p-5 sm:p-7 rounded-2xl border space-y-3.5"
              style={{
                backgroundColor: `#${theme.cardBgHex}`,
                borderColor: `#${theme.accentColorHex}30`,
              }}
            >
              {(slide.bullets || [slide.content || 'Bilgi içeriği']).map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 shrink-0"
                    style={{ backgroundColor: `#${theme.accentColorHex}` }}
                  />
                  <p className="text-xs sm:text-base font-medium leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {slide.layout === 'split' && (
          <div className="space-y-4">
            <div>
              <h2
                className="text-xl sm:text-3xl font-bold tracking-tight"
                style={{ color: `#${theme.titleColorHex}` }}
              >
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-xs sm:text-sm mt-1" style={{ color: `#${theme.subtextColorHex}` }}>
                  {slide.subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: `#${theme.cardBgHex}`,
                  borderColor: `#${theme.accentColorHex}40`,
                }}
              >
                <h4 className="text-xs sm:text-sm font-bold" style={{ color: `#${theme.accentColorHex}` }}>
                  {slide.splitTitleLeft || 'Özellikler & Avantajlar'}
                </h4>
                <div className="space-y-2">
                  {(slide.leftBullets || slide.bullets?.slice(0, 3) || ['Öne çıkan madde 1']).map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: `#${theme.accentColorHex}` }} />
                      <p className="text-xs sm:text-sm leading-snug">{b}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="p-4 sm:p-5 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: `#${theme.cardBgHex}`,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <h4 className="text-xs sm:text-sm font-bold" style={{ color: `#${theme.titleColorHex}` }}>
                  {slide.splitTitleRight || 'Uygulama & Eylem'}
                </h4>
                <div className="space-y-2">
                  {(slide.rightBullets || slide.bullets?.slice(3) || ['Eylem adımı 1']).map((b, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 opacity-50" style={{ backgroundColor: `#${theme.textColorHex}` }} />
                      <p className="text-xs sm:text-sm leading-snug">{b}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {slide.layout === 'stat' && (
          <div className="space-y-4">
            <h2
              className="text-xl sm:text-3xl font-bold tracking-tight"
              style={{ color: `#${theme.titleColorHex}` }}
            >
              {slide.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              <div
                className="sm:col-span-2 p-6 rounded-2xl border flex flex-col items-center justify-center text-center shadow-lg"
                style={{
                  backgroundColor: `#${theme.cardBgHex}`,
                  borderColor: `#${theme.accentColorHex}`,
                }}
              >
                <span
                  className="text-4xl sm:text-6xl font-black tracking-tight"
                  style={{ color: `#${theme.accentColorHex}` }}
                >
                  {slide.statNumber || '%85'}
                </span>
                <span className="text-xs sm:text-sm font-bold mt-2" style={{ color: `#${theme.titleColorHex}` }}>
                  {slide.statLabel || 'Başarı Kriteri'}
                </span>
              </div>

              <div
                className="sm:col-span-3 p-5 sm:p-6 rounded-2xl border space-y-2.5"
                style={{
                  backgroundColor: `#${theme.cardBgHex}`,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                {(slide.bullets || [slide.content || 'Veri açıklaması']).map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: `#${theme.accentColorHex}` }} />
                    <p className="text-xs sm:text-sm font-medium leading-relaxed">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {slide.layout === 'conclusion' && (
          <div
            className="p-6 sm:p-10 rounded-3xl border text-center space-y-4 max-w-2xl mx-auto shadow-xl"
            style={{
              backgroundColor: `#${theme.cardBgHex}`,
              borderColor: `#${theme.accentColorHex}50`,
            }}
          >
            <h2
              className="text-2xl sm:text-4xl font-extrabold tracking-tight"
              style={{ color: `#${theme.accentColorHex}` }}
            >
              {slide.title}
            </h2>
            {slide.subtitle && (
              <p className="text-xs sm:text-base font-semibold" style={{ color: `#${theme.titleColorHex}` }}>
                {slide.subtitle}
              </p>
            )}
            <div className="space-y-2 pt-2">
              {(slide.bullets || ['Teşekkürler & İletişim']).map((b, idx) => (
                <p key={idx} className="text-xs sm:text-sm opacity-90">{b}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide Footer */}
      <div className="flex items-center justify-between text-[10px] sm:text-xs opacity-50 pt-2 border-t border-white/5">
        <span>{deck.title}</span>
        <span>Microsoft PowerPoint Uyumlu</span>
      </div>
    </div>
  );
};

// ===================== SLIDE EDITOR =====================
const SlideEditor: React.FC<{
  slide: PresentationSlide;
  theme: any;
  onChange: (fields: Partial<PresentationSlide>) => void;
}> = ({ slide, theme, onChange }) => {
  return (
    <div
      className="w-full aspect-[16/9] p-5 sm:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar"
      style={{
        backgroundColor: `#${theme.bgHex}`,
        color: `#${theme.textColorHex}`,
      }}
    >
      <div className="space-y-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            type="text"
            value={slide.badge || ''}
            onChange={(e) => onChange({ badge: e.target.value })}
            placeholder="ETİKET (örn: GİRİŞ, ANALİZ)"
            className="w-32 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider outline-none border"
            style={{
              backgroundColor: `#${theme.cardBgHex}`,
              borderColor: `#${theme.accentColorHex}50`,
              color: `#${theme.accentColorHex}`,
            }}
          />
          <input
            type="text"
            value={slide.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Slayt Başlığı"
            className="flex-1 px-3 py-1.5 rounded-xl text-base font-bold outline-none border"
            style={{
              backgroundColor: `#${theme.cardBgHex}`,
              borderColor: 'rgba(255,255,255,0.15)',
              color: `#${theme.titleColorHex}`,
            }}
          />
        </div>

        <input
          type="text"
          value={slide.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder="Alt Başlık (Opsiyonel)"
          className="w-full px-3 py-1.5 rounded-xl text-xs outline-none border"
          style={{
            backgroundColor: `#${theme.cardBgHex}`,
            borderColor: 'rgba(255,255,255,0.1)',
            color: `#${theme.subtextColorHex}`,
          }}
        />

        {slide.layout === 'stat' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={slide.statNumber || ''}
              onChange={(e) => onChange({ statNumber: e.target.value })}
              placeholder="Sayı / Oran (örn: %95, 10X)"
              className="px-3 py-1.5 rounded-xl text-xs font-bold outline-none border"
              style={{
                backgroundColor: `#${theme.cardBgHex}`,
                borderColor: `#${theme.accentColorHex}`,
                color: `#${theme.accentColorHex}`,
              }}
            />
            <input
              type="text"
              value={slide.statLabel || ''}
              onChange={(e) => onChange({ statLabel: e.target.value })}
              placeholder="Metrik Açıklaması (örn: Doğruluk Oranı)"
              className="px-3 py-1.5 rounded-xl text-xs outline-none border"
              style={{
                backgroundColor: `#${theme.cardBgHex}`,
                borderColor: 'rgba(255,255,255,0.15)',
                color: `#${theme.titleColorHex}`,
              }}
            />
          </div>
        )}

        {/* Bullets text area */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider opacity-70">
            Madde Metinleri (Her satıra bir madde yazın):
          </label>
          <textarea
            rows={4}
            value={(slide.bullets || []).join('\n')}
            onChange={(e) =>
              onChange({
                bullets: e.target.value.split('\n').filter((l) => l.trim().length > 0),
              })
            }
            placeholder="1. Madde açıklaması&#10;2. Madde analizi&#10;3. Sonuç çıkarımı"
            className="w-full p-3 rounded-xl text-xs outline-none border resize-none font-sans"
            style={{
              backgroundColor: `#${theme.cardBgHex}`,
              borderColor: 'rgba(255,255,255,0.15)',
              color: `#${theme.textColorHex}`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
