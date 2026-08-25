import re

with open("App.tsx", "r") as f:
    text = f.read()

match = re.search(r'<div className=\{`flex-1[^>]*flex flex-col[^>]*>\s*<div className="flex items-center', text, re.DOTALL)
if match:
    print(match.group(0)[:300])

