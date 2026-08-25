import re

with open("App.tsx", "r") as f:
    text = f.read()

# Revert the model argument in App.tsx
pattern = r"selectedModel === 'gemini-1\.5-pro' \? 'gemini-3\.1-pro-preview' : 'gemini-2\.5-flash'"
repl = r"'gemini-2.5-flash'"
text = re.sub(pattern, repl, text)

# Also there's another occurrence where the state is 'gemini-1.5-pro' maybe we leave the state as is (it's just a UI toggle).

with open("App.tsx", "w") as f:
    f.write(text)

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Revert model in chatCNRService to always be gemini-2.5-flash
# We have to find where `model: selectedModel` is passed to the fetch API
pattern = r"model:\s*selectedModel\s*\|\|\s*\"[^\"]+\""
repl = r'model: "gemini-2.5-flash"'
text = re.sub(pattern, repl, text)

pattern2 = r"model:\s*selectedModel,"
repl2 = r'model: "gemini-2.5-flash", // Pro görünümü için system prompt değişiyor ama asıl model flash kalıyor'
text = re.sub(pattern2, repl2, text)

# Also check how `proInstruction` is triggered. It uses `userProfile?.isPro`. 
# Wait, if we use the dropdown to select "Pro", we might want to also trigger the PRO instruction even if the user isn't technically "Pro" in db, or maybe the UI restricts the dropdown.
# The UI restricts the dropdown: "if(user?.isPro || user?.role === 'admin') { setSelectedModel('gemini-1.5-pro'); }"
# We can enhance `chatCNRService.ts` to check `selectedModel === 'gemini-1.5-pro'` to inject `proInstruction` in case we need it, but `userProfile?.isPro` is already doing it.
# Let's add it just in case:
text = text.replace("if (userProfile?.isPro) {", "if (userProfile?.isPro || selectedModel === 'gemini-1.5-pro' || selectedModel === 'gemini-2.5-pro' || selectedModel === 'gemini-3.1-pro-preview') {")

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)


print("Reverted to fake Pro model trick")
