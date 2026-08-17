import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Remove Monitor Button
monitor_btn_pattern = r"\{activeSession && \(\s*<button\s+onClick=\{\(\) => setActiveSessionId\(null\)\}\s+className=\{`p-2 rounded-lg transition-all border [^`]+`\}\s+title=\"Ana Ekran \/ Arka Plana At\"\s*>\s*<Monitor size=\{16\} \/>\s*<\/button>\s*\)\}"
text = re.sub(monitor_btn_pattern, "", text)

# 2. We need to merge the logic.
# The structure is:
# {activeSession ? (
#   <>
#     {activeSession.messages && activeSession.messages.length === 0 && ( ...Baglanti Kuruldu... )}
#     <div className="space-y-2">...</div>
#     {streamingMessage && ...}
#   </>
# ) : (
#   <motion.div>... Chat_CNR CORE ...</motion.div>
# )}

# Let's extract the Chat_CNR CORE div, put it in the condition `(!activeSession || activeSession.messages.length === 0) && ( ... )`
# And just render the messages directly.

# First, find the "Chat_CNR CORE" div (it starts with `<motion.div \n                  initial={{ opacity: 0 }}\n                  animate={{ opacity: 1 }}\n                  className="min-h-[70vh]`)
# Actually, I can just replace everything from `{activeSession ? (` down to the end of the `) : (` block.

