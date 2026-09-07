import re

with open("vite.config.ts", "r") as f:
    text = f.read()

# Replace external icon URLs with local ones
text = text.replace("'https://cdn-icons-png.flaticon.com/512/1698/1698535.png'", "'/icon-512.png'")
text = text.replace("'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1920&h=1080'", "'/screenshot-wide.jpg'")
text = text.replace("'https://images.unsplash.com/photo-1675271591211-126ad94e495d?auto=format&fit=crop&q=80&w=750&h=1334'", "'/screenshot-narrow.jpg'")

# Make registerType 'autoUpdate' and injectRegister 'auto'
text = text.replace("registerType: 'prompt',", "registerType: 'autoUpdate',\n          injectRegister: 'auto',")

with open("vite.config.ts", "w") as f:
    f.write(text)

