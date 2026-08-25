import re

with open("App.tsx", "r") as f:
    text = f.read()

# Import Activity
import_pattern = r'import\s+\{([^}]+)\}\s+from\s+"lucide-react";'
def add_icon(match):
    icons = match.group(1)
    if "Activity" not in icons:
        icons += ", Activity"
    return f'import {{{icons}}} from "lucide-react";'

text = re.sub(import_pattern, add_icon, text)

with open("App.tsx", "w") as f:
    f.write(text)

