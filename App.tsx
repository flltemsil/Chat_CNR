
import React, { useState, useRef, useEffect, useMemo, Component } from 'react';
import { geminiService } from './services/geminiService';
import { Message, ChatSession, ChatState, ThemeColor, AppearanceMode } from './types';
import MessageItem from './components/MessageItem';
import { Menu, Plus, Trash2, X, MessageSquare, History, Settings, Mic, MicOff, Volume2, VolumeX, Camera, Send, User, LogOut } from 'lucide-react';

const STORAGE_KEY = 'chat_cnr_history_lite';
const USER_KEY = 'chat_cnr_user_lite';
const OWNER_EMAIL = "dorukaliarslan20@gmail.com";
const MASTER_KEY = "CNR_2026_SECURE";
const INTEGRITY_TOKEN = "AUTHORIZED_BY_DORUK_ALI_ARSLAN_2026";

const INITIAL_MESSAGE = (id: string, userName?: string): Message => ({
  id,
  role: 'model',
  text: `Merhaba${userName ? ' ' + userName : ''}, ben Chat_CNR. Bilgi merkezinize hoş geldiniz. Size nasıl yardımcı olabilirim?`,
  timestamp: new Date(),
});

// Security Guard: Prevents unauthorized modification of owner information
const SecurityGuard: React.FC<{ children: React.ReactNode; user: { name: string; email: string } | null }> = ({ children, user }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockInput, setUnlockInput] = useState('');
  const [hasReported, setHasReported] = useState(false);
  
  const footerText = "CNR Bilgi Merkezi • Doruk Ali Arslan";
  const isOwner = user?.email === OWNER_EMAIL;
  
  // Full Protection Mode: Check for multiple integrity markers
  const isFooterIntact = footerText.toLowerCase().includes("doruk ali arslan");
  const isTokenIntact = INTEGRITY_TOKEN === "AUTHORIZED_BY_DORUK_ALI_ARSLAN_2026";
  const isOwnerEmailIntact = OWNER_EMAIL === "dorukaliarslan20@gmail.com";
  
  const isSystemCompromised = !isFooterIntact || !isTokenIntact || !isOwnerEmailIntact;
  
  // Reporting logic
  useEffect(() => {
    if (isSystemCompromised && !isOwner && !hasReported && user) {
      fetch('/api/security/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: user,
          reason: "System Integrity Compromised (Tamper Detected)",
          timestamp: new Date().toISOString()
        })
      }).then(() => setHasReported(true)).catch(err => console.error("Report failed", err));
    }
  }, [isSystemCompromised, isOwner, user, hasReported]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockInput === MASTER_KEY) {
      setIsUnlocked(true);
    } else {
      alert("Geçersiz Anahtar!");
    }
  };

  // If tampered and not owner and not unlocked, lock the app
  if (isSystemCompromised && !isOwner && !isUnlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center font-['Inter']">
        <div className="max-w-md w-full space-y-8">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-2xl shadow-red-900/40">
            <X size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Tam Koruma Aktif</h1>
            <p className="text-zinc-400 leading-relaxed">
              Uygulama kodlarında izinsiz değişiklik algılandı. "Tam Koruma Modu" gereği sistem kendini kilitledi.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
              <p className="text-red-400 text-sm font-bold">
                İhlal raporu ve konum verileri Doruk Ali ARSLAN'a iletildi.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="pt-8 border-t border-zinc-800 space-y-4">
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">Yönetici Kilit Açma</p>
            <input 
              type="password"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
              placeholder="Master Key Girin..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
            />
            <button 
              type="submit"
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Kilidi Aç
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Simple Error Boundary Wrapper
const App: React.FC = () => {
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  useEffect(() => {
    const handleError = (e: ErrorEvent) => setError(e.error);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <X size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bir şeyler ters gitti</h1>
        <p className="text-zinc-400 mb-8 max-w-md">Uygulama başlatılırken bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.</p>
        <div className="bg-zinc-900 p-4 rounded-xl text-left mb-8 w-full max-w-lg overflow-auto">
          <code className="text-xs text-red-400">{error?.toString()}</code>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all"
        >
          Sayfayı Yenile
        </button>
      </div>
    );
  }

  return (
    <SecurityGuard user={user}>
      <ChatApp user={user} setUser={setUser} />
    </SecurityGuard>
  );
};

interface ChatAppProps {
  user: { name: string; email: string } | null;
  setUser: (user: { name: string; email: string } | null) => void;
}

const ChatApp: React.FC<ChatAppProps> = ({ user, setUser }) => {
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('chat_cnr_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('chat_cnr_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
      }
    } catch {}
    const initialId = Date.now().toString();
    return [{
      id: initialId,
      title: 'Yeni Sohbet',
      messages: [INITIAL_MESSAGE('1', user?.name)],
      updatedAt: new Date()
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(sessions[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [tempName, setTempName] = useState(user?.name || '');

  const activeSession = useMemo(() => 
    sessions.find(s => s.id === activeSessionId) || sessions[0], 
    [sessions, activeSessionId]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const playPCM = async (base64Data: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // PCM is 16-bit little-endian
      const int16Data = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(int16Data.length);
      for (let i = 0; i < int16Data.length; i++) {
        float32Data[i] = int16Data[i] / 32768.0;
      }
      
      const audioBuffer = ctx.createBuffer(1, float32Data.length, 24000);
      audioBuffer.getChannelData(0).set(float32Data);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (err) {
      console.error("Audio Playback Error:", err);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession.messages, isLoading]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Yeni Sohbet',
      messages: [INITIAL_MESSAGE(newId + '-1', user?.name)],
      updatedAt: new Date()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setIsSidebarOpen(false);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length === 1) {
      const newId = Date.now().toString();
      setSessions([{
        id: newId,
        title: 'Yeni Sohbet',
        messages: [INITIAL_MESSAGE(newId + '-1', user?.name)],
        updatedAt: new Date()
      }]);
      setActiveSessionId(newId);
      return;
    }
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (activeSessionId === id) {
      setActiveSessionId(newSessions[0].id);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginName.trim()) {
      const newUser = { name: loginName.trim(), email: loginEmail.trim() };
      setUser(newUser);
      const newId = Date.now().toString();
      setSessions([{
        id: newId,
        title: 'Yeni Sohbet',
        messages: [INITIAL_MESSAGE(newId + '-1', newUser.name)],
        updatedAt: new Date()
      }]);
      setActiveSessionId(newId);
    }
  };

  const handleLogout = () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz? Tüm sohbet geçmişiniz, kullanıcı bilgileriniz ve tercihleriniz kalıcı olarak silinecektir.')) {
      // Clear all app-related localStorage
      const keysToRemove = [STORAGE_KEY, USER_KEY, 'chat_cnr_theme'];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage if any
      sessionStorage.clear();
      
      // Reset state to trigger immediate UI change (optional but good for feedback)
      setUser(null);
      
      // Redirect to home to ensure a clean slate
      window.location.href = window.location.origin;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tarayıcınız ses tanımayı desteklemiyor.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(null, transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSend = async (e?: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    const text = overrideInput || input;
    if (!text.trim() && !selectedImage) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      imageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { 
            ...s, 
            messages: updatedMessages, 
            updatedAt: new Date(),
            title: s.title === 'Yeni Sohbet' ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s.title
          } 
        : s
    ));

    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setError(null);

    try {
      const response = await geminiService.sendMessage(
        userMsg.text,
        activeSession.messages,
        userMsg.imageUrl,
        user?.name
      );

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        sources: response.sources,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => 
        s.id === activeSessionId 
          ? { ...s, messages: [...s.messages, modelMsg], updatedAt: new Date() } 
          : s
      ));

      if (isAutoSpeak) {
        const audioBase64 = await geminiService.textToSpeech(response.text);
        if (audioBase64) {
          playPCM(audioBase64);
        }
      }
    } catch (err: any) {
      setError("Yanıt alınırken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-['Inter']">
        <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3">
              <MessageSquare size={40} className="text-white -rotate-3" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">Chat_CNR</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Devam etmek için kendinizi tanıtın</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">Adını Yaz</label>
              <input 
                type="text" 
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder=""
                className="w-full bg-[#1a1a1a] border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              Başlat
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] overflow-hidden font-['Inter'] transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 border-r transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${theme === 'dark' ? 'bg-[#121212] border-zinc-800' : 'bg-white border-zinc-200'}`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare size={16} className="text-white" />
              </div>
              <span className="font-bold text-sm">Sohbetler</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden p-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <button 
              onClick={createNewSession}
              className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus size={18} />
              <span>Yeni Sohbet</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsSidebarOpen(false);
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeSessionId === session.id ? (theme === 'dark' ? 'bg-blue-600/10 border border-blue-600/30 text-blue-400' : 'bg-blue-50 border border-blue-100 text-blue-600') : (theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="text-sm truncate font-medium">{session.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800 text-blue-400' : 'bg-white text-blue-600 border border-zinc-200'}`}>
                <User size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email || 'Kullanıcı'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Header */}
        <header className={`h-16 border-b backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-50 ${theme === 'dark' ? 'border-zinc-800 bg-[#0a0a0a]/80' : 'border-zinc-200 bg-white/80'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 rounded-xl ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                <MessageSquare size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-sm truncate max-w-[150px] md:max-w-none">{activeSession.title}</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Çevrimiçi</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAutoSpeak(!isAutoSpeak)}
              className={`p-2.5 rounded-xl transition-all ${isAutoSpeak ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200')}`}
              title={isAutoSpeak ? "Sesli Yanıt Açık" : "Sesli Yanıt Kapalı"}
            >
              {isAutoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
              title="Ayarlar"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          {activeSession.messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} themeColor="blue" appearance={theme} />
          ))}
          {isLoading && (
            <div className="flex gap-3 animate-pulse">
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <div className="space-y-2 flex-1">
                <div className={`h-4 rounded w-1/4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className={`h-4 rounded w-3/4 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm flex items-center gap-3">
              <X size={18} />
              <span>{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className={`p-4 border-t ${theme === 'dark' ? 'bg-[#0a0a0a] border-zinc-800' : 'bg-white border-zinc-200'}`}>
          {selectedImage && (
            <div className="mb-4 relative inline-block">
              <img src={selectedImage} alt="Seçilen" className={`h-20 w-20 object-cover rounded-xl border ${theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'}`} />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className={`flex-1 border rounded-2xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-blue-600/50 transition-all ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl transition-all ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Mesajınızı yazın..."
                rows={1}
                className={`flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none max-h-32 custom-scrollbar text-sm ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')}`}
              >
                {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
            <button 
              type="submit"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="p-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Send size={20} />
            </button>
          </form>
          <p className={`text-center text-[10px] mt-4 uppercase tracking-[0.2em] font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            CNR Bilgi Merkezi • Doruk Ali Arslan
          </p>
        </footer>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} className="text-blue-400" />
                Ayarlar
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Profil Ayarları</label>
                <div className={`border rounded-2xl p-4 space-y-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold truncate">{user.name}</p>
                      <p className={`text-xs truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email || 'Kullanıcı'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">İsmini Değiştir</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className={`flex-1 bg-transparent border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all ${theme === 'dark' ? 'border-zinc-800 text-white' : 'border-zinc-200 text-zinc-900'}`}
                      />
                      <button 
                        onClick={() => {
                          if (tempName.trim()) {
                            setUser({ ...user, name: tempName.trim() });
                            alert("İsim başarıyla güncellendi!");
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Tercihler</label>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-4 border rounded-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-3">
                      <Volume2 size={18} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} />
                      <span className="text-sm font-medium">Otomatik Seslendirme</span>
                    </div>
                    <button 
                      onClick={() => setIsAutoSpeak(!isAutoSpeak)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isAutoSpeak ? 'bg-blue-600' : (theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAutoSpeak ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 border rounded-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}>
                        {theme === 'dark' ? <Settings size={18} /> : <Settings size={18} />}
                      </div>
                      <span className="text-sm font-medium">Görünüm (Koyu/Açık)</span>
                    </div>
                    <button 
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className={`w-12 h-6 rounded-full transition-all relative ${theme === 'light' ? 'bg-blue-600' : (theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${theme === 'light' ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className={`pt-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/10 p-4 rounded-2xl font-bold transition-all"
                >
                  <LogOut size={18} />
                  Oturumu Kapat ve Verileri Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default App;
