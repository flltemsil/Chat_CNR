import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Fix sendMessageStream
text = re.sub(
    r'isDeepMode:\s*boolean\s*=\s*false\s*\):\s*AsyncGenerator<', 
    r'isDeepMode: boolean = false,\n    selectedModel: string = "gemini-2.5-flash"\n  ): AsyncGenerator<', 
    text
)

# Fix sendMessage
text = re.sub(
    r'isDeepMode:\s*boolean\s*=\s*false\s*\):\s*Promise<any>\s*\{', 
    r'isDeepMode: boolean = false,\n    selectedModel: string = "gemini-2.5-flash"\n  ): Promise<any> {', 
    text
)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)

print("Fixed service params")
