import re

with open("App.tsx", "r") as f:
    text = f.read()

# Make the top-right header buttons rounded-full and border-transparent
pattern = r'className=\{`p-2 rounded-lg transition-all border \$\{theme === "dark" \? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900"\}`\}'
replacement = r'className={`p-2 rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f] hover:text-zinc-200" : "text-zinc-600 hover:bg-[#e1e5ea] hover:text-zinc-900"}`}'
text = re.sub(pattern, replacement, text)

# For Share button which had indigo hover
pattern_share = r'className=\{`p-2 rounded-lg transition-all border \$\{theme === "dark" \? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-indigo-400" : "bg-white border-zinc-200 text-zinc-500 hover:text-indigo-600"\}`\}'
replacement_share = r'className={`p-2 rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f] hover:text-indigo-400" : "text-zinc-600 hover:bg-[#e1e5ea] hover:text-indigo-600"}`}'
text = re.sub(pattern_share, replacement_share, text)

# Volume button
pattern_vol = r'className=\{`p-2 rounded-lg transition-all border \$\{isAutoSpeak \? "bg-blue-600 border-blue-500 text-white" : theme === "dark" \? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900"\}`\}'
replacement_vol = r'className={`p-2 rounded-full transition-colors ${isAutoSpeak ? "bg-[#d3e3fd] text-[#041e49]" : theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f] hover:text-zinc-200" : "text-zinc-600 hover:bg-[#e1e5ea] hover:text-zinc-900"}`}'
text = re.sub(pattern_vol, replacement_vol, text)

with open("App.tsx", "w") as f:
    f.write(text)

print("Updated header buttons")
