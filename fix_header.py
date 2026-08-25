import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'<header\s+className=\{`h-16 border-b backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 \$\{theme === "dark" \? "border-zinc-800\/50 bg-\[#131314\]\/70" : "border-zinc-200\/50 bg-white\/70"\}`\}\s*>\s*<div className="flex items-center gap-3 md:gap-4 overflow-hidden">\s*<button\s+onClick=\{\(\) => setIsSidebarOpen\(true\)\}\s+className=\{`lg:hidden p-2 -ml-2 rounded-lg transition-all flex-shrink-0 \$\{theme === "dark" \? "text-zinc-400 hover:bg-zinc-800" : "text-zinc-500 hover:bg-zinc-100"\}`\}\s*>\s*<Menu size=\{18\} \/>\s*<\/button>\s*<div className="flex items-center gap-3 overflow-hidden">\s*<div className="flex items-center gap-2">\s*<h1 className=\{`text-\[18px\] md:text-\[22px\] font-medium tracking-tight \$\{theme === "dark" \? "text-zinc-200" : "text-\[#444746\]"\}`\}>\s*Chat_CNR\s*<\/h1>\s*<\/div>\s*<\/div>\s*<\/div>'

new_header = """<header className={`h-16 flex items-center justify-between px-4 sticky top-0 z-50 ${theme === "dark" ? "bg-[#131314]" : "bg-white"}`}>
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`lg:hidden p-2 -ml-2 rounded-full transition-all flex-shrink-0 ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f]" : "text-zinc-500 hover:bg-[#e1e5ea]"}`}
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <h1 className={`text-[20px] md:text-[22px] font-medium tracking-tight flex items-center gap-2 ${theme === "dark" ? "text-zinc-200" : "text-[#444746]"}`}>
                  <span className="text-[#d96570]"><Sparkles size={24} fill="currentColor" /></span>
                  Chat_CNR
                </h1>
              </div>
            </div>"""

if pattern in text:
    print("Found exact match? No, wait. Using regex.")
    text = re.sub(pattern, new_header, text)
else:
    print("Trying more relaxed match.")
    pattern = r'<header[\s\S]*?Chat_CNR\s*<\/h1>\s*<\/div>\s*<\/div>\s*<\/div>'
    text = re.sub(pattern, new_header, text)

with open("App.tsx", "w") as f:
    f.write(text)
print("Updated header")
