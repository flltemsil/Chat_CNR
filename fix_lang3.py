import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

pattern = r"İsmini her mesajda tekrarlamaktan kaçın\.`;"
repl = r"""İsmini her mesajda tekrarlamaktan kaçın.

[CRITICAL - STRICT LANGUAGE ADAPTATION]
Regardless of all the system instructions being written in Turkish, YOUR FINAL OUTPUT LANGUAGE MUST EXACTLY MATCH THE USER'S INPUT LANGUAGE.
- If the user writes in English, your ENTIRE response MUST be in English.
- If the user writes in German (e.g. "Hallo", "Wie gehts"), your ENTIRE response MUST be in German (e.g. "Hallo! Wie kann ich Ihnen helfen?").
- DO NOT say "Evet Almanca konuşabiliyorum" in Turkish if they ask in German. Answer them in German!
- DO NOT mix languages. Match the user's language 100%.`;"""

text_new = re.sub(pattern, repl, text)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Language priority forced at the very end of system instruction")
