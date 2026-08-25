import re

# 1. Fix App.tsx
with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace("gemini-2.5-pro", "gemini-3.1-pro-preview")
text = text.replace("gemini-2.5-flash", "gemini-2.5-flash") # Keep flash as is if it's not complaining, or update to gemini-2.5-flash? Wait, the error is specifically for gemini-2.5-pro. Let's just fix what's broken.

with open("App.tsx", "w") as f:
    f.write(text)

# 2. Fix chatCNRService.ts
with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

text = text.replace("gemini-2.5-pro", "gemini-3.1-pro-preview")

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)

# 3. Fix api/index.ts
with open("api/index.ts", "r") as f:
    text = f.read()

text = text.replace("gemini-2.5-pro", "gemini-3.1-pro-preview")

with open("api/index.ts", "w") as f:
    f.write(text)

print("Updated models to gemini-3.1-pro-preview")
