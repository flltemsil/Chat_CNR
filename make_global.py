import re

with open("App.tsx", "r") as f:
    text = f.read()

# Change theme from rose to indigo for a sleek global tech vibe
text = re.sub(r'bg-rose-([0-9]+)', r'bg-indigo-\1', text)
text = re.sub(r'text-rose-([0-9]+)', r'text-indigo-\1', text)
text = re.sub(r'border-rose-([0-9]+)', r'border-indigo-\1', text)
text = re.sub(r'shadow-rose-([0-9]+)', r'shadow-indigo-\1', text)
text = re.sub(r'ring-rose-([0-9]+)', r'ring-indigo-\1', text)

# Add Globe icon
import_pattern = r'import \{([^}]+)\} from "lucide-react";'
def import_repl(match):
    imports = match.group(1)
    if 'Globe' not in imports:
        imports += ', Globe'
    return f'import {{{imports}}} from "lucide-react";'

text = re.sub(import_pattern, import_repl, text)

# Replace Hexagon with Globe
text = text.replace('<Hexagon size={22}', '<Globe size={22}')
text = text.replace('<Hexagon size={24} fill="currentColor"', '<Globe size={24} fill="currentColor"')

# Change badge text
text = text.replace("TURKEY'S STRONGEST", "GLOBAL INTELLIGENCE")

with open("App.tsx", "w") as f:
    f.write(text)

print("App.tsx updated for global vibe")
