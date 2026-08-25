import re

with open("App.tsx", "r") as f:
    text = f.read()

# Make the Send button and other input buttons pill-shaped and fit the theme
pattern_send = r'className=\{`p-2 rounded-xl md:p-2\.5 transition-all shadow-xl active:scale-95 disabled:opacity-30 \$\{\s*input\.trim\(\) \|\| selectedImage\s*\? "bg-blue-600 text-white shadow-blue-500\/40 hover:bg-blue-500 translate-y-0 active:translate-y-0\.5"\s*: theme === "dark"\s*\? "bg-zinc-800 text-zinc-600"\s*: "bg-zinc-200 text-zinc-400"\s*\}`\}'

repl_send = 'className={`p-2 rounded-full md:p-3 transition-all active:scale-95 disabled:opacity-30 ${input.trim() || selectedImage ? (theme === "dark" ? "bg-zinc-200 text-zinc-900 hover:bg-white" : "bg-zinc-900 text-white hover:bg-zinc-800") : "bg-transparent text-zinc-400"}`}'

text = re.sub(pattern_send, repl_send, text)

# Ensure the Deep Mode/Camera/Mic buttons are also rounded-full and minimal
pattern_toolbar_btns = r'className=\{`p-2 rounded-xl transition-all disabled:opacity-30 flex items-center gap-2 group relative'
repl_toolbar_btns = r'className={`p-2 rounded-full transition-all disabled:opacity-30 flex items-center gap-2 group relative'
text = re.sub(pattern_toolbar_btns, repl_toolbar_btns, text)

text = text.replace('p-2 rounded-xl transition-all disabled:opacity-30 ${theme === "dark" ? "text-zinc-500 hover:text-white hover:bg-zinc-800/50" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"}', 'p-2 rounded-full transition-all disabled:opacity-30 ${theme === "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"}')

# Mic button
pattern_mic = r'className=\{`p-2 rounded-xl transition-all disabled:opacity-30 \$\{\s*isRecording\s*\? "bg-red-500\/10 text-red-500 shadow-\[0_0_20px_rgba\(239,68,68,0\.3\)\] animate-pulse"\s*: theme === "dark"\s*\? "text-zinc-500 hover:text-white hover:bg-zinc-800\/50"\s*: "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"\s*\}`\}'

repl_mic = 'className={`p-2 rounded-full transition-all disabled:opacity-30 ${isRecording ? "bg-red-500/10 text-red-500 animate-pulse" : theme === "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50" : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50"}`}'

text = re.sub(pattern_mic, repl_mic, text)

# Remove the box-shadows / borders from the root container to make it clean
text = text.replace('${edgeGlow ? "shadow-[inset_0_0_100px_rgba(245,158,11,0.5)] border-4 border-amber-500/50 box-border" : ""}', '')

with open("App.tsx", "w") as f:
    f.write(text)
