import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Add a massive language rule right at the beginning of SYSTEM_INSTRUCTION
pattern_start = r"const SYSTEM_INSTRUCTION = `Adın Chat_CNR\."
repl_start = r"""const SYSTEM_INSTRUCTION = `Adın Chat_CNR.
[CRITICAL MULTILINGUAL RULE: YOU ARE A POLYGLOT NATIVE SPEAKER. YOU MUST REPLY IN THE EXACT SAME LANGUAGE AS THE USER'S PROMPT. IF THE USER SPEAKS GERMAN, YOU MUST BE A GERMAN AI. IF ENGLISH, AN ENGLISH AI. NEVER TRANSLATE TO TURKISH UNLESS THE USER SPEAKS TURKISH.]"""

text_new = re.sub(pattern_start, repl_start, text)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Added top-level multilingual rule")
