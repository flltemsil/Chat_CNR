import re

with open("App.tsx", "r") as f:
    text = f.read()

# Fix the missing closing tags by properly replacing the user profile section
# Current broken block:
# `            </AnimatePresence>\n          </div>\n\n          {/* User Profile Section */}\n          <div\n            className={`p-4 border-t ${theme === "dark" ? "border-zinc-800/50 bg-[#070707]" : "border-zinc-100 bg-zinc-50/50"}`}\n          >`

pattern = r'<\/AnimatePresence>\s*<\/div>\s*\{\/\* User Profile Section \*\/\}\s*<div\s*className=\{`p-4 border-t \$\{theme === "dark" \? "border-zinc-800\/50 bg-\[#070707\]" : "border-zinc-100 bg-zinc-50\/50"\}`\}\s*>\s*<div className="flex gap-2">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/aside>'

new_profile = """            </AnimatePresence>
            </div>
            
            <div className="mt-2 mb-2">
               <button className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Etkinlik
              </button>
            </div>
          
          {/* User Profile Section */}
          <div className={`px-2 pb-4`}>
            <button
                onClick={() => setIsProfileOpen(true)}
                className={`w-full flex items-center justify-between py-2 px-3 rounded-full transition-all ${theme === "dark" ? "hover:bg-[#333537]" : "hover:bg-[#e1e5ea]"}`}
              >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                      {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full object-cover" /> : <User size={16} />}
                    </div>
                    <p className={`text-[14px] font-medium truncate ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                      {user?.name || "Kullanıcı"}
                    </p>
                </div>
                <Settings size={18} className={`${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`} />
            </button>
          </div>
        </div>
      </aside>"""

text = re.sub(pattern, new_profile, text)

# Add a Pin icon specifically to the sessions list as requested
pin_pattern = r'<div className="opacity-0 group-hover:opacity-100 transition-opacity">\s*\{\/\* Placeholder for pin or dots, using a subtle dot for now or pin icon if we had it\. Just leave empty area for Trash to appear \*\/\}\s*<\/div>'
pin_repl = r"""<div className={`opacity-0 group-hover:opacity-100 transition-opacity mr-6 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 0-1-1 2 2 0 0 0-4 0a1 1 0 0 0-1 1v3.76z"/></svg>
                    </div>"""
text = re.sub(pin_pattern, pin_repl, text)


with open("App.tsx", "w") as f:
    f.write(text)

