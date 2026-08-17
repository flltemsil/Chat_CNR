const fs = require('fs');
let text = fs.readFileSync('App.tsx', 'utf8');

text = text.replace(/if \(!activeSession \|\| !activeSession\.messages\) return;/g, '');

text = text.replace(/const updatedMessages = \[\.\.\.\(activeSession\?\.messages \|\| \[\]\), userMsg\];/g, 
`
    let targetSessionId = activeSessionId;
    let currentSessions = sessions;

    if (!activeSession) {
      targetSessionId = Date.now().toString();
      const newSessionInfo = {
        id: targetSessionId,
        userId: user ? user.uid : "anonymous",
        title: text.trim().substring(0, 30) || "Yeni Sohbet",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      
      const newLocalSession = {
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

    const updatedMessages = [...(activeLocalSession.messages || []), userMsg];`);

text = text.replace(/s\.id === activeSessionId/g, 's.id === (typeof targetSessionId !== "undefined" ? targetSessionId : activeSessionId)');

// Remove disabled={!activeSession} from the code
text = text.replace(/disabled=\{\!activeSession\}/g, '');

// Also fix the Chat_CNR label
text = text.replace(
  /<h1 className="text-5xl font-black text-white tracking-tighter uppercase">\s*Chat_CNR\s*<\/h1>\s*<span className="text-xs font-bold text-blue-400 border border-blue-400\/30 bg-blue-400\/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-\[0_0_15px_rgba\(96,165,250,0\.3\)\]">\s*Turkey's Strongest\s*<\/span>/,
  `<h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Chat_CNR
                </h1>
                <span className="text-[10px] font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                  TURKEY'S STRONGEST
                </span>`
);

text = text.replace('className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tight"', 'className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight"');

// Fix Chat_CNR CORE button
text = text.replace(
  /<button\s+onClick=\{\(\) => \{\s+const newBtn = document\.getElementById\('new-chat-btn'\);\s+if \(newBtn\) newBtn\.click\(\);\s+\}\}\s+className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-\[0_0_40px_rgba\(37,99,235,0\.3\)\] hover:shadow-\[0_0_60px_rgba\(37,99,235,0\.5\)\] active:scale-95 uppercase tracking-widest text-sm"\s+>\s+Sistemi Başlat\s+<\/button>/g,
  `<div className="flex flex-col items-center gap-3">
                        <div className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-xs uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          Sistem Aktif
                        </div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Sohbete başlamak için aşağıya yazın
                        </div>
                      </div>`
);

// Fix disabled={(!input.trim() && !selectedImage) || isLoading} to be safe
text = text.replace(/disabled=\{\(!input\.trim\(\) && !selectedImage\)\}/g, 'disabled={(!input.trim() && !selectedImage) || isLoading}');

fs.writeFileSync('App.tsx', text);
console.log("Done via JS");
