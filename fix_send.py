with open("App.tsx", "r") as f:
    text = f.read()

target = """  const handleSend = async (
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

replacement = """  const handleSend = async (
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

if target in text:
    text = text.replace(target, replacement)
    print("SUCCESS")
else:
    print("FAILED")

with open("App.tsx", "w") as f:
    f.write(text)
