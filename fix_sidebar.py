import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Sidebar width and background update
# Let's check current sidebar classes
pattern_sidebar = r'<aside\s+className=\{`fixed inset-y-0 left-0 z-\[60\] w-72 border-r transition-all duration-500 ease-\[0\.23, 1, 0\.32, 1\] lg:relative lg:translate-x-0 \$\{isSidebarOpen \? "translate-x-0 shadow-2xl" : "-translate-x-full"\} \$\{theme === "dark" \? "bg-\[#09090b\] border-\[#1e1e1e\] shadow-\[10px_0_40px_rgba\(0,0,0,0\.4\)\]" : "bg-white border-zinc-200"\}\`\}\s*>'

repl_sidebar = r'<aside className={`fixed inset-y-0 left-0 z-[60] w-[280px] transition-all duration-500 ease-[0.23, 1, 0.32, 1] lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} ${theme === "dark" ? "bg-[#1e1f20]" : "bg-[#f0f4f9]"}`}>'

text = re.sub(pattern_sidebar, repl_sidebar, text)

# 2. Sidebar Header Updates (Logo + Collapse button)
pattern_header = r'<div className=\{`px-4 py-4 flex items-center justify-between`\}>\s*<button\s+onClick=\{\(\) => setIsSidebarOpen\(false\)\}\s+className=\{`p-2 rounded-full transition-colors \$\{theme === "dark" \? "text-zinc-400 hover:bg-\[#2a2b2f\]" : "text-zinc-600 hover:bg-\[#e1e5ea\]"\}`\}\s*>\s*<Menu size=\{20\} \/>\s*<\/button>\s*<\/div>'

repl_header = """<div className={`px-4 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2 px-2">
              <Sparkles size={22} className={theme === "dark" ? "text-blue-400" : "text-blue-600"} />
              <span className={`text-[16px] font-medium ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>Chat_CNR</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`p-2 rounded-full transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f]" : "text-zinc-600 hover:bg-[#e1e5ea]"}`}
            >
              <Menu size={20} />
            </button>
          </div>"""

text = re.sub(pattern_header, repl_header, text)

# 3. New Chat Button
pattern_new_chat = r'<button\s+id="new-chat-btn"[\s\S]*?<\/button>'

repl_new_chat = """<button
              id="new-chat-btn"
              onClick={createNewSession}
              className={`w-[140px] flex items-center gap-3 py-2 px-4 rounded-full font-medium transition-all ${theme === "dark" ? "bg-[#131314] hover:bg-[#333537] text-zinc-300" : "bg-white hover:bg-zinc-100 text-zinc-700"} mx-2 mb-4`}
            >
              <Plus size={18} className="opacity-70" />
              <span className="text-[14px]">Yeni sohbet</span>
            </button>"""

if '<button\n              id="new-chat-btn"' in text:
   text = re.sub(r'<button\s+id="new-chat-btn"[\s\S]*?<\/button>', repl_new_chat, text)

# 4. Remove padding from the div wrapping new-chat-btn
text = text.replace('<div className="p-6">', '<div className="pt-2">')

# 5. Add custom static links before sessions
pattern_sessions_list = r'<div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1\.5 custom-scrollbar">\s*<AnimatePresence mode="popLayout">'

repl_sessions_list = """<div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            
            {/* Top static links matching image */}
            <div className="mb-4 space-y-[2px]">
              <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <Search size={18} className="opacity-70" />
                Sohbetlerde arama yapın
              </button>
              <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <ImageIcon size={18} className="opacity-70" />
                Resimler
              </button>
              <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                Kitaplık
              </button>
            </div>

            {/* Note books section */}
            <div className="mb-4">
               <div className={`px-4 text-[12px] font-medium mb-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>Not defterleri</div>
               <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <Plus size={18} className="opacity-70" />
                Yeni not defteri
              </button>
            </div>

            {/* Sessions Header */}
            <div className={`px-4 flex items-center gap-1 text-[12px] font-medium mb-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
               Son Kullanılanlar 
               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
            
            <div className="space-y-[2px]">
            <AnimatePresence mode="popLayout">"""

text = re.sub(pattern_sessions_list, repl_sessions_list, text)

# 6. Session Item Styling (Remove MessageSquare Icon, Make pill shape perfect, add Pin icon placeholder)
pattern_session_item = r'className=\{`group relative flex items-center gap-3 py-2\.5 px-3 rounded-full cursor-pointer transition-colors \$\{\s*activeSessionId === session\.id\s*\?\s*\(theme === "dark"\s*\? "bg-\[#282a2c\] text-blue-200"\s*: "bg-\[#d3e3fd\] text-\[#041e49\]"\)\s*:\s*\(theme === "dark"\s*\? "hover:bg-\[#282a2c\] text-zinc-400 hover:text-zinc-200"\s*: "hover:bg-\[#e1e5ea\] text-zinc-700"\)\s*\}\`\}>[\s\S]*?<div\s+className=\{`p-1\.5 rounded-lg flex-shrink-0 transition-colors[\s\S]*?<\/div>\s*<span className="flex-1 text-\[13px\] font-medium truncate pr-6 tracking-tight">\s*\{session\.title\}\s*<\/span>'

repl_session_item = """className={`group relative flex items-center justify-between py-2 px-3 min-h-[36px] rounded-full cursor-pointer transition-colors ${activeSessionId === session.id ? (theme === "dark" ? "bg-[#333537] text-zinc-200" : "bg-[#d3e3fd] text-[#041e49]") : (theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]")}`}>
                    <span className="flex-1 text-[13px] font-medium truncate pr-4 tracking-normal">
                      {session.title}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Placeholder for pin or dots, using a subtle dot for now or pin icon if we had it. Just leave empty area for Trash to appear */}
                    </div>"""

if '<div\n                      className={`p-1.5' in text:
    text = re.sub(r'className=\{`group relative flex items-center gap-3 py-2\.5 px-3[\s\S]*?<span className="flex-1 text-\[13px\] font-medium truncate pr-6 tracking-tight">\s*\{session\.title\}\s*<\/span>', repl_session_item, text)

# 7. Update Trash Icon Container styling (make it a subtle 3 dots placeholder in normal state if needed, or just keep trash minimal)
pattern_trash = r'<button\s+onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setDeletingSessionId\(session\.id\);\s*\}\}\s+className=\{`absolute right-2 p-1\.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all \$\{\s*theme === "dark"\s*\? "hover:bg-red-500\/20 text-zinc-600 hover:text-red-500"\s*: "hover:bg-red-50 text-zinc-400 hover:text-red-500"\s*\}\`\}\s*>\s*<Trash2 size=\{12\} \/>\s*<\/button>'

repl_trash = """<button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSessionId(session.id);
                      }}
                      className={`absolute right-1 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                        theme === "dark"
                          ? "hover:bg-zinc-600 text-zinc-400 hover:text-red-400"
                          : "hover:bg-zinc-300 text-zinc-500 hover:text-red-500"
                      }`}
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>"""

text = re.sub(pattern_trash, repl_trash, text)


# 8. User Profile / Bottom section updates
# `className={`p-4 border-t ${theme === "dark" ? "border-zinc-800/50 bg-[#070707]" : "border-zinc-100 bg-zinc-50/50"}`}`
pattern_user_section = r'<div\s+className=\{`p-4 border-t \$\{theme === "dark" \? "border-zinc-800\/50 bg-\[#070707\]" : "border-zinc-100 bg-zinc-50\/50"\}`\}\s*>\s*<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>'

repl_user_section = """            </AnimatePresence>
            </div>
            
            <div className="mt-2 mb-2">
               <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Etkinlik
              </button>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className={`px-2 pb-4`}>
            <button
                onClick={() => setIsProfileOpen(true)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-full transition-all ${theme === "dark" ? "hover:bg-[#333537]" : "hover:bg-[#e1e5ea]"}`}
              >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-blue-100 text-blue-600`}>
                      {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <User size={16} />}
                    </div>
                    <p className={`text-[14px] font-medium truncate ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                      {user.name || "Dodi'nin Dünyası"}
                    </p>
                </div>
                <Settings size={18} className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`} />
            </button>
          </div>
        </div>"""

if '<div\n            className={`p-4 border-t' in text:
    text = re.sub(r'<\/AnimatePresence>\s*<\/div>\s*<div\s+className=\{`p-4 border-t[\s\S]*?<\/div>\s*<\/div>\s*<\/div>', repl_user_section, text)

# 9. Top-Left Menu button in main header should have no margin
text = text.replace('className={`lg:hidden p-2 -ml-2 rounded-full transition-all flex-shrink-0 ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f]" : "text-zinc-500 hover:bg-[#e1e5ea]"}`}', 'className={`lg:hidden p-2 rounded-full transition-all flex-shrink-0 ${theme === "dark" ? "text-zinc-400 hover:bg-[#2a2b2f]" : "text-zinc-500 hover:bg-[#e1e5ea]"}`}')

with open("App.tsx", "w") as f:
    f.write(text)
print("Sidebar updated")
