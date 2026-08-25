import re

with open("App.tsx", "r") as f:
    text = f.read()

text = re.sub(r'Code,\s*,\s*Activity', 'Code, Activity', text)

with open("App.tsx", "w") as f:
    f.write(text)

