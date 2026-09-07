import re

with open("App.tsx", "r") as f:
    text = f.read()

# Replace blue theme with rose (Crimson/Red) theme for CNR identity
text = re.sub(r'bg-blue-([0-9]+)', r'bg-rose-\1', text)
text = re.sub(r'text-blue-([0-9]+)', r'text-rose-\1', text)
text = re.sub(r'border-blue-([0-9]+)', r'border-rose-\1', text)
text = re.sub(r'shadow-blue-([0-9]+)', r'shadow-rose-\1', text)
text = re.sub(r'ring-blue-([0-9]+)', r'ring-rose-\1', text)

# Let's change the Sparkles icon to something sharper, like Hexagon or Zap
# But first, ensure Zap or Hexagon is imported.
import_pattern = r'import \{([^}]+)\} from "lucide-react";'
def import_repl(match):
    imports = match.group(1)
    if 'Zap' not in imports:
        imports += ', Zap, Hexagon, Terminal'
    return f'import {{{imports}}} from "lucide-react";'

text = re.sub(import_pattern, import_repl, text)

# Replace Sparkles with Hexagon for the logo
text = text.replace('<Sparkles size={22}', '<Hexagon size={22}')
text = text.replace('<Sparkles size={24} fill="currentColor"', '<Hexagon size={24} fill="currentColor"')

with open("App.tsx", "w") as f:
    f.write(text)

print("Theme changed to Rose (Crimson) and Logo to Hexagon")
