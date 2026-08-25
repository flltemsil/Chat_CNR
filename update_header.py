import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'<h1 className=\{`text-\[18px\] md:text-\[22px\] font-medium tracking-tight \$\{theme === "dark" \? "text-zinc-200" : "text-\[#444746\]"\}`\}>\s*Chat_CNR\s*<\/h1>'
replacement = r"""<h1 className={`text-[20px] md:text-[22px] font-medium tracking-tight flex items-center gap-2 ${theme === "dark" ? "text-zinc-200" : "text-[#444746]"}`}>
                    <span className="text-[#d96570]"><Sparkles size={24} fill="currentColor" /></span>
                    Chat_CNR
                  </h1>"""

text = re.sub(pattern, replacement, text)

with open("App.tsx", "w") as f:
    f.write(text)
print("Updated header")
