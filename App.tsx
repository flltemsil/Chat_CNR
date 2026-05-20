
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { chatCNRService } from './services/chatCNRService';
import { Message, ChatSession, ThemeColor, AppearanceMode, Language } from './types';
import { translations } from './translations';
import MessageItem from './components/MessageItem';
import ProfileModal from './components/ProfileModal';
import { profileService } from './services/profileService';
import { Menu, Plus, Trash2, X, MessageSquare, Settings, Mic, MicOff, Volume2, VolumeX, Camera, Send, User, LogOut, Shield, Users, Image as ImageIcon, Sparkles, Key, Check, ExternalLink, Heart, Cpu, Download, Smartphone, Brain, Microscope } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, db, signInWithGoogle, logout, onAuthStateChanged, 
  collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, 
  Timestamp, addDoc, deleteDoc, getDocs, FirebaseUser,
  increment, serverTimestamp 
} from './firebase';
import firebaseConfig from './firebase-applet-config.json';
import { UserProfile } from './types';

const OWNER_EMAIL = "dorukaliarslan20@gmail.com";
const BANNED_EMAILS = ["b4164370@gmail.com"];
const STORAGE_KEY = 'chat_cnr_sessions_v2';
const USER_KEY = 'chat_cnr_user_v2';

const LIMITS = {
  MESSAGES: 250,
  IMAGES: 2
};

// Error Handling Spec for Firestore Operations
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to clean undefined values for Firestore
const cleanForFirestore = (obj: any) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined) {
      delete cleaned[key];
    }
  });
  return cleaned;
};

// Security Guard: Prevents unauthorized access for banned users
const SecurityGuard: React.FC<{ children: React.ReactNode; user: { name: string; email: string } | null }> = ({ children, user }) => {
  const isBanned = user?.email && BANNED_EMAILS.includes(user.email);
  
  // BAN SCREEN
  if (isBanned) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center font-['Inter']">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-red-900/40">
            <Shield size={48} className="text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Erişim Engellendi</h1>
            <p className="text-zinc-400 leading-relaxed">
              Hesabınız sistem kurallarını ihlal ettiği için kalıcı olarak yasaklanmıştır.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
              <p className="text-red-400 text-sm font-bold">
                Bu email adresi sistem kara listesindedir. (b4164370@gmail.com)
              </p>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Simple Error Boundary Wrapper
const App: React.FC = () => {
  console.log("App component: Initializing");
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const isAuthLoadingRef = useRef(true);
  const [debugStatus, setDebugStatus] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    console.log("App: Auth loading state", isAuthLoading);
  }, [isAuthLoading, user]);

  useEffect(() => {
    // Health check - silent on initial load
    fetch('/api/health')
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);
  }, []);

  const setAuthLoading = (val: boolean) => {
    setIsAuthLoading(val);
    isAuthLoadingRef.current = val;
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  useEffect(() => {
    // Auth timeout to prevent infinite loading screen
    const timeout = setTimeout(() => {
      if (isAuthLoadingRef.current) {
        console.warn("Auth loading timed out. Forcing load state.");
        setAuthLoading(false);
      }
    }, 10000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email);
      clearTimeout(timeout);
      try {
        if (firebaseUser) {
          const profile = await profileService.getProfile(firebaseUser.uid);
          if (profile) {
            setUser(profile);
            // Update last login
            await profileService.updateProfile(firebaseUser.uid, { lastLogin: new Date() });
          } else {
            const role = firebaseUser.email === OWNER_EMAIL ? 'admin' : 'user';
            const newProfile = await profileService.createUserProfile(
              firebaseUser.uid, 
              firebaseUser.email || '', 
              firebaseUser.displayName || 'Kullanıcı',
              role
            );
            setUser(newProfile);
          }
        } else {
          setUser(null);
        }
      } catch (err: any) {
        if (err.message && err.message.startsWith('{')) {
          throw err; // Re-throw FirestoreErrorInfo
        }
        handleFirestoreError(err, OperationType.GET, `users/${firebaseUser?.uid}`);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] text-white p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <X size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Bir şeyler ters gitti</h1>
        <p className="text-zinc-400 mb-8 max-w-md">Uygulama başlatılırken bir hata oluştu. Lütfen sayfayı yenilemeyi deneyin.</p>
        <div className="bg-zinc-900 p-4 rounded-xl text-left mb-8 w-full max-w-lg overflow-auto border border-red-500/30">
          <p className="text-xs text-zinc-500 mb-2 uppercase tracking-widest font-bold">Hata Detayı:</p>
          <code className="text-xs text-red-400 whitespace-pre-wrap">
            {typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : error?.toString()}
          </code>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-bold transition-all"
          >
            Yeniden Dene
          </button>
          <button 
            onClick={() => {
              // Clear local storage and reload
              localStorage.clear();
              window.location.reload();
            }}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-all"
          >
            Sıfırla ve Yenile
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 font-['Inter'] relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center relative z-10"
        >
          {/* Left Side: Brand & Hero */}
          <div className="space-y-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-900/30">
                <Cpu size={32} className="text-white" />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Chat_CNR</h1>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
                Yapay Zekanın <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Yeni Nesli</span>
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-md mx-auto md:mx-0">
                Hub ile sınırsız bilgiye, gerçek zamanlı arama verilerine ve profesyonel yapay zeka gücüne tek tıkla ulaşın.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
                <Check size={14} className="text-green-500" />
                <span className="text-xs font-bold text-zinc-300">Yüksek Doğruluk</span>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
                <Check size={14} className="text-green-500" />
                <span className="text-xs font-bold text-zinc-300">Gerçek Zamanlı</span>
              </div>
               <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
                <Check size={14} className="text-green-500" />
                <span className="text-xs font-bold text-zinc-300">Güvenli</span>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="bg-zinc-900/30 border border-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-10 space-y-6 shadow-3xl">
             <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Sisteme Giriş Yap</h3>
                <p className="text-sm text-zinc-500">Devam etmek için hesabınızı bağlayın.</p>
             </div>

             <button 
              disabled={isLoginLoading}
              onClick={async (e) => {
                e.preventDefault();
                if (isLoginLoading) return;
                setIsLoginLoading(true);
                try {
                  await signInWithGoogle();
                } catch (err: any) {
                  console.error("Login error:", err);
                  alert(`Giriş yapılamadı: ${err.message || "Bilinmeyen hata"}`);
                } finally {
                  setIsLoginLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] group"
            >
              {isLoginLoading ? (
                 <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                 <img src="https://www.google.com/favicon.ico" className="w-6 h-6 border rounded-full p-0.5" alt="Google" />
              )}
              {isLoginLoading ? "Giriş Yapılıyor..." : "Google ile Başlat"}
              <ExternalLink size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0a0a0a] px-4 text-zinc-600 font-bold tracking-widest leading-none">Uygulama Olarak İndir</span></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={isInstallable ? handleInstallClick : () => {
                  alert("EXE (Windows) Yükleme Rehberi: Tarayıcı adres çubuğundaki 'Yükle' ikonuna basın veya menuden 'Uygulamayı Yükle' seçeneğini seçin. Bu sayede uygulama masaüstünüze EXE olarak eklenecektir.");
                }}
                className={`flex flex-col items-center justify-center gap-2 ${isInstallable ? 'bg-blue-600/20 border-blue-500/30 font-bold' : 'bg-zinc-800/50 border-zinc-700'} hover:bg-zinc-800 border py-4 rounded-3xl transition-all group`}
              >
                <div className={`w-10 h-10 ${isInstallable ? 'bg-blue-600' : 'bg-zinc-700'} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Download size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                  {isInstallable ? 'Hemen Yükle (EXE)' : 'Windows (EXE)'}
                </span>
              </button>
              
              <button 
                onClick={isInstallable ? handleInstallClick : () => {
                   alert("APK (Android) Yükleme Rehberi: Chrome menüsünden 'Ana Ekrana Ekle' seçeneğine dokunun. Uygulama telefonunuza APK olarak yüklenecektir.");
                }}
                className={`flex flex-col items-center justify-center gap-2 ${isInstallable ? 'bg-purple-600/20 border-purple-500/30' : 'bg-zinc-800/50 border-zinc-700'} hover:bg-zinc-800 border py-4 rounded-3xl transition-all group`}
              >
                <div className={`w-10 h-10 ${isInstallable ? 'bg-purple-600' : 'bg-zinc-700'} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Smartphone size={20} className="text-white" />
                </div>
                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-wider">
                   {isInstallable ? 'Hemen Yükle (APK)' : 'Android (APK)'}
                </span>
              </button>
            </div>

            <p className="text-[10px] text-center text-zinc-600 font-medium px-4">
              Copyright © 2026 Chat CNR Information Hub. Tüm hakları saklıdır. Professional Edition v2.0
            </p>
          </div>
        </motion.div>
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
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

const ChatApp: React.FC<ChatAppProps> = ({ user, setUser }) => {
  console.log("ChatApp: Initializing for user", user?.email);

  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [dailyUsage, setDailyUsage] = useState({ messages: 0, images: 0 });
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [isChatMode, setIsChatMode] = useState(() => {
    try {
      return localStorage.getItem('chat_cnr_chat_mode') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('chat_cnr_theme') as 'light' | 'dark') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return (localStorage.getItem('chat_cnr_lang') as Language) || 'tr';
    } catch (e) {
      return 'tr';
    }
  });

  const t = translations[language] || translations.tr;
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isDeepMode, setIsDeepMode] = useState(() => {
    try {
      return localStorage.getItem('chat_cnr_deep_mode') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempName, setTempName] = useState(user.name);
  const [allUsers, setAllUsers] = useState<{email: string, name: string}[]>([]);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<{ id: string, text: string, sources: any[] } | null>(null);

  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', user.uid, 'usage', dateStr);
    
    const unsubscribe = onSnapshot(usageRef, (docSnap) => {
      if (docSnap.exists()) {
        setDailyUsage({
          messages: docSnap.data()?.messages || 0,
          images: docSnap.data()?.images || 0
        });
      } else {
        setDailyUsage({ messages: 0, images: 0 });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}/usage/current`);
    });

    return () => unsubscribe();
  }, [user]);

  const incrementUsage = async (type: 'messages' | 'images') => {
    if (!user) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', user.uid, 'usage', dateStr);
    
    try {
      await setDoc(usageRef, {
        [type]: increment(1),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/usage/current`);
    }
  };

  const checkLimit = (type: 'messages' | 'images') => {
    if (user?.email === OWNER_EMAIL) return true;
    const limit = type === 'messages' ? LIMITS.MESSAGES : LIMITS.IMAGES;
    const current = type === 'messages' ? dailyUsage.messages : dailyUsage.images;
    
    if (current >= limit) {
      alert(`Günlük ${type === 'messages' ? 'mesaj' : 'görsel'} sınırınıza ulaştınız (${limit}). Lütfen yarın tekrar deneyin.`);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (user.email === OWNER_EMAIL && isAdminPanelOpen) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          email: doc.data().email,
          name: doc.data().name
        }));
        setAllUsers(users);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users`);
      });
      return () => unsubscribe();
    }
  }, [user.email, isAdminPanelOpen]);

  const activeSession = useMemo(() => {
    if (!activeSessionId) return null;
    const session = sessions.find(s => s.id === activeSessionId);
    return session || null;
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'users', user.uid, 'sessions'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("ChatApp: Sessions snapshot received", snapshot.size);
      const fetchedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data()?.title || 'Yeni Sohbet',
        ...doc.data(),
        updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
        createdAt: doc.data()?.createdAt?.toDate() || new Date(),
        messages: []
      })) as ChatSession[];
      
      setSessions(fetchedSessions);
      if (fetchedSessions.length > 0 && !activeSessionId) {
        setActiveSessionId(fetchedSessions[0].id);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sessions`);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (activeSessionId && user) {
      const q = query(
        collection(db, 'users', user.uid, 'sessions', activeSessionId, 'messages'),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("ChatApp: Messages snapshot received", snapshot.size);
        const fetchedMessages = snapshot.docs.map(doc => ({
          ...doc.data(),
          timestamp: doc.data()?.timestamp?.toDate() || new Date(),
        })) as Message[];

        setSessions(prev => prev.map(s => 
          (s && s.id === activeSessionId) ? { ...s, messages: fetchedMessages } : s
        ));
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/sessions/${activeSessionId}/messages`);
      });

      return () => unsubscribe();
    }
  }, [activeSessionId, user.uid]);

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
    localStorage.setItem('chat_cnr_chat_mode', isChatMode.toString());
  }, [isChatMode]);

  useEffect(() => {
    localStorage.setItem('chat_cnr_deep_mode', isDeepMode.toString());
  }, [isDeepMode]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isLoading]);

  const createNewSession = async () => {
    const newId = Date.now().toString();
    const newSession = {
      id: newId,
      userId: user.uid,
      title: 'Yeni Sohbet',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid, 'sessions', newId), newSession);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${newId}`);
    }
    
    setActiveSessionId(newId);
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          const MAX_DIMENSION = 512; // Very safe max dimension for Firestore 1MB limit
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
          
          canvas.width = Math.floor(width);
          canvas.height = Math.floor(height);
          
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Compress image aggressively to fit within Firestore limit
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.5);
            console.log("Compressed image size (bytes):", compressedDataUrl.length);
            if (compressedDataUrl.length > 1000000) {
              alert("Görsel sıkıştırıldıktan sonra bile çok büyük (1MB sınırını aşıyor). Lütfen daha düşük çözünürlüklü bir dosya seçin.");
              return;
            }
            setSelectedImage(compressedDataUrl);
          } else {
            console.warn("Canvas context failed, using original");
            const raw = ev.target?.result as string;
            if (raw.length > 1000000) {
              alert("Cihazınız görseli sıkıştıramadı ve orijinal boyutu 1MB sınırını aşıyor. Lütfen daha küçük bir dosya seçin.");
              return;
            }
            setSelectedImage(raw); // fallback
          }
        };
        img.onerror = () => {
          console.error("Failed to load image for compression");
          const raw = ev.target?.result as string;
          if (raw.length > 1000000) {
            alert("Görsel yüklenemedi ve boyutu çok büyük (1MB sınırı).");
            return;
          }
          setSelectedImage(raw);
        };
        img.src = ev.target?.result as string;
      };
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
    const voiceLangMap: Record<string, string> = {
      'tr': 'tr-TR',
      'en': 'en-US',
      'es': 'es-ES',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'it': 'it-IT',
      'ru': 'ru-RU'
    };
    recognition.lang = voiceLangMap[language] || 'tr-TR';
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

  const lastSentMessageRef = useRef<string>('');

  const handleSend = async (e?: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    if (!activeSession || !activeSession.messages) return;
    if (!checkLimit('messages')) return;
    const text = overrideInput || input;
    if (!text.trim() && !selectedImage) return;

    lastSentMessageRef.current = text;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      imageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const updatedMessages = [...(activeSession?.messages || []), userMsg];
    
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { 
            ...s, 
            messages: updatedMessages, 
            updatedAt: new Date(),
            title: s?.title === 'Yeni Sohbet' ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : s?.title
          } 
        : s
    ));

    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    setError(null);

    try {
      const modelMsgId = (Date.now() + 1).toString();
      const initialModelMsg: Message = {
        id: modelMsgId,
        role: 'model',
        text: '',
        timestamp: new Date(),
      };

      // Add user message to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', userMsg.id), cleanForFirestore({
          ...userMsg,
          timestamp: Timestamp.now()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${activeSessionId}/messages/${userMsg.id}`);
      }

      // Update session title and updatedAt
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!), {
          updatedAt: serverTimestamp(),
          title: (activeSession?.title || 'Yeni Sohbet') === 'Yeni Sohbet' ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : (activeSession?.title || 'Yeni Sohbet')
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${activeSessionId}`);
      }

      await incrementUsage('messages');

      let finalResponseText = "";
      let finalSources: any[] = [];
      let finalGrounded = false;
      const stream = chatCNRService.sendMessageStream(
        userMsg.text,
        activeSession?.messages || [],
        userMsg.imageUrl,
        user.name,
        user.email,
        isChatMode,
        user.role,
        user,
        language,
        isDeepMode
      );

      // Show streaming message locally only
      setStreamingMessage({ id: modelMsgId, text: '', sources: [] });

      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (!chunk) continue;
        
        const chunkText = chunk.text || "";
        const chunkSources = chunk.sources || [];
        const chunkGrounded = !!chunk.grounded;

        if (isFirstChunk && chunkText.trim()) {
          setIsLoading(false);
          isFirstChunk = false;
        }
        finalResponseText = chunkText;
        finalSources = chunkSources;
        finalGrounded = chunkGrounded;
        
        // Update local streaming state ONLY
        if (chunkText.trim()) {
          setStreamingMessage({ 
            id: modelMsgId, 
            text: chunkText, 
            sources: finalSources 
          });
        }
      }

      if (!finalResponseText.trim()) {
        console.error("Empty response from AI. (History hidden to prevent spam)");
        throw new Error("Yapay zeka şu an yanıt veremiyor. Sunucu boş bir yanıt döndürdü. Lütfen tekrar deneyin.");
      }

      // Final update to Firestore ONCE at the end
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', modelMsgId), cleanForFirestore({
          id: modelMsgId,
          role: 'model',
          text: finalResponseText,
          sources: finalSources,
          isDeep: isDeepMode,
          grounded: finalGrounded,
          timestamp: Timestamp.now()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${activeSessionId}/messages/${modelMsgId}`);
      }

      setStreamingMessage(null);

      if (isAutoSpeak) {
        const audioBase64 = await chatCNRService.textToSpeech(finalResponseText);
        if (audioBase64) {
          playPCM(audioBase64);
        }
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Bilinmeyen hata';
      
      // Try to parse JSON error if it exists
      let errorType = "";
      let errorDetails = "";
      try {
        if (errorMessage.includes('{')) {
          const jsonStr = errorMessage.substring(errorMessage.indexOf('{'));
          const parsed = JSON.parse(jsonStr);
          if (parsed.error?.message) errorMessage = parsed.error.message;
          else if (parsed.error && typeof parsed.error === 'string') errorMessage = parsed.error;
          
          if (parsed.errorType) errorType = parsed.errorType;
          if (parsed.details) errorDetails = parsed.details;
        }
      } catch (e) {}

      if (errorType === "QUOTA_EXCEEDED" || errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setError(t.quotaExceeded || `SİSTEM KOTASI DOLDU: Günlük kullanım sınırına ulaşıldı. Google Gemini API ücretsiz sürümde kota sınırları bulunmaktadır. Kendi API anahtarınızı Profile -> Settings -> API Keys kısmından ekleyerek bu sınırı aşabilirsiniz.`);
      } else if (errorMessage === "API_KEY_MISSING") {
        setError("API Anahtarı bulunamadı. Lütfen AI Studio Build panelindeki Settings kısmından CHAT_CNR_API_KEY değişkenini tanımlayın.");
      } else if (
        errorType === "API_KEY_INVALID" ||
        errorMessage.includes("API key not valid") || 
        errorMessage.includes("API_KEY_INVALID") || 
        errorMessage === "INVALID_API_KEY_FORMAT" ||
        errorMessage.includes("invalid-api-key") ||
        errorMessage.toLowerCase().includes("invalid key")
      ) {
        setError(`GEÇERSİZ API ANAHTARI: Sistem anahtarı reddetti. Lütfen Settings -> CHAT_CNR_API_KEY kısmındaki anahtarın doğruluğunu kontrol edin. Eğer yeni bir anahtar aldıysanız, AI Studio Build Settings panelinden güncellediğinizden emin olun.`);
      } else {
        console.error("Chat Error:", errorMessage);
        setError(`Yanıt alınırken bir sorun oluştu: ${errorMessage}. Lütfen bağlantınızı kontrol edip tekrar deneyin.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-[100dvh] overflow-hidden font-['Inter'] transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0a0a] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-72 border-r transition-all duration-500 ease-[0.23, 1, 0.32, 1] lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} ${theme === 'dark' ? 'bg-[#050505] border-zinc-800/80 shadow-[10px_0_40px_rgba(0,0,0,0.4)]' : 'bg-white border-zinc-200'}`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className={`px-6 py-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-100'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={16} className="text-white" />
              </div>
              <span className="font-bold text-[13px] uppercase tracking-[0.2em]">{t.sessions}</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className={`lg:hidden p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-800 hover:text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <button 
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98]"
            >
              <Plus size={18} />
              <span className="text-sm">{t.newChat}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {sessions.filter(s => s && s.id).map((session, idx) => (
                <motion.div 
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.03, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => {
                    setActiveSessionId(session.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`group relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-300 border ${
                    activeSessionId === session.id 
                      ? (theme === 'dark' ? 'bg-zinc-800/50 border-zinc-700 text-white shadow-inner' : 'bg-zinc-100 border-zinc-200 text-zinc-900 shadow-inner')
                      : (theme === 'dark' ? 'border-transparent hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300' : 'border-transparent hover:bg-zinc-50 hover:border-zinc-200 text-zinc-600')
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${activeSessionId === session.id ? 'text-blue-500' : (theme === 'dark' ? 'text-zinc-600 group-hover:text-zinc-400' : 'text-zinc-400 group-hover:text-zinc-500')}`}>
                    <MessageSquare size={14} />
                  </div>
                  <span className="flex-1 text-[13px] font-medium truncate pr-6 tracking-tight">{session.title}</span>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSessionId(session.id);
                    }}
                    className={`absolute right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                      theme === 'dark' ? 'hover:bg-red-500/20 text-zinc-600 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500'
                    }`}
                  >
                    <Trash2 size={12} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* User Profile Section */}
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800/50 bg-[#070707]' : 'border-zinc-100 bg-zinc-50/50'}`}>
            <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'}`}>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-zinc-800 text-blue-400 group-hover:text-blue-300' : 'bg-zinc-100 text-blue-600'}`}>
                {user.email === OWNER_EMAIL ? <Shield size={18} /> : <User size={18} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold truncate tracking-tight">{user.name}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-widest ${
                    user.email === OWNER_EMAIL 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.email === OWNER_EMAIL ? 'SİSTEM SORUMLUSU' : 'PREMIUM'}
                  </span>
                </div>
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
        <header className={`h-16 border-b backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 ${theme === 'dark' ? 'border-zinc-800/50 bg-[#0a0a0a]/70' : 'border-zinc-200/50 bg-white/70'}`}>
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 -ml-2 rounded-lg transition-all flex-shrink-0 ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="hidden sm:flex w-8 h-8 bg-blue-600 rounded-lg items-center justify-center shadow-lg shadow-blue-500/10 flex-shrink-0">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div className="flex flex-col min-w-0">
                <h1 className="font-bold text-[13px] tracking-tight truncate uppercase">
                  {activeSession?.title || (sessions.length > 0 ? 'Loading...' : t.newChat)}
                </h1>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  <span className={`text-[9px] uppercase tracking-[0.15em] font-black ${theme === 'dark' ? 'text-emerald-500/80' : 'text-emerald-600'}`}>{t.online}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {user.email === OWNER_EMAIL && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                title={t.userList}
              >
                <Users size={16} />
              </button>
            )}
            <button 
              onClick={() => setIsAutoSpeak(!isAutoSpeak)}
              className={`p-2 rounded-lg transition-all border ${isAutoSpeak ? 'bg-blue-600 border-blue-500 text-white' : (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900')}`}
              title={isAutoSpeak ? t.voiceResponseOn : t.voiceResponseOff}
            >
              {isAutoSpeak ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-all border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
              title={t.settings}
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar relative px-4 md:px-8 py-8 space-y-8 ${theme === 'dark' ? 'bg-[#030303]' : 'bg-zinc-50'}`}>
          <div className="max-w-4xl mx-auto w-full">
            {activeSession ? (
              <>
                {activeSession.messages && activeSession.messages.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-[60vh] flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,99,235,0.1)] border border-blue-500/20">
                      <Sparkles size={40} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 tracking-tight">{t.systemReady}</h2>
                    <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                      {t.systemWelcome}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full max-w-md">
                      {[
                        { icon: <Cpu size={14} />, label: t.codeAnalysis, desc: t.expertLogic },
                        { icon: <Mic size={14} />, label: t.voiceResponse, desc: t.ultraRealistic },
                        { icon: <Shield size={14} />, label: t.secureProcess, desc: t.encrypted }
                      ].map((item, i) => (
                        <div key={i} className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200'}`}>
                          <div className="text-blue-500 mb-2">{item.icon}</div>
                          <div className="font-bold text-[12px]">{item.label}</div>
                          <div className="text-[10px] text-zinc-500">{item.desc}</div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                <div className="space-y-2">
                  {activeSession.messages && activeSession.messages.map((msg, idx) => (
                    <MessageItem key={msg.id} message={msg} themeColor="blue" appearance={theme} language={language} />
                  ))}
                </div>
                {streamingMessage && (
                  <MessageItem 
                    key={streamingMessage.id} 
                    message={{ 
                      id: streamingMessage.id,
                      role: 'model', 
                      text: streamingMessage.text,
                      sources: streamingMessage.sources,
                      timestamp: new Date() 
                    }} 
                    themeColor="blue" 
                    appearance={theme} 
                    isStreaming={true}
                    language={language}
                  />
                )}
              </>
            ) : (
              <div className="h-[70vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-800 shadow-2xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                  <MessageSquare size={44} className="text-zinc-700" />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight uppercase">{t.waitingConnection}</h3>
                <p className="text-zinc-500 max-w-xs text-sm">{t.waitingConnectionDesc}</p>
              </div>
            )}
            {isLoading && (
              <div className="flex gap-4 animate-pulse px-2">
                <div className={`w-9 h-9 rounded-xl flex-shrink-0 ${theme === 'dark' ? 'bg-zinc-900 border border-zinc-800' : 'bg-zinc-200'}`} />
                <div className="space-y-3 flex-1 pt-2">
                  <div className={`h-3 rounded-full w-1/4 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                  <div className={`h-3 rounded-full w-3/4 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-200'}`} />
                  <div className={`h-3 rounded-full w-1/2 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-zinc-100'}`} />
                </div>
              </div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/5 border border-red-500/20 text-red-400 p-6 rounded-[2rem] text-sm flex flex-col gap-4 shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold uppercase tracking-widest text-[10px] mb-1">{t.errorNotification}</p>
                    <span className="opacity-90">{error}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setError(null); handleSend(undefined, lastSentMessageRef.current); }}
                  className="self-end px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition-all text-xs border border-red-500/30 uppercase tracking-widest"
                >
                  {t.reconnect}
                </button>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-12" />
          </div>
        </main>

        {/* Footer */}
        <footer className={`px-4 py-4 md:p-6 pb-[calc(env(safe-area-inset-bottom,0)+16px)] border-t transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505]/95 backdrop-blur-2xl border-zinc-800/40 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]' : 'bg-white border-zinc-100'}`}>
          <div className="max-w-4xl mx-auto">
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mb-4 relative inline-block group"
              >
                <img src={selectedImage} alt="Seçilen" className={`h-28 w-28 object-cover rounded-2xl border-2 ${theme === 'dark' ? 'border-blue-500/40 ring-8 ring-blue-500/5' : 'border-blue-200'}`} />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-2xl transition-transform hover:scale-110 active:scale-95 border-2 border-[#050505]"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
            
            <form onSubmit={handleSend} className="flex gap-2 relative">
              <div className={`flex-1 border-2 rounded-3xl p-2 md:p-3 flex flex-col transition-all duration-500 shadow-inner relative overflow-hidden group ${
                theme === 'dark' 
                  ? 'bg-[#0a0a0a] border-zinc-800/80 focus-within:border-blue-600/30 focus-within:shadow-[0_0_60px_rgba(37,99,235,0.05)]' 
                  : 'bg-zinc-50 border-zinc-200 focus-within:border-blue-500/20'
              }`}>
                
                <div className="flex items-end gap-2 px-1">
                  <textarea 
                    value={input}
                    disabled={!activeSession}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={activeSession ? t.inputPlaceholder : t.noSession}
                    rows={1}
                    className={`flex-1 bg-transparent border-none focus:ring-0 py-2 resize-none max-h-40 md:max-h-56 custom-scrollbar text-[15px] font-medium leading-relaxed tracking-tight placeholder:text-zinc-700 disabled:opacity-50 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && activeSession) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  
                  {/* Send button & mic button inline with text mostly (on desktop or tablet if you prefer) - actually let's put mic and send at the bottom right */}
                </div>

                {/* Toolbar row (icons) - below text on mobile, or bottom row always */}
                <div className="flex items-center justify-between mt-1 md:mt-2 px-1">
                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      disabled={!activeSession}
                      onClick={() => setIsDeepMode(!isDeepMode)}
                      className={`p-2 rounded-xl transition-all disabled:opacity-30 flex items-center gap-2 group relative ${
                        isDeepMode 
                          ? 'bg-purple-600/10 text-purple-500 shadow-lg shadow-purple-500/10' 
                          : (theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')
                      }`}
                      title={t.deepMode}
                    >
                      <Brain size={18} className={isDeepMode ? 'animate-pulse' : ''} />
                    </button>
                    <button 
                      type="button"
                      disabled={!activeSession}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-xl transition-all disabled:opacity-30 ${theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                      title="Görsel Yükle"
                    >
                      <Camera size={18} />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageSelect} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      type="button"
                      disabled={!activeSession}
                      onClick={toggleRecording}
                      className={`p-2 rounded-xl transition-all disabled:opacity-30 ${
                        isRecording 
                          ? 'bg-red-500/10 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' 
                          : (theme === 'dark' ? 'text-zinc-500 hover:text-white hover:bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100')
                      }`}
                    >
                      {isRecording ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button 
                      type="submit"
                      disabled={!activeSession || (!input.trim() && !selectedImage) || isLoading}
                      className={`p-2 rounded-xl md:p-2.5 transition-all shadow-xl active:scale-95 disabled:opacity-30 ${
                        input.trim() || selectedImage
                          ? 'bg-blue-600 text-white shadow-blue-500/40 hover:bg-blue-500 translate-y-0 active:translate-y-0.5' 
                          : (theme === 'dark' ? 'bg-zinc-800 text-zinc-600' : 'bg-zinc-200 text-zinc-400')
                      }`}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <div className="mt-4 flex items-center justify-between px-2">
            </div>
          </div>
        </footer>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSessionId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-sm border rounded-3xl p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Sohbeti Sil</h2>
            <p className="text-zinc-500 text-sm mb-8">Bu sohbeti ve tüm mesajlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingSessionId(null)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'}`}
              >
                Vazgeç
              </button>
              <button 
                onClick={async () => {
                  const id = deletingSessionId;
                  setDeletingSessionId(null);
                  try {
                    await deleteDoc(doc(db, 'users', user.uid, 'sessions', id));
                    if (activeSessionId === id) {
                      setActiveSessionId(null);
                    }
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/sessions/${id}`);
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Modal */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-amber-400" />
                Kullanıcı Listesi
              </h2>
              <button onClick={() => setIsAdminPanelOpen(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {allUsers.length > 0 ? (
                allUsers.map((u, i) => (
                  <div key={i} className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <p className="font-bold text-sm">{u.name}</p>
                    <p className="text-xs text-zinc-500">{u.email}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-zinc-500 py-8">{t.noData}</p>
              )}
            </div>
          </div>
        </div>
      )}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${theme === 'dark' ? 'bg-[#121212] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings size={20} className="text-blue-400" />
                {t.settings}
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-100'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.profile}</label>
                <div className={`border rounded-2xl p-4 space-y-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {user.name[0]}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-bold truncate">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email || 'Kullanıcı'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${user.email === OWNER_EMAIL ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                          {user.email === OWNER_EMAIL ? 'Kurucu' : 'Member'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t.fullName}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className={`flex-1 bg-transparent border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all ${theme === 'dark' ? 'border-zinc-800 text-white' : 'border-zinc-200 text-zinc-900'}`}
                      />
                      <button 
                        onClick={async () => {
                          if (tempName.trim()) {
                            await profileService.updateProfile(user.uid, { name: tempName.trim() });
                            setUser((prev: any) => ({ ...prev, name: tempName.trim() }));
                            alert("Success!");
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
                      >
                        {t.update}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all border border-zinc-700"
                  >
                    <Heart size={16} className="text-rose-500" />
                    {t.secureProfileSettings}
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{t.language}</label>
                <div className={`border rounded-2xl p-4 grid grid-cols-2 gap-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  {[
                    { id: 'tr', label: 'Türkçe', icon: '🇹🇷' },
                    { id: 'en', label: 'English', icon: '🇺🇸' },
                    { id: 'es', label: 'Español', icon: '🇪🇸' },
                    { id: 'de', label: 'Deutsch', icon: '🇩🇪' },
                    { id: 'fr', label: 'Français', icon: '🇫🇷' },
                    { id: 'it', label: 'Italiano', icon: '🇮🇹' },
                    { id: 'ru', label: 'Русский', icon: '🇷🇺' }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setLanguage(lang.id as Language);
                        localStorage.setItem('chat_cnr_lang', lang.id);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        language === lang.id 
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                          : (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700' : 'bg-white border-zinc-100 text-zinc-600')
                      }`}
                    >
                      <span className="text-xl">{lang.icon}</span>
                      <span className="text-xs font-bold">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>System Diagnostic</label>
                <div className={`border rounded-2xl p-4 space-y-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={async () => {
                        const btn = document.getElementById('test-api-btn');
                        if (btn) btn.innerText = "Checking...";
                        try {
                          const result = await chatCNRService.sendMessage("Hello, system test.", [], undefined, "System", "test@test.com", false, 'user', undefined, language);
                          if (language === 'tr') alert("Bağlantı Başarılı! AI Yanıtı: " + result.text.substring(0, 50) + "...");
                          else alert("Connection Successful! AI Response: " + result.text.substring(0, 50) + "...");
                        } catch (err: any) {
                          if (language === 'tr') alert("Bağlantı Hatası: " + (err.message || "Bilinmeyen hata"));
                          else alert("Connection Error: " + (err.message || "Unknown error"));
                          console.error("API Test Error:", err);
                        } finally {
                          if (btn) btn.innerText = language === 'tr' ? "Bağlantıyı Test Et" : "Test Connection";
                        }
                      }}
                      id="test-api-btn"
                      className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                      {language === 'tr' ? "Bağlantıyı Test Et" : "Test Connection"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Danger Zone</label>
                <div className={`border rounded-2xl p-4 space-y-4 ${theme === 'dark' ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-100'}`}>
                  <p className="text-[10px] text-red-500/70 font-medium leading-relaxed">
                    {language === 'tr' ? 'Bu işlem tüm sohbet geçmişinizi silecek ve API anahtarı kotalarını yerel olarak sıfırlayacaktır.' : 'This will delete all your chat history and reset API project counters locally.'}
                  </p>
                  <button 
                    onClick={async () => {
                      if (window.confirm("RESET SYSTEM?")) {
                        try {
                          // Clear local storage
                          localStorage.removeItem('CHAT_CNR_EXHAUSTED_KEYS');
                          localStorage.removeItem('CHAT_CNR_KEY_INDEX');
                          localStorage.removeItem('CHAT_CNR_LAST_USAGE_DATE');
                          
                          // Delete all sessions from Firestore
                          for (const session of sessions) {
                            await deleteDoc(doc(db, 'users', user.uid, 'sessions', session.id));
                          }
                          
                          window.location.reload();
                        } catch (err) {
                          alert("Error.");
                        }
                      }
                    }}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/20"
                  >
                    {language === 'tr' ? 'Sistemi ve Geçmişi Sıfırla' : 'Reset System'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Hesap</label>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-all font-bold"
                >
                  <LogOut size={18} />
                  Çıkış Yap
                </button>
              </div>

              <div className="space-y-4">
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Tercihler</label>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-4 border rounded-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-3">
                      <Volume2 size={18} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} />
                      <span className="text-sm font-medium">{language === 'tr' ? 'Otomatik Seslendirme' : 'Auto Voice Response'}</span>
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
                      <MessageSquare size={18} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{language === 'tr' ? 'Sohbet Modu' : 'Chat Mode'}</span>
                        <span className="text-[10px] text-zinc-500">{language === 'tr' ? 'Dedikodu yapmak istersen buradayım!' : 'Talk to me like a companion!'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsChatMode(!isChatMode)}
                      className={`w-12 h-6 rounded-full transition-all relative ${isChatMode ? 'bg-blue-600' : (theme === 'dark' ? 'bg-zinc-700' : 'bg-zinc-300')}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isChatMode ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className={`flex items-center justify-between p-4 border rounded-2xl ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}>
                        {theme === 'dark' ? <Settings size={18} /> : <Settings size={18} />}
                      </div>
                      <span className="text-sm font-medium">{t.appearance}</span>
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
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <ProfileModal 
        user={user}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdate={(updated) => setUser(updated)}
        language={language}
      />

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default App;
