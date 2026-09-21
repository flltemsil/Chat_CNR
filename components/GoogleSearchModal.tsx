import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ExternalLink,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Globe,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Mic,
  MicOff,
  MessageSquare,
  Clock,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  googleSearchService,
  GoogleSearchResponse,
  SUPPORTED_SEARCH_LANGUAGES,
  SupportedLanguage
} from '../services/googleSearchService';
import { chatCNRService } from '../services/chatCNRService';
import { Language } from '../types';

interface GoogleSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string) => void;
  theme?: 'dark' | 'light';
  initialQuery?: string;
  language?: Language;
  onLanguageChange?: (newLang: Language) => void;
}

export const GoogleSearchModal: React.FC<GoogleSearchModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  theme = 'dark',
  initialQuery = '',
  language = 'tr',
  onLanguageChange,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GoogleSearchResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [autoSyncAppLang, setAutoSyncAppLang] = useState(true);

  // User's detected Google / System Language
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => {
    return googleSearchService.detectUserGoogleLanguage();
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize and update on open
  useEffect(() => {
    if (isOpen) {
      const detected = googleSearchService.detectUserGoogleLanguage();
      setSelectedLang(detected);
      setRecentSearches(googleSearchService.getRecentSearches());

      // If autoSync is enabled, apply Google's language to the entire app interface
      const supportedAppLangs: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'it', 'ru'];
      if (autoSyncAppLang && supportedAppLangs.includes(detected.code as Language) && onLanguageChange && language !== detected.code) {
        onLanguageChange(detected.code as Language);
      }

      if (initialQuery) {
        setQuery(initialQuery);
        executeSearch(initialQuery, detected.name);
      } else {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    } else {
      stopAudio();
      stopVoiceRecognition();
    }
  }, [isOpen, initialQuery]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListeningVoice(false);
  };

  const handleVoiceSearch = () => {
    if (isListeningVoice) {
      stopVoiceRecognition();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Tarayıcınız sesli arama özelliğini desteklemiyor.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = selectedLang.code === 'tr' ? 'tr-TR' : selectedLang.code === 'en' ? 'en-US' : selectedLang.code;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListeningVoice(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          executeSearch(transcript, selectedLang.name);
        }
        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  const executeSearch = async (searchTerm?: string, targetLangName?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    stopAudio();

    try {
      const res = await googleSearchService.search(
        q,
        targetLangName || selectedLang.name
      );
      setResult(res);
      setRecentSearches(googleSearchService.getRecentSearches());
    } catch (err: any) {
      setError(err.message || 'Arama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    googleSearchService.setTargetLanguagePreference(lang.code);
    setIsLangDropdownOpen(false);

    // Sync with app language if supported and callback provided
    const supportedAppLangs: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'it', 'ru'];
    if (supportedAppLangs.includes(lang.code as Language) && onLanguageChange) {
      onLanguageChange(lang.code as Language);
    }

    if (result && query) {
      // Re-run search with new translation language
      executeSearch(query, lang.name);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
      stopAudio();
      return;
    }
    if (!result?.text) return;

    setIsPlayingAudio(true);
    try {
      // First 400 characters for snappy speech
      const previewText = result.text.replace(/[*#_`]/g, '').slice(0, 450);
      const audioBase64 = await chatCNRService.textToSpeech(previewText, selectedLang.code);

      if (audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
      } else {
        // Fallback to browser SpeechSynthesis
        const utterance = new SpeechSynthesisUtterance(previewText);
        utterance.lang = selectedLang.code === 'tr' ? 'tr-TR' : 'en-US';
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleSendResultToChat = () => {
    if (!result?.text || !onSendToChat) return;
    const chatSnippet = `🔍 **Google Arama Sonucu (${result.query})** [${selectedLang.name} Çevirisi]:\n\n${result.text}`;
    onSendToChat(chatSnippet);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-[#131314] border-zinc-800 text-white'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header with Google Logo & Language Bar */}
        <div
          className={`p-4 md:p-6 border-b flex flex-col gap-3 ${
            theme === 'dark' ? 'border-zinc-800/80 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Google Brand Logo Visual */}
              <div className="flex items-center text-2xl font-bold tracking-tight select-none">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
                <span
                  className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                    theme === 'dark'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }`}
                >
                  Canlı Arama & Evrensel Çeviri
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>

          {/* User's Google Language Acquisition & Translation Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <Globe size={15} className="text-blue-500 shrink-0" />
              <span className="text-zinc-400">Google / Cihaz Dili:</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-800/90 border-zinc-700 text-white hover:border-blue-500'
                      : 'bg-white border-zinc-300 text-zinc-800 hover:border-blue-500 shadow-xs'
                  }`}
                >
                  <span>{selectedLang.flag}</span>
                  <span>{selectedLang.name}</span>
                  <ChevronDown size={13} className="text-zinc-400" />
                </button>

                {isLangDropdownOpen && (
                  <div
                    className={`absolute left-0 mt-1.5 w-44 rounded-2xl border shadow-2xl py-1.5 z-50 max-h-56 overflow-y-auto custom-scrollbar ${
                      theme === 'dark'
                        ? 'bg-[#1c1c1e] border-zinc-700 text-white'
                        : 'bg-white border-zinc-200 text-zinc-900'
                    }`}
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Çevrilecek Dil
                    </div>
                    {SUPPORTED_SEARCH_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleSelectLanguage(l)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                          selectedLang.code === l.code
                            ? 'bg-blue-500/20 text-blue-400 font-bold'
                            : theme === 'dark'
                            ? 'hover:bg-zinc-800 text-zinc-300'
                            : 'hover:bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.name}</span>
                        </span>
                        {selectedLang.code === l.code && <Check size={13} className="text-blue-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const supportedAppLangs: Language[] = ['tr', 'en', 'es', 'de', 'fr', 'it', 'ru'];
                  if (supportedAppLangs.includes(selectedLang.code as Language) && onLanguageChange) {
                    onLanguageChange(selectedLang.code as Language);
                  }
                  setAutoSyncAppLang(!autoSyncAppLang);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                  autoSyncAppLang
                    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    : theme === 'dark'
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                }`}
                title="Google dilinizi tüm uygulama arayüzüne uygular"
              >
                <Sparkles size={12} className={autoSyncAppLang ? "text-blue-400" : "text-zinc-400"} />
                <span>
                  {autoSyncAppLang
                    ? (language === 'tr' ? 'Arayüz Diline Eşitlendi' : 'Synced with App UI')
                    : (language === 'tr' ? 'Arayüz Diline Eşitle' : 'Sync to App UI')}
                </span>
              </button>

              <div className="text-[11px] text-emerald-500 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  {language === 'tr'
                    ? 'Tüm küresel Google sonuçları eksiksiz bu dile çevrilir'
                    : 'All global Google results are translated into this language'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="p-4 md:p-6 pb-2">
          <form onSubmit={handleSubmit} className="relative">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-full border-2 transition-all shadow-md ${
                theme === 'dark'
                  ? 'bg-zinc-900/90 border-zinc-700 focus-within:border-blue-500 focus-within:shadow-[0_0_25px_rgba(66,133,244,0.15)]'
                  : 'bg-white border-zinc-300 focus-within:border-blue-500 focus-within:shadow-[0_0_20px_rgba(66,133,244,0.15)]'
              }`}
            >
              <Search size={20} className="text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Google'da aramak istediğiniz konuyu yazın..."
                className={`flex-1 bg-transparent border-none outline-none text-sm md:text-base font-medium ${
                  theme === 'dark' ? 'text-white placeholder:text-zinc-500' : 'text-zinc-900 placeholder:text-zinc-400'
                }`}
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
                  title="Temizle"
                >
                  <X size={16} />
                </button>
              )}

              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-2 rounded-full transition-all ${
                  isListeningVoice
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10'
                }`}
                title={isListeningVoice ? 'Dinleniyor... Konuşun' : 'Sesli Arama'}
              >
                {isListeningVoice ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40"
              >
                {loading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>Ara & Çevir</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Trending / Popular Suggestions */}
          {!result && !loading && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Örnek Aramalar:</span>
              {[
                'Bugünkü küresel son dakika haberleri',
                'Yapay zeka alanındaki en son yenilikler',
                'Güncel döviz kurları ve ekonomik gelişmeler',
                'NASA ve uzay keşifleri son durum'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(suggestion);
                    executeSearch(suggestion);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results / Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pt-2 space-y-4">
          {/* Loading Animation */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin-reverse" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold flex items-center justify-center gap-2">
                  <Sparkles size={18} className="text-blue-400 animate-pulse" />
                  <span>Google taranıyor...</span>
                </p>
                <p className="text-xs text-zinc-400">
                  Sonuçlar ve web kaynakları tamamen <strong className="text-blue-400">{selectedLang.name}</strong> diline çevriliyor.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={() => executeSearch()}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg transition-all"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Search Result Display */}
          {result && !loading && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Primary Translated Result Card */}
              <div
                className={`p-5 md:p-6 rounded-2xl border transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/60 border-zinc-800 shadow-xl'
                    : 'bg-white border-zinc-200 shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <h3 className="font-bold text-sm md:text-base">Google Arama Yanıtı & Sentezi</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      {selectedLang.flag} {selectedLang.name}
                    </span>
                  </div>

                  {/* Actions: TTS, Copy, Send to Chat */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePlayAudio}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isPlayingAudio
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : theme === 'dark'
                          ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                          : 'hover:bg-zinc-100 text-zinc-600'
                      }`}
                      title={isPlayingAudio ? 'Sesli Dinlemeyi Durdur' : 'Sesli Dinle'}
                    >
                      {isPlayingAudio ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      <span className="hidden sm:inline">{isPlayingAudio ? 'Durdur' : 'Dinle'}</span>
                    </button>

                    <button
                      onClick={handleCopy}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : theme === 'dark'
                          ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                          : 'hover:bg-zinc-100 text-zinc-600'
                      }`}
                      title="Metni Kopyala"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                    </button>

                    {onSendToChat && (
                      <button
                        onClick={handleSendResultToChat}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
                        title="Bu sonucu aktif Chat_CNR oturumuna ekle"
                      >
                        <MessageSquare size={14} />
                        <span>Sohbete Ekle</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Markdown text rendered fully in user's language */}
                <div
                  className={`prose max-w-none text-sm leading-relaxed ${
                    theme === 'dark' ? 'prose-invert text-zinc-200' : 'text-zinc-800'
                  }`}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.text}</ReactMarkdown>
                </div>
              </div>

              {/* Web Sources Grid */}
              {result.sources && result.sources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Globe size={13} className="text-blue-400" />
                      <span>Google Tarafından İncelenen Web Kaynakları ({result.sources.length})</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal">Doğrudan ziyaret edilebilir</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.sources.map((source, index) => {
                      let domain = '';
                      try {
                        domain = new URL(source.uri).hostname.replace('www.', '');
                      } catch {
                        domain = source.uri;
                      }

                      return (
                        <a
                          key={index}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition-all hover:scale-[1.01] ${
                            theme === 'dark'
                              ? 'bg-zinc-900/40 border-zinc-800/80 hover:border-blue-500/50 hover:bg-zinc-900'
                              : 'bg-zinc-50 border-zinc-200 hover:border-blue-400 hover:bg-white'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate text-blue-400 hover:underline">
                              {source.title || domain}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{domain}</p>
                          </div>
                          <ExternalLink size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Related Google Queries */}
              {result.searchQueries && result.searchQueries.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                    İlgili Google Aramaları
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.searchQueries.map((rq, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(rq);
                          executeSearch(rq);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                          theme === 'dark'
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-blue-500 hover:text-white'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-blue-500 hover:text-zinc-900'
                        }`}
                      >
                        <Search size={12} className="text-blue-500" />
                        <span>{rq}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Searches */}
          {!result && !loading && recentSearches.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1">
                  <Clock size={13} />
                  <span>Son Aramalar</span>
                </span>
                <button
                  onClick={() => {
                    googleSearchService.clearRecentSearches();
                    setRecentSearches([]);
                  }}
                  className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Geçmişi Temizle
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(term);
                      executeSearch(term);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                      theme === 'dark'
                        ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Search size={12} className="opacity-50" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
