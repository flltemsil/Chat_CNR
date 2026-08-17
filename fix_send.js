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

text = text.replace(/s\.id === activeSessionId/g, 's.id === targetSessionId');

fs.writeFileSync('App.tsx', text);
console.log("Done via JS");
