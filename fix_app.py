import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Fix handleSend to create session if none
target_send = """  const handleSend = async (
    e?: React.FormEvent | null,
    overrideInput?: string,
  ) => {
    if (e) e.preventDefault();
    if (!activeSession || !activeSession.messages) return;
    if (!checkLimit("messages")) return;

    const text = overrideInput || input;
    if (!text.trim() && !selectedImage) return;

    lastSentMessageRef.current = text;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
      imageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const updatedMessages = [...(activeSession?.messages || []), userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,"""

replacement_send = """  const handleSend = async (
    e?: React.FormEvent | null,
    overrideInput?: string,
  ) => {
    if (e) e.preventDefault();
    if (!checkLimit("messages")) return;

    const textToSend = overrideInput || input;
    if (!textToSend.trim() && !selectedImage) return;

    let targetSessionId = activeSessionId;
    let currentSessions = sessions;

    if (!activeSession) {
      // Auto-create session
      targetSessionId = Date.now().toString();
      const newSessionInfo = {
        id: targetSessionId,
        userId: user!.uid,
        title: textToSend.trim().substring(0, 30) || "Yeni Sohbet",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const newLocalSession: ChatSession = {
        id: targetSessionId,
        title: newSessionInfo.title,
        updatedAt: new Date(),
        messages: [],
      };
      
      currentSessions = [newLocalSession, ...sessions];
      setSessions(currentSessions);
      setActiveSessionId(targetSessionId);
      
      try {
        await setDoc(doc(db, "sessions", targetSessionId), newSessionInfo);
      } catch (err) {
        console.error("Failed to create session in firestore", err);
      }
    }

    const activeLocalSession = currentSessions.find((s) => s.id === targetSessionId);
    if (!activeLocalSession) return;

    lastSentMessageRef.current = textToSend;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend.trim(),
      imageUrl: selectedImage || undefined,
      timestamp: new Date(),
    };

    const updatedMessages = [...(activeLocalSession.messages || []), userMsg];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? {
              ...s,"""

if target_send in text:
    text = text.replace(target_send, replacement_send)
else:
    print("WARNING: target_send not found!")

# 2. Fix disabled={!activeSession} in the footer
text = text.replace("disabled={!activeSession}", "")
text = text.replace("disabled={!input.trim() && !selectedImage}", "disabled={(!input.trim() && !selectedImage) || isLoading}")

# 3. Fix Login Screen Proportions
target_login = """              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                  Chat_CNR
                </h1>
                <span className="text-xs font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                  Turkey's Strongest
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">"""

replacement_login = """              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Chat_CNR
                </h1>
                <span className="text-[10px] font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                  TURKEY'S STRONGEST
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">"""

if target_login in text:
    text = text.replace(target_login, replacement_login)
else:
    print("WARNING: target_login not found!")

# 4. Fix Chat_CNR CORE Screen Proportions
target_core = """                    <div className="relative z-10 flex flex-col items-center text-center">
                      <motion.div 
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(37,99,235,0.4)]"
                      >
                        <Brain size={44} className="text-white" />
                      </motion.div>
                      
                      <h2 className={`text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r ${theme === "dark" ? "from-white to-zinc-500" : "from-zinc-900 to-zinc-500"}`}>
                        Chat_CNR CORE
                      </h2>
                      <p className={`text-lg md:text-xl max-w-2xl font-medium tracking-tight mb-12 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        TÜRKİYE'NİN EN GÜÇLÜ YAPAY ZEKASI
                      </p>"""

replacement_core = """                    <div className="relative z-10 flex flex-col items-center text-center">
                      <motion.div 
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(37,99,235,0.4)]"
                      >
                        <Brain size={36} className="text-white" />
                      </motion.div>
                      
                      <h2 className={`text-3xl md:text-4xl font-black mb-3 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r ${theme === "dark" ? "from-white to-zinc-500" : "from-zinc-900 to-zinc-500"}`}>
                        Chat_CNR CORE
                      </h2>
                      <p className={`text-sm md:text-base max-w-xl font-medium tracking-wide mb-10 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        TÜRKİYE'NİN EN GÜÇLÜ YAPAY ZEKASI
                      </p>"""

if target_core in text:
    text = text.replace(target_core, replacement_core)
else:
    print("WARNING: target_core not found!")

# 5. Fix Chat_CNR CORE buttons (Sistemi Başlat)
target_core_btn = """                      <div className="mt-12">
                        <button 
                          onClick={() => {
                            const newBtn = document.getElementById('new-chat-btn');
                            if (newBtn) newBtn.click();
                          }}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:shadow-[0_0_60px_rgba(37,99,235,0.5)] active:scale-95 uppercase tracking-widest text-sm"
                        >
                          Sistemi Başlat
                        </button>
                      </div>"""

replacement_core_btn = """                      <div className="mt-8 flex items-center gap-3">
                        <div className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-xs uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          Sistem Aktif
                        </div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Sohbete başlamak için aşağıya yazın
                        </div>
                      </div>"""

if target_core_btn in text:
    text = text.replace(target_core_btn, replacement_core_btn)
else:
    print("WARNING: target_core_btn not found!")

with open("App.tsx", "w") as f:
    f.write(text)

print("Done")
