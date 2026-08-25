import re

with open("App.tsx", "r") as f:
    text = f.read()

# Fix layout backgrounds
# From: `bg-[#0a0a0a]` to `bg-[#131314]`
# `bg-zinc-50` to `bg-white`
# `bg-[#030303]` to `bg-transparent`

text = text.replace('bg-[#0a0a0a]', 'bg-[#131314]')
text = text.replace('bg-[#030303]', 'bg-[#131314]')
text = text.replace('bg-[#050505]', 'bg-[#1e1f20]') # Sidebar dark

# Sidebar styling
# 1. New chat button: Instead of blue block, make it a pill like Gemini
pattern_new_chat = r'<button\s+id="new-chat-btn"\s+onClick=\{createNewSession\}\s+className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500\/10 active:scale-\[0\.98\]"\s*>\s*<Plus size=\{18\} \/>\s*<span className="text-sm">\{t.newChat\}<\/span>\s*<\/button>'

repl_new_chat = """<button
              id="new-chat-btn"
              onClick={createNewSession}
              className={`w-full flex items-center gap-3 py-3 px-5 rounded-full font-medium transition-all ${theme === "dark" ? "bg-[#131314] hover:bg-[#2a2b2f] text-zinc-300 border border-zinc-700/50" : "bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200"}`}
            >
              <Plus size={18} />
              <span className="text-[14px]">Yeni sohbet</span>
            </button>"""

text = re.sub(pattern_new_chat, repl_new_chat, text)

# Remove the text "ChatCNR PRO" from sidebar header and make it minimal
pattern_sidebar_header = r'<div\s+className=\{`px-6 py-6 border-b flex items-center justify-between \$\{theme === "dark" \? "border-zinc-800\/50" : "border-zinc-100"\}`\}\s*>\s*<div className="flex items-center gap-3">[\s\S]*?<\/div>\s*<button\s+onClick=\{\(\) => setIsSidebarOpen\(false\)\}[\s\S]*?<\/button>\s*<\/div>'

repl_sidebar_header = """<div className={`px-4 py-4 flex items-center justify-between`}>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`p-2 rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f]" : "text-zinc-600 hover:bg-[#e1e5ea]"}`}
            >
              <Menu size={20} />
            </button>
          </div>"""

text = re.sub(pattern_sidebar_header, repl_sidebar_header, text)

# Sidebar sessions list: remove border styling and use pill shape
pattern_session_item = r'className=\{`group relative flex items-center gap-3 p-3\.5 rounded-xl cursor-pointer transition-all duration-300 border \$\{\s+activeSessionId === session\.id\s+\? theme === "dark"\s+\? "bg-zinc-800\/50 border-zinc-700 text-white shadow-inner"\s+: "bg-zinc-100 border-zinc-200 text-zinc-900 shadow-inner"\s+: theme === "dark"\s+\? "border-transparent hover:bg-zinc-900\/50 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300"\s+: "border-transparent hover:bg-zinc-50 hover:border-zinc-200 text-zinc-600"\s+\}`\}'

repl_session_item = 'className={`group relative flex items-center gap-3 py-2.5 px-3 rounded-full cursor-pointer transition-colors ${activeSessionId === session.id ? (theme === "dark" ? "bg-[#282a2c] text-blue-200" : "bg-[#d3e3fd] text-[#041e49]") : (theme === "dark" ? "hover:bg-[#282a2c] text-zinc-400 hover:text-zinc-200" : "hover:bg-[#e1e5ea] text-zinc-700")}`}'

text = re.sub(pattern_session_item, repl_session_item, text)

# Main Header (Navbar)
pattern_main_header = r'<header\s+className=\{`h-16 border-b backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-50 \$\{theme === "dark" \? "border-zinc-800\/50 bg-\[#0a0a0a\]\/70" : "border-zinc-200\/50 bg-white\/70"\}`\}\s*>'

repl_main_header = '<header className={`h-16 flex items-center justify-between px-4 sticky top-0 z-50 ${theme === "dark" ? "bg-[#131314]" : "bg-white"}`}>'

text = re.sub(pattern_main_header, repl_main_header, text)

# Replace the title part in the header to just show Chat_CNR
pattern_header_title = r'<div className="hidden sm:flex w-8 h-8 bg-blue-600 rounded-lg items-center justify-center shadow-lg shadow-blue-500\/10 flex-shrink-0">\s*<MessageSquare size=\{16\} className="text-white" \/>\s*<\/div>\s*<div className="flex flex-col min-w-0">\s*<h1 className="font-bold text-\[13px\] tracking-tight truncate uppercase">\s*\{activeSession\?\.title \|\|\s*\(sessions\.length > 0 \? "Loading\.\.\." : t\.newChat\)\}\s*<\/h1>\s*<div className="flex items-center gap-2">\s*<div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse shadow-\[0_0_8px_rgba\(16,185,129,0\.6\)\]"><\/div>\s*<span\s+className=\{`text-\[9px\] uppercase tracking-\[0\.15em\] font-black \$\{theme === "dark" \? "text-emerald-500\/80" : "text-emerald-600"\}`\}\s*>\s*\{t\.online\}\s*<\/span>\s*<\/div>\s*<\/div>'

repl_header_title = """<div className="flex items-center gap-2">
                  <h1 className={`text-[18px] md:text-[22px] font-medium tracking-tight ${theme === "dark" ? "text-zinc-200" : "text-[#444746]"}`}>
                    Chat_CNR
                  </h1>
                </div>"""

text = re.sub(pattern_header_title, repl_header_title, text)

# Input Area (Footer)
# `<form onSubmit={handleSend} className="flex gap-2 relative">`
# `<div className={`flex-1 border-2 rounded-3xl p-2 md:p-3 flex flex-col transition-all duration-500 shadow-inner relative overflow-hidden group ...`
pattern_input_container = r'<div\s+className=\{`flex-1 border-2 rounded-3xl p-2 md:p-3 flex flex-col transition-all duration-500 shadow-inner relative overflow-hidden group \$\{\s+theme === "dark"\s+\? "bg-\[#0a0a0a\] border-zinc-800\/80 focus-within:border-blue-600\/30 focus-within:shadow-\[0_0_60px_rgba\(37,99,235,0\.05\)\]"\s+: "bg-zinc-50 border-zinc-200 focus-within:border-blue-500\/20"\s+\}`\}\s*>'

repl_input_container = '<div className={`flex-1 rounded-[32px] p-2 md:p-3 flex flex-col transition-all relative overflow-hidden ${theme === "dark" ? "bg-[#1e1f20]" : "bg-[#f0f4f9]"}`}>'

text = re.sub(pattern_input_container, repl_input_container, text)

# Footer background
pattern_footer = r'<footer\s+className=\{`px-4 py-4 md:p-6 pb-\[calc\(env\(safe-area-inset-bottom,0\)\+16px\)\] border-t transition-colors duration-500 \$\{theme === "dark" \? "bg-\[#050505\]\/95 backdrop-blur-2xl border-zinc-800\/40 shadow-\[0_-20px_50px_rgba\(0,0,0,0\.5\)\]" : "bg-white border-zinc-100"\}`\}\s*>'

repl_footer = '<footer className={`px-4 py-4 md:px-8 pb-[calc(env(safe-area-inset-bottom,0)+24px)] ${theme === "dark" ? "bg-[#131314]" : "bg-white"}`}>'

text = re.sub(pattern_footer, repl_footer, text)

with open("App.tsx", "w") as f:
    f.write(text)

