import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Update sendMessageStream signature
pattern1 = r'isDeepMode:\s*boolean\s*=\s*false\s*\)\s*\{'
repl1 = r"isDeepMode: boolean = false,\n    selectedModel: string = 'gemini-2.5-flash'\n  ) {"
text = re.sub(pattern1, repl1, text)

# Update the fetch payload in sendMessageStream
pattern2 = r'model:\s*"gemini-2\.5-flash",\s*\/\/\s*We use the same model but with a much smarter system prompt for PRO'
repl2 = r'model: selectedModel,'
text = re.sub(pattern2, repl2, text)

# Update sendMessage signature
pattern3 = r'isDeepMode:\s*boolean\s*=\s*false\s*\)\s*:\s*Promise<any>\s*\{'
repl3 = r"isDeepMode: boolean = false,\n    selectedModel: string = 'gemini-2.5-flash'\n  ): Promise<any> {"
text = re.sub(pattern3, repl3, text)

# Update the fetch payload in sendMessage
pattern4 = r'model:\s*"gemini-2\.5-flash",\s*\/\/\s*We use the same model but with a much smarter system prompt for PRO'
repl4 = r'model: selectedModel,'
text = re.sub(pattern4, repl4, text)

# Fix where sendMessage calls sendMessageStream (if it does) or vice versa. 
# Wait, sendMessage is separate? No, wait, sendMessage might call sendMessageStream, or they are separate. Let's see if sendMessage has the fetch call.
text = text.replace('model: "gemini-2.5-flash", // We use the same model', 'model: selectedModel, // Model from params')
text = text.replace('model: "gemini-2.5-flash"', 'model: selectedModel')

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)

print("Service updated")
