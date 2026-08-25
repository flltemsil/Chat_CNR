import re

# 1. Fix App.tsx
with open("App.tsx", "r") as f:
    text = f.read()

# Fix currentImage to selectedImage
text = text.replace('currentImage,', 'selectedImage,', 1)

# Fix createSession
# The button for notebook:
pattern_nb = r'await chatCNRService\.createSession\(user\.uid,\s*"📓 Not Defteri"\);[\s\S]*?if \(window.innerWidth < 1024\) setIsSidebarOpen\(false\);'
repl_nb = """// Create a mock new session for notebook
                  const newId = Date.now().toString();
                  const newSession = {
                    id: newId,
                    userId: user.uid,
                    title: "📓 Not Defteri",
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  setSessions([newSession, ...sessions]);
                  setActiveSessionId(newId);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);"""
text = re.sub(pattern_nb, repl_nb, text)

# There's also `currentImage` in the first replace maybe? I should use regex to be safe
text = re.sub(r'chatCNRService\.sendMessageStream\(\s*prompt,\s*activeSession\?\.messages \|\| \[\],\s*currentImage,', r'chatCNRService.sendMessageStream(\n        prompt,\n        activeSession?.messages || [],\n        selectedImage,', text)


with open("App.tsx", "w") as f:
    f.write(text)

# 2. Fix chatCNRService.ts
with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Make sure selectedModel is passed correctly to fetch in sendMessageStream and sendMessage
# Wait, I might have messed up the parameters when replacing. Let's completely rewrite the headers of sendMessageStream and sendMessage.
import sys

# We'll just replace `model: selectedModel,` with `model: selectedModel || "gemini-2.5-flash",` 
# Actually the error is `Cannot find name 'selectedModel'` at line 132 which means it is out of scope. 
# Oh! Because `sendMessageStream` delegates to `this.sendMessage` if not streaming, or uses `fetch` internally? 
# Wait, let's see how `chatCNRService.ts` handles the fetch.
