import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

pattern = r"\[DİL VE İLETİŞİM KURALI\].*?karşılık ver\.`;"
repl = r"""[LANGUAGE AND COMMUNICATION RULE]
CRITICAL INSTRUCTION: You MUST detect the language of the user's input and reply in EXACTLY that same language. 
- If the user types in English (e.g. "Hello", "How are you"), you MUST respond entirely in English.
- If the user types in German (e.g. "Hallo", "Wie gehts"), you MUST respond entirely in German.
- If the user types in Turkish, respond in Turkish.
Do NOT default to Turkish just because this system prompt is in Turkish. Your response language MUST MATCH the user's language 1:1.`;"""

text_new = re.sub(pattern, repl, text, flags=re.DOTALL)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Language optimization fixed again")
