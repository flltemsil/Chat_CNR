import re

with open("vite.config.ts", "r") as f:
    text = f.read()

text = text.replace("injectRegister: 'auto',", "injectRegister: 'script',\n          registerType: 'autoUpdate',")

with open("vite.config.ts", "w") as f:
    f.write(text)

