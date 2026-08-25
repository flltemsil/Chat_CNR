import re

with open("vite.config.ts", "r") as f:
    text = f.read()

pattern = r"devOptions:\s*\{\s*enabled:\s*true,\s*type:\s*'module',\s*\}"
repl = r"devOptions: { enabled: false }"

text_new = re.sub(pattern, repl, text)

with open("vite.config.ts", "w") as f:
    f.write(text_new)

print("PWA devOptions disabled")
