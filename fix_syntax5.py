import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'const newSession = \/\/ Create a mock new session for notebook'
repl = r'// Create a mock new session for notebook'

text = re.sub(pattern, repl, text)

with open("App.tsx", "w") as f:
    f.write(text)

print("Syntax fixed")
