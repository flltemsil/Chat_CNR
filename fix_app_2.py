import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. handleSend replacement
pattern_send = r"  const handleSend = async \([\s\S]*?if \(!activeSession \|\| !activeSession\.messages\) return;\n    if \(!checkLimit\(\"messages\"\)\) return;\n\n    const text = overrideInput \|\| input;\n    if \(!text\.trim\(\) && !selectedImage\) return;\n\n    lastSentMessageRef\.current = text;\n    const userMsg: Message = \{\n      id: Date\.now\(\)\.toString\(\),\n      role: \"user\",\n      text: text\.trim\(\),\n      imageUrl: selectedImage \|\| undefined,\n      timestamp: new Date\(\),\n    \};\n\n    const updatedMessages = \[\.\.\.\(activeSession\?\.messages \|\| \[\]\), userMsg\];\n\n    setSessions\(\(prev\) =>\n      prev\.map\(\(s\) =>\n        s\.id === activeSessionId\n          \? \{\n              \.\.\.s,"

repl_send = """  const handleSend = async (
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
        setDoc(doc(db, "sessions", targetSessionId), newSessionInfo);
      } catch (err) {}
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

text = re.sub(pattern_send, repl_send, text)

# 2. Fix the login screen header
# Look for <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
pattern_login = r"<h1 className=\"text-5xl font-black text-white tracking-tighter uppercase\">\s*Chat_CNR\s*<\/h1>\s*<span className=\"text-xs font-bold text-blue-400 border border-blue-400\/30 bg-blue-400\/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-\[0_0_15px_rgba\(96,165,250,0\.3\)\]\">\s*Turkey's Strongest\s*<\/span>"

repl_login = """<h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Chat_CNR
                </h1>
                <span className="text-[10px] font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                  TURKEY'S STRONGEST
                </span>"""

text = re.sub(pattern_login, repl_login, text)

# Also fix the subtitle: <h2 className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight">
text = text.replace('className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight"', 'className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"')

# 3. Fix Chat_CNR CORE button
pattern_btn = r"<button\s+onClick=\{\(\) => \{\s+const newBtn = document\.getElementById\('new-chat-btn'\);\s+if \(newBtn\) newBtn\.click\(\);\s+\}\}\s+className=\"px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-\[0_0_40px_rgba\(37,99,235,0\.3\)\] hover:shadow-\[0_0_60px_rgba\(37,99,235,0\.5\)\] active:scale-95 uppercase tracking-widest text-sm\"\s+>\s+Sistemi Başlat\s+<\/button>"

repl_btn = """<div className="flex flex-col items-center gap-3">
                        <div className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-xs uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          Sistem Aktif
                        </div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Sohbete başlamak için aşağıya yazın
                        </div>
                      </div>"""
text = re.sub(pattern_btn, repl_btn, text)

# 4. Remove disabled={!activeSession} EVERYWHERE!
# Note: we need to handle disabled={!input.trim() && !selectedImage}
text = text.replace("disabled={(!input.trim() && !selectedImage) || isLoading}", "DISABLED_TEMP")
text = text.replace("disabled={!activeSession}", "")
text = text.replace("DISABLED_TEMP", "disabled={(!input.trim() && !selectedImage) || isLoading}")

with open("App.tsx", "w") as f:
    f.write(text)

print("Done")
