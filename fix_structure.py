import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Restore Sidebar
# Find the whole aside block
aside_pattern = r'<aside className=\{`fixed inset-y-0 left-0 z-\[60\] w-\[280px\][\s\S]*?<\/aside>'
aside_replacement = """<aside className={`fixed inset-y-0 left-0 z-[60] w-[280px] transition-all duration-500 ease-[0.23, 1, 0.32, 1] lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} ${theme === "dark" ? "bg-[#050505] border-r border-zinc-800/50" : "bg-[#f8f9fa] border-r border-zinc-200"}`}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className={`px-6 py-6 border-b flex items-center justify-between ${theme === "dark" ? "border-zinc-800/50" : "border-zinc-200"}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Brain size={18} className="text-white" />
              </div>
              <h1 className={`font-bold text-lg tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>Chat_CNR</h1>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`p-2 rounded-lg transition-colors lg:hidden ${theme === "dark" ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-200 text-zinc-600"}`}
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-transparent">
            <button
              id="new-chat-btn"
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-bold transition-all shadow-xl shadow-blue-500/10 active:scale-[0.98]"
            >
              <Plus size={18} />
              <span className="text-sm">Yeni sohbet</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-6">
            
            <div className="space-y-1">
              <div className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                Keşfet
              </div>
              {isSearchActive ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"}`}>
                  <Search size={16} className="opacity-50" />
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Ara..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[13px] w-full"
                  />
                  <button onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}><X size={14} className="opacity-50 hover:opacity-100"/></button>
                </div>
              ) : (
                <button onClick={() => setIsSearchActive(true)} className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-medium transition-colors border border-transparent ${theme === "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 hover:border-zinc-800" : "text-zinc-600 hover:text-zinc-900 hover:bg-white hover:border-zinc-200 hover:shadow-sm"}`}>
                  <Search size={16} className="opacity-70" />
                  Sohbetlerde arama yapın
                </button>
              )}
              <button onClick={() => setImageFilter(!imageFilter)} className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-[13px] font-medium transition-colors border ${imageFilter ? (theme === "dark" ? "bg-blue-900/20 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-600 border-blue-100") : (theme === "dark" ? "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 hover:border-zinc-800" : "border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-white hover:border-zinc-200 hover:shadow-sm")}`}>
                <ImageIcon size={16} className="opacity-70" />
                Resimler {imageFilter && <span className="ml-auto text-[9px] bg-blue-500/20 px-2 py-0.5 rounded-full">Filtre Aktif</span>}
              </button>
            </div>

            <div className="space-y-1">
              <div className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 flex items-center justify-between ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
                Sohbetler
                <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md text-[10px]">{sessions.filter(s => s && s.id).length}</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {sessions
                    .filter((s) => s && s.id)
                    .filter((s) => !searchQuery || (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())))
                    .filter((s) => !imageFilter || (s.messages && s.messages.some(m => !!m.imageUrl)))
                    .map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03, duration: 0.4 }}
                        onClick={() => {
                          setActiveSessionId(session.id);
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                        className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
                          activeSessionId === session.id
                            ? theme === "dark"
                              ? "bg-zinc-800/50 border-zinc-700 text-white shadow-inner"
                              : "bg-blue-50 border-blue-200 text-blue-900 shadow-inner"
                            : theme === "dark"
                              ? "border-transparent hover:bg-zinc-900/50 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300"
                              : "border-transparent hover:bg-white hover:border-zinc-200 text-zinc-600 hover:shadow-sm"
                        }`}
                      >
                        <MessageSquare size={16} className={`flex-shrink-0 ${activeSessionId === session.id ? "text-blue-500" : "opacity-50"}`} />
                        <span className="flex-1 text-[13px] font-medium truncate pr-6 tracking-tight">
                          {session.title}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingSessionId(session.id);
                          }}
                          className={`absolute right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                            theme === "dark"
                              ? "hover:bg-red-500/20 text-zinc-400 hover:text-red-500"
                              : "hover:bg-red-50 text-zinc-400 hover:text-red-500"
                          }`}
                          title="Sil"
                        >
                          <Trash2 size={12} />
                        </button>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className={`p-4 border-t ${theme === "dark" ? "border-zinc-800/50 bg-[#070707]" : "border-zinc-200 bg-zinc-50/50"}`}>
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${theme === "dark" ? "hover:bg-zinc-900/50 border border-transparent hover:border-zinc-800" : "hover:bg-white border border-transparent hover:border-zinc-200 hover:shadow-sm"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden shadow-sm border ${theme === "dark" ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"}`}>
                  {user?.photoUrl ? <img src={user.photoUrl} alt="User" className="w-full h-full object-cover" /> : <User size={16} />}
                </div>
                <div className="flex flex-col items-start">
                  <p className={`text-sm font-bold truncate max-w-[120px] ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                    {user?.name || "Kullanıcı"}
                  </p>
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>
                    Ayarlar
                  </p>
                </div>
              </div>
              <Settings size={16} className={`${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`} />
            </button>
          </div>
        </div>
      </aside>"""

text = re.sub(aside_pattern, aside_replacement, text)

# 2. Restore Main Chat Area empty state
empty_state_pattern = r'<motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\} className="flex flex-col justify-center min-h-\[50vh\] w-full max-w-4xl mx-auto pb-4">[\s\S]*?<\/motion\.div>'
empty_state_replacement = """<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8 w-full">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full max-w-4xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border shadow-2xl ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800/50" : "bg-white/50 border-zinc-200/50"}`}
                  >
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
                      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <motion.div 
                        initial={{ rotate: -180, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(37,99,235,0.4)]"
                      >
                        <Brain size={36} className="text-white" />
                      </motion.div>
                      
                      <h2 className={`text-3xl md:text-4xl font-black mb-3 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r ${theme === "dark" ? "from-white to-zinc-500" : "from-zinc-900 to-zinc-500"}`}>
                        Chat_CNR GLOBAL
                      </h2>
                      <p className={`text-sm md:text-base max-w-xl font-medium tracking-wide mb-10 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        TÜM GOOGLE VERİ AĞINA ENTEGRE EVRENSEL ZEKÂ
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        {[
                          { icon: <Zap size={20} />, label: "İşlem Gücü", value: "Sınır Tanımaz" },
                          { icon: <Network size={20} />, label: "Ağ Gecikmesi", value: "< 12ms" },
                          { icon: <Shield size={20} />, label: "Güvenlik", value: "Kuantum Düzeyi" }
                        ].map((stat, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + (idx * 0.1) }}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border backdrop-blur-sm transition-all hover:scale-105 cursor-default ${theme === "dark" ? "bg-zinc-950/50 border-zinc-800" : "bg-white/80 border-zinc-200"}`}
                          >
                            <div className="text-blue-500 mb-3">
                              {stat.icon}
                            </div>
                            <div className={`text-sm font-semibold tracking-wider uppercase mb-1 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                              {stat.label}
                            </div>
                            <div className={`text-lg font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                              {stat.value}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>"""

text = re.sub(empty_state_pattern, empty_state_replacement, text)

# Ensure Network, Shield, Brain are imported
import_pattern = r'import \{([^}]+)\} from "lucide-react";'
def import_repl(match):
    imports = match.group(1)
    for icon in ['Network', 'Shield', 'Brain', 'Zap']:
        if icon not in imports:
            imports += f', {icon}'
    return f'import {{{imports}}} from "lucide-react";'

text = re.sub(import_pattern, import_repl, text)

with open("App.tsx", "w") as f:
    f.write(text)

print("Restored Old Sidebar and Chat Empty State with Global Vibe")
