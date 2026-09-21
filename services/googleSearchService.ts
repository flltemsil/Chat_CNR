export interface GoogleSearchSource {
  uri: string;
  title: string;
  translatedTitle?: string;
  snippet?: string;
}

export interface GoogleSearchResponse {
  query: string;
  text: string;
  sources: GoogleSearchSource[];
  searchQueries?: string[];
  detectedLanguage: string;
  targetLanguage: string;
  grounded: boolean;
  timestamp: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_SEARCH_LANGUAGES: SupportedLanguage[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
];

class GoogleSearchService {
  private recentSearchesKey = 'chat_cnr_google_recent_searches';

  /**
   * Detect the user's primary Google / browser / system language completely
   */
  detectUserGoogleLanguage(): { code: string; name: string; flag: string } {
    try {
      // 1. Check browser navigator language (standard Google Chrome / Android Google language)
      const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || 'tr').toLowerCase();
      const baseCode = navLang.split('-')[0];

      const matched = SUPPORTED_SEARCH_LANGUAGES.find(
        (l) => l.code === baseCode || l.code === navLang
      );
      if (matched) return matched;

      // 2. Check local preference
      const savedLang = localStorage.getItem('chat_cnr_google_search_lang');
      if (savedLang) {
        const savedMatch = SUPPORTED_SEARCH_LANGUAGES.find((l) => l.code === savedLang);
        if (savedMatch) return savedMatch;
      }
    } catch {
      // Fallback
    }

    return { code: 'tr', name: 'Türkçe', flag: '🇹🇷' };
  }

  /**
   * Save preferred search translation language
   */
  setTargetLanguagePreference(code: string) {
    try {
      localStorage.setItem('chat_cnr_google_search_lang', code);
    } catch {}
  }

  /**
   * Execute Google Search with universal translation into the user's language
   */
  async search(
    query: string,
    targetLanguage?: string,
    userApiKey?: string | null
  ): Promise<GoogleSearchResponse> {
    if (!query || !query.trim()) {
      throw new Error('Arama sorgusu boş olamaz.');
    }

    const detected = this.detectUserGoogleLanguage();
    const finalTargetLang = targetLanguage || detected.name;

    let keyToUse = userApiKey;
    if (!keyToUse) {
      try {
        keyToUse = localStorage.getItem('CHAT_CNR_USER_API_KEY');
      } catch {}
    }

    const response = await fetch('/api/google-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        userLanguage: detected.name,
        targetLanguage: finalTargetLang,
        userApiKey: keyToUse,
      }),
    });

    if (!response.ok) {
      let errorMsg = 'Google araması gerçekleştirilemedi.';
      try {
        const errJson = await response.json();
        if (errJson.error === 'QUOTA_EXCEEDED' || response.status === 429) {
          throw new Error('Google arama kotası dolu, lütfen az sonra tekrar deneyin.');
        }
        errorMsg = errJson.error || errorMsg;
      } catch (e: any) {
        if (e.message) throw e;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    this.saveRecentSearch(query.trim());

    return {
      query: query.trim(),
      text: data.text || '',
      sources: data.sources || [],
      searchQueries: data.searchQueries || [],
      detectedLanguage: detected.name,
      targetLanguage: finalTargetLang,
      grounded: !!data.grounded,
      timestamp: Date.now(),
    };
  }

  getRecentSearches(): string[] {
    try {
      const raw = localStorage.getItem(this.recentSearchesKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    } catch {
      return [];
    }
  }

  saveRecentSearch(query: string) {
    try {
      const current = this.getRecentSearches().filter((q) => q.toLowerCase() !== query.toLowerCase());
      const updated = [query, ...current].slice(0, 10);
      localStorage.setItem(this.recentSearchesKey, JSON.stringify(updated));
    } catch {}
  }

  clearRecentSearches() {
    try {
      localStorage.removeItem(this.recentSearchesKey);
    } catch {}
  }
}

export const googleSearchService = new GoogleSearchService();
