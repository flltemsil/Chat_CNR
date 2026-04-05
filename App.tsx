
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { chatCNRService } from './services/chatCNRService';
import { Message, ChatSession, ThemeColor, AppearanceMode } from './types';
import MessageItem from './components/MessageItem';
import { Menu, Plus, Trash2, X, MessageSquare, Settings, Mic, MicOff, Volume2, VolumeX, Camera, Send, User, LogOut, Shield, Users, Image as ImageIcon, Sparkles, Key, Check } from 'lucide-react';
import { 
  auth, db, signInWithGoogle, logout, onAuthStateChanged, 
  collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, 
  Timestamp, addDoc, deleteDoc, getDocs, FirebaseUser,
  increment, serverTimestamp 
} from './firebase';
import firebaseConfig from './firebase-applet-config.json';

const OWNER_EMAIL = "dorukaliarslan20@gmail.com";
const INTEGRITY_TOKEN = "AUTHORIZED_BY_DORUK_ALI_ARSLAN_2026";
const MASTER_KEY = "CNR_2026_SECURE";
const STORAGE_KEY = 'chat_cnr_sessions_v2';
const USER_KEY = 'chat_cnr_user_v2';

const LIMITS = {
  FREE: { MESSAGES: 250, IMAGES: 2 },
  PRO: { MESSAGES: 250, IMAGES: 10 }
};

const INITIAL_MESSAGE = (id: string, userName?: string): Message => ({
  id,
  role: 'model',
  text: `Merhaba${userName ? ' ' + userName : ''}, ben Chat_CNR. Bilgi merkezinize hoş geldiniz. Size nasıl yardımcı olabilirim?`,
  timestamp: new Date(),
});

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
  
  const isSystemCompromised = false; 
  
  // Reporting logic
  useEffect(() => {
    console.log("SecurityGuard: System status check", { isSystemCompromised, isOwner });
    if (isSystemCompromised && !isOwner && !hasReported && user) {
      // Only attempt fetch if we are on a web server (not file://)
      if (window.location.protocol.startsWith('http')) {
        fetch('/api/security/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: user,
            reason: "System Integrity Compromised (Tamper Detected)",
            timestamp: new Date().toISOString()
          })
        })
        .then(res => {
          if (res.ok) setHasReported(true);
        })
        .catch(err => console.warn("Security report could not be sent (Server might be offline)", err));
      } else {
        console.warn("Security report skipped: Running in local file mode (Electron/PWA)");
      }
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
  console.log("App component: Initializing");
  const [error, setError] = useState<any>(null);
  const [user, setUser] = useState<{ name: string; email: string; uid: string; role: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  useEffect(() => {
    console.log("App: Auth loading state", isAuthLoading);
    console.log("App: Firebase Config Check", {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      hasApiKey: !!firebaseConfig.apiKey
    });
    
    // Check for missing API Key in production
    const apiKey = process.env.CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || '';
    console.log("App: API Key Presence Check", { hasApiKey: !!apiKey });
  }, [isAuthLoading, user]);
  const isAuthLoadingRef = useRef(true);

  const setAuthLoading = (val: boolean) => {
    setIsAuthLoading(val);
    isAuthLoadingRef.current = val;
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
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              name: userData.name,
              email: firebaseUser.email || '',
              role: userData.role
            });
          } else {
            const role = firebaseUser.email === OWNER_EMAIL ? 'admin' : 'user';
            const newUser = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Kullanıcı',
              email: firebaseUser.email || '',
              role: role,
              lastLogin: Timestamp.now()
            };
            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }
            setUser({
              uid: newUser.uid,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role
            });
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-['Inter']">
        <div className="w-full max-w-md bg-[#121212] border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3">
              <MessageSquare size={40} className="text-white -rotate-3" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">Chat_CNR</h1>
          <p className="text-zinc-400 text-center mb-8 text-sm">Devam etmek için giriş yapın</p>
          
          <button 
            onClick={async (e) => {
              e.preventDefault();
              try {
                await signInWithGoogle();
              } catch (err) {
                console.error("Login error:", err);
                alert("Giriş yapılamadı.");
              }
            }}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google ile Giriş Yap
          </button>
        </div>
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
  user: { name: string; email: string; uid: string; role: string };
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

const ChatApp: React.FC<ChatAppProps> = ({ user, setUser }) => {
  console.log("ChatApp: Initializing for user", user?.email);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
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
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempName, setTempName] = useState(user.name);
  const [allUsers, setAllUsers] = useState<{email: string, name: string}[]>([]);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'standard' | 'pro'>(() => {
    try {
      return (localStorage.getItem('chat_cnr_model') as 'standard' | 'pro') || 'pro';
    } catch (e) {
      return 'pro';
    }
  });
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('chat_cnr_model', selectedModel);
    } catch (e) {}
  }, [selectedModel]);

  // Stripe Payment Success Handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    const sessionId = urlParams.get('session_id');

    if (paymentSuccess === 'true' && sessionId && user) {
      const verifyPayment = async () => {
        try {
          const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
          const data = await response.json();
          
          if (data.status === 'success') {
            // Update user role in Firestore
            try {
              await setDoc(doc(db, 'users', user.uid), {
                role: 'pro'
              }, { merge: true });
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
            }
            
            // Update local state
            setUser((prev: any) => prev ? { ...prev, role: 'pro' } : null);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            alert("Tebrikler! Hesabınız başarıyla Pro sürümüne yükseltildi.");
          }
        } catch (err) {
          console.error("Payment verification failed:", err);
        }
      };
      verifyPayment();
    }
  }, [user, setUser]);

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
    const role = user?.role === 'pro' ? 'PRO' : 'FREE';
    const limit = type === 'messages' ? LIMITS[role].MESSAGES : LIMITS[role].IMAGES;
    const current = type === 'messages' ? dailyUsage.messages : dailyUsage.images;
    
    if (current >= limit) {
      alert(`Günlük ${type === 'messages' ? 'mesaj' : 'görsel'} sınırınıza ulaştınız (${limit}). ${user?.role !== 'pro' ? "Daha fazla hak için Pro'ya geçebilirsiniz." : ""}`);
      if (user?.role !== 'pro') setIsPricingModalOpen(true);
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
    
    const initialMsg = INITIAL_MESSAGE(newId + '-1', user.name);
    try {
      await setDoc(doc(db, 'users', user.uid, 'sessions', newId, 'messages', initialMsg.id), {
        ...initialMsg,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${newId}/messages/${initialMsg.id}`);
    }

    setActiveSessionId(newId);
    setIsSidebarOpen(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Login error:", err);
      alert("Giriş yapılamadı.");
    }
  };

  const handleLogout = async () => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      await logout();
    }
  };

  const handleUpgrade = async (priceId: string) => {
    if (!user) return;
    
    // Check if Stripe is configured
    const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!stripeKey || stripeKey === 'undefined') {
      alert("Hata: Ödeme sistemi (Stripe) henüz yapılandırılmamış. Lütfen Vercel üzerinden anahtarları ekleyin.");
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          priceId: priceId
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Ödeme oturumu oluşturulamadı.");
      }
    } catch (err: any) {
      console.error("Upgrade Error:", err);
      alert(`Hata: ${err.message}`);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    setIsPaymentProcessing(true);
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Portal oturumu oluşturulamadı.");
      }
    } catch (err: any) {
      console.error("Portal Error:", err);
      alert(`Hata: ${err.message}`);
    } finally {
      setIsPaymentProcessing(false);
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

  const handleGenerateImage = async () => {
    if (!input.trim() || !activeSession || !activeSession.messages) return;
    if (!checkLimit('images')) return;
    
    const prompt = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: `Görsel oluştur: ${prompt}`,
      timestamp: new Date(),
    };

    const updatedMessages = [...(activeSession.messages || []), userMsg];
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: updatedMessages, updatedAt: new Date() } : s
    ));

    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const modelMsgId = (Date.now() + 1).toString();
      
      // Add user message to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', userMsg.id), cleanForFirestore({
          ...userMsg,
          timestamp: Timestamp.now()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${activeSessionId}/messages/${userMsg.id}`);
      }

      const imageUrl = await chatCNRService.generateImage(prompt);
      await incrementUsage('images');
      
      const modelMsg: Message = {
        id: modelMsgId,
        role: 'model',
        text: `"${prompt}" için oluşturduğum görsel:`,
        imageUrl: imageUrl,
        timestamp: new Date(),
      };

      // Add model message to Firestore
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', modelMsgId), cleanForFirestore({
          ...modelMsg,
          timestamp: Timestamp.now()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${activeSessionId}/messages/${modelMsgId}`);
      }

      if (isAutoSpeak) {
        const audioBase64 = await chatCNRService.textToSpeech(modelMsg.text);
        if (audioBase64) playPCM(audioBase64);
      }
    } catch (err: any) {
      console.error("Image Gen Error:", err);
      setError("Görsel oluşturulurken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e?: React.FormEvent | null, overrideInput?: string) => {
    if (e) e.preventDefault();
    if (!activeSession || !activeSession.messages) return;
    if (!checkLimit('messages')) return;
    const text = overrideInput || input;
    if (!text.trim() && !selectedImage) return;

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

      // Add empty model message to Firestore (placeholder)
      try {
        await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', modelMsgId), cleanForFirestore({
          ...initialModelMsg,
          timestamp: Timestamp.now()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/sessions/${activeSessionId}/messages/${modelMsgId}`);
      }

      let finalResponseText = "";
      const stream = chatCNRService.sendMessageStream(
        userMsg.text,
        activeSession?.messages || [],
        userMsg.imageUrl,
        user.name,
        user.email,
        isChatMode,
        selectedModel === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3.1-flash-lite-preview'
      );

      let isFirstChunk = true;
      for await (const chunk of stream) {
        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
        }
        finalResponseText = chunk.text;
        
        // Update model message in Firestore
        try {
          await setDoc(doc(db, 'users', user.uid, 'sessions', activeSessionId!, 'messages', modelMsgId), {
            text: chunk.text,
            sources: chunk.sources || []
          }, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}/sessions/${activeSessionId}/messages/${modelMsgId}`);
        }
      }

      if (isAutoSpeak) {
        const audioBase64 = await chatCNRService.textToSpeech(finalResponseText);
        if (audioBase64) {
          playPCM(audioBase64);
        }
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Bilinmeyen hata';
      
      // Try to parse JSON error if it exists
      try {
        if (errorMessage.includes('{')) {
          const jsonStr = errorMessage.substring(errorMessage.indexOf('{'));
          const parsed = JSON.parse(jsonStr);
          if (parsed.error?.message) errorMessage = parsed.error.message;
        }
      } catch (e) {}

      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        const { totalKeys, sourceVar, maskedKeys } = chatCNRService.getDebugInfo(selectedModel === 'pro');
        const keysHint = maskedKeys.length > 0 ? ` [${maskedKeys.join(', ')}]` : '';
        setError(`Günlük kullanım kotanız tamamen doldu (${totalKeys} anahtar denendi${keysHint}, Kaynak: ${sourceVar}). Lütfen AI Studio Build panelindeki Settings kısmından veya Vercel Dashboard'dan API anahtarlarınızı kontrol edin.`);
      } else if (errorMessage === "API_KEY_MISSING") {
        setError("API Anahtarı bulunamadı. Lütfen AI Studio Build panelindeki Settings kısmından CHAT_CNR_API_KEY veya CHAT_CNR_PRO_API_KEY değişkenini tanımlayın.");
      } else {
        console.error("Chat Error:", err);
        setError(`Yanıt alınırken bir sorun oluştu: ${errorMessage}. Lütfen bağlantınızı kontrol edip tekrar deneyin.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            {sessions.filter(s => s && s.id).map(session => (
              <div 
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`group relative flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${
                  activeSessionId === session.id 
                    ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20')
                    : (theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600')
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${activeSessionId === session.id ? 'bg-white/20' : (theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-200')}`}>
                  <MessageSquare size={16} />
                </div>
                <span className="flex-1 text-sm font-bold truncate pr-8">{session.title}</span>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingSessionId(session.id);
                  }}
                  className={`absolute right-2 p-2 rounded-lg transition-all ${
                    activeSessionId === session.id 
                      ? 'hover:bg-white/20 text-white' 
                      : (theme === 'dark' ? 'hover:bg-red-500/20 text-zinc-500 hover:text-red-500' : 'hover:bg-red-50 text-zinc-400 hover:text-red-500')
                  }`}
                  title="Sohbeti Sil"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Model Selection Quick Access */}
          <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Model Seçimi</p>
            <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <button 
                onClick={() => setSelectedModel('standard')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedModel === 'standard' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : (theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                }`}
              >
                Standart
              </button>
              <button 
                onClick={() => setSelectedModel('pro')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedModel === 'pro' 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : (theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                }`}
              >
                <Sparkles size={10} />
                Pro
              </button>
            </div>
          </div>

          <div className={`p-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'}`}>
            {user.role !== 'pro' && user.role !== 'admin' && (
              <button 
                onClick={() => setIsPricingModalOpen(true)}
                className="w-full mb-4 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98]"
              >
                <Sparkles size={18} />
                <span>Pro'ya Yükselt</span>
              </button>
            )}
            <div className={`flex items-center gap-3 p-3 rounded-2xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-zinc-800 text-blue-400' : 'bg-white text-blue-600 border border-zinc-200'}`}>
                <User size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <div className="flex items-center gap-1">
                  <p className={`text-[10px] truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email || 'Kullanıcı'}</p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                    user.email === OWNER_EMAIL 
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
                      : user.role === 'pro'
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {user.email === OWNER_EMAIL ? 'Kurucu' : user.role === 'pro' ? 'Pro' : 'Üye'}
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
        <h1 className="font-bold text-sm truncate max-w-[150px] md:max-w-none">
          {activeSession?.title || (sessions.length > 0 ? 'Yükleniyor...' : 'Yeni Sohbet')}
        </h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className={`text-[10px] uppercase tracking-widest font-bold ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Çevrimiçi</span>
                  <span className="mx-2 text-zinc-700">•</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${selectedModel === 'pro' ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {selectedModel === 'pro' ? 'Chat_CNR Pro' : 'Chat_CNR Standart'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {user.email === OWNER_EMAIL && (
              <button 
                onClick={() => setIsAdminPanelOpen(true)}
                className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                title="Kullanıcı Listesi"
              >
                <Users size={18} />
              </button>
            )}
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
        {activeSession && activeSession.messages ? (
          activeSession.messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} themeColor="blue" appearance={theme} />
          ))
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-3xl flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-zinc-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Henüz bir sohbet seçilmedi</h3>
              <p className="text-zinc-500 max-w-xs">Yeni bir sohbet başlatmak için sol menüdeki butona tıklayın.</p>
            </div>
          )}
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
                disabled={!activeSession}
                onClick={() => fileInputRef.current?.click()}
                className={`p-3 rounded-xl transition-all disabled:opacity-30 ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
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
              <button 
                type="button"
                disabled={!activeSession || !input.trim() || isLoading}
                onClick={handleGenerateImage}
                className={`p-3 rounded-xl transition-all disabled:opacity-30 ${theme === 'dark' ? 'text-amber-400 hover:text-amber-300 hover:bg-zinc-800' : 'text-amber-600 hover:text-amber-700 hover:bg-zinc-200'}`}
                title="Görsel Oluştur"
              >
                <Sparkles size={20} />
              </button>
              <textarea 
                value={input}
                disabled={!activeSession}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeSession ? "Mesajınızı yazın..." : "Önce bir sohbet başlatın"}
                rows={1}
                className={`flex-1 bg-transparent border-none focus:ring-0 py-3 px-1 resize-none max-h-32 custom-scrollbar text-sm disabled:opacity-50 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && activeSession) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                type="button"
                disabled={!activeSession}
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all disabled:opacity-30 ${isRecording ? 'bg-red-500 text-white animate-pulse' : (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')}`}
              >
                {isRecording ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
            </div>
            <button 
              type="submit"
              disabled={isLoading || !activeSession || (!input.trim() && !selectedImage)}
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

      {/* Pricing Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPricingModalOpen(false)} />
          <div className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border animate-in zoom-in duration-300 ${theme === 'dark' ? 'bg-[#121212] border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-900/20">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-black mb-2">Chat_CNR Pro</h2>
              <p className="text-zinc-500 mb-8">Yapay zeka deneyiminizi bir üst seviyeye taşıyın.</p>
              
              <div className="grid md:grid-cols-2 gap-6 text-left">
                {/* Free Plan */}
                <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <h3 className="font-bold text-lg mb-1">Ücretsiz</h3>
                  <p className="text-3xl font-black mb-4">0₺ <span className="text-sm font-normal text-zinc-500">/ay</span></p>
                  <ul className="space-y-3 text-sm text-zinc-400">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Standart Chat_CNR Modeli</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Günlük 250 Mesaj</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> Günlük 2 Görsel Oluşturma</li>
                  </ul>
                  <button disabled className="w-full mt-8 py-3 rounded-xl bg-zinc-800 text-zinc-500 font-bold cursor-not-allowed">Mevcut Plan</button>
                </div>

                {/* Pro Plan */}
                <div className={`p-6 rounded-3xl border-2 border-amber-500 relative ${theme === 'dark' ? 'bg-amber-500/5' : 'bg-amber-50'}`}>
                  <div className="absolute -top-3 right-6 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Önerilen</div>
                  <h3 className="font-bold text-lg mb-1">Pro</h3>
                  <p className="text-3xl font-black mb-4">300₺ <span className="text-sm font-normal text-zinc-500">/ay</span></p>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> <span className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>Chat_CNR 3.1 Pro Erişimi</span></li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> <span className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>Günlük 250 Soru Sorma</span></li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> <span className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>Günlük 10 Görsel Oluşturma</span></li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> <span className={theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}>Öncelikli Destek</span></li>
                  </ul>
                  {user.role === 'pro' ? (
                    <button 
                      onClick={handleManageSubscription}
                      disabled={isPaymentProcessing}
                      className="w-full mt-8 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isPaymentProcessing ? 'İşleniyor...' : 'Aboneliği Yönet'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleUpgrade('price_1Q...your_actual_price_id')}
                      disabled={isPaymentProcessing}
                      className="w-full mt-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {isPaymentProcessing ? 'İşleniyor...' : 'Hemen Yükselt'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={24} />
            </button>
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
                <p className="text-center text-zinc-500 py-8">Kullanıcı bulunamadı.</p>
              )}
            </div>
          </div>
        </div>
      )}
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
                      <div className="flex items-center gap-2">
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{user.email || 'Kullanıcı'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${user.email === OWNER_EMAIL ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                          {user.email === OWNER_EMAIL ? 'Kurucu' : 'Üye'}
                        </span>
                      </div>
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
                        onClick={async () => {
                          if (tempName.trim()) {
                            await setDoc(doc(db, 'users', user.uid), { name: tempName.trim() }, { merge: true });
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
                <label className={`block text-xs font-bold uppercase tracking-widest ml-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Model Ayarları</label>
                <div className={`border rounded-2xl p-4 space-y-4 ${theme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Yapay Zeka Modeli</p>
                      <p className="text-[10px] text-zinc-500">Kullanılacak Chat_CNR sürümünü seçin</p>
                    </div>
                    <div className={`flex p-1 rounded-xl ${theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
                      <button 
                        onClick={() => setSelectedModel('standard')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedModel === 'standard' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500'}`}
                      >
                        Standart
                      </button>
                      <button 
                        onClick={() => setSelectedModel('pro')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedModel === 'pro' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500'}`}
                      >
                        Pro
                      </button>
                    </div>
                  </div>
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
                      <MessageSquare size={18} className={theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Sohbet Modu</span>
                        <span className="text-[10px] text-zinc-500">ChatGPT gibi samimi sohbet eder</span>
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
