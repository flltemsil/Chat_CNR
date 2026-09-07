import re

with open("App.tsx", "r") as f:
    text = f.read()

# Revert indigo to blue
text = re.sub(r'bg-indigo-([0-9]+)', r'bg-blue-\1', text)
text = re.sub(r'text-indigo-([0-9]+)', r'text-blue-\1', text)
text = re.sub(r'border-indigo-([0-9]+)', r'border-blue-\1', text)
text = re.sub(r'shadow-indigo-([0-9]+)', r'shadow-blue-\1', text)
text = re.sub(r'ring-indigo-([0-9]+)', r'ring-blue-\1', text)

# Revert Globe to Sparkles
text = text.replace('<Globe size={22}', '<Sparkles size={22}')
text = text.replace('<Globe size={24} fill="currentColor"', '<Sparkles size={24} fill="currentColor"')
text = text.replace("GLOBAL INTELLIGENCE", "ADVANCED AI") # Just to make it global but cool

with open("App.tsx", "w") as f:
    f.write(text)

print("Reverted indigo to blue")
