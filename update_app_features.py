import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Add States
state_insert = """  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // NEW FEATURES STATES
  const [selectedModel, setSelectedModel] = useState<"gemini-1.5-flash" | "gemini-1.5-pro">("gemini-1.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFilter, setImageFilter] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
"""
text = text.replace('  const [selectedImage, setSelectedImage] = useState<string | null>(null);', state_insert)

# 2. Add selectedModel to API calls
pattern_call1 = r'const stream = chatCNRService\.sendMessageStream\([\s\S]*?isDeepMode,\s*\);'
repl_call1 = r"""      const stream = chatCNRService.sendMessageStream(
        prompt,
        activeSession?.messages || [],
        currentImage,
        user.name,
        user.email,
        isChatMode,
        user.role,
        user,
        language,
        isDeepMode,
        selectedModel === 'gemini-1.5-pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'
      );"""
text = re.sub(pattern_call1, repl_call1, text)

# 3. Handle model dropdown and button in the input toolbar
pattern_flash = r'<div className=\{`px-3 py-1\.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors \$\{theme === "dark" \? "hover:bg-\[#333537\]" : "hover:bg-\[#e1e5ea\]"\}`\}>\s*<span className=\{`text-\[13px\] font-medium \$\{theme === "dark" \? "text-zinc-300" : "text-zinc-700"\}`\}>Flash<\/span>\s*<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="m6 9 6 6 6-6"\/><\/svg>\s*<\/div>'

repl_flash = """<div className="relative">
                        <div 
                          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                          className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-[#333537]" : "hover:bg-[#e1e5ea]"}`}
                        >
                          <span className={`text-[13px] font-medium ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                            {selectedModel === "gemini-1.5-pro" ? "Pro" : "Flash"}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-70 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                        
                        {isModelDropdownOpen && (
                          <div className={`absolute bottom-full mb-2 left-0 w-48 rounded-2xl shadow-xl border overflow-hidden ${theme === "dark" ? "bg-[#1e1f20] border-zinc-700/50" : "bg-white border-zinc-200"}`}>
                            <div className="p-1">
                              <button 
                                type="button"
                                onClick={() => { setSelectedModel("gemini-1.5-flash"); setIsModelDropdownOpen(false); }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex flex-col ${selectedModel === "gemini-1.5-flash" ? (theme === "dark" ? "bg-[#333537] text-blue-400" : "bg-blue-50 text-blue-600") : (theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-zinc-100")}`}
                              >
                                <span className="font-semibold">Flash</span>
                                <span className="text-[11px] opacity-70">Hızlı ve günlük görevler için</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => { 
                                  if(user?.isPro || user?.role === 'admin') { 
                                    setSelectedModel("gemini-1.5-pro"); 
                                  } else { 
                                    alert("Pro modeline erişim için Chat_CNR Pro kullanıcısı olmalısınız."); 
                                  } 
                                  setIsModelDropdownOpen(false); 
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex flex-col mt-1 ${selectedModel === "gemini-1.5-pro" ? (theme === "dark" ? "bg-[#333537] text-blue-400" : "bg-blue-50 text-blue-600") : (theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-zinc-100")}`}
                              >
                                <span className="font-semibold flex items-center gap-1">Pro {!user?.isPro && user?.role !== 'admin' && <span className="text-[9px] px-1 bg-amber-500/20 text-amber-600 rounded">KİLİTLİ</span>}</span>
                                <span className="text-[11px] opacity-70">En gelişmiş model, karmaşık görevler</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>"""
text = re.sub(pattern_flash, repl_flash, text)

# 4. Make sidebar buttons functional
# Search Button
search_btn_pattern = r'<button className=\{`w-full flex items-center gap-3 py-2 px-3 rounded-full text-\[14px\] transition-colors \$\{theme === "dark" \? "text-zinc-300 hover:bg-\[#333537\]" : "text-zinc-700 hover:bg-\[#e1e5ea\]"\}`\}>\s*<Search size=\{18\} className="opacity-70" \/>\s*Sohbetlerde arama yapın\s*<\/button>'
search_btn_repl = r"""<div className="w-full">
                {isSearchActive ? (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme === "dark" ? "bg-[#333537]" : "bg-[#e1e5ea]"}`}>
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
                  <button onClick={() => setIsSearchActive(true)} className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                    <Search size={18} className="opacity-70" />
                    Sohbetlerde arama yapın
                  </button>
                )}
              </div>"""
text = re.sub(search_btn_pattern, search_btn_repl, text)

# Images Button
img_btn_pattern = r'<button className=\{`w-full flex items-center gap-3 py-2 px-3 rounded-full text-\[14px\] transition-colors \$\{theme === "dark" \? "text-zinc-300 hover:bg-\[#333537\]" : "text-zinc-700 hover:bg-\[#e1e5ea\]"\}`\}>\s*<ImageIcon size=\{18\} className="opacity-70" \/>\s*Resimler\s*<\/button>'
img_btn_repl = r"""<button onClick={() => setImageFilter(!imageFilter)} className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${imageFilter ? (theme === "dark" ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600") : (theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]")}`}>
                <ImageIcon size={18} className="opacity-70" />
                Resimler {imageFilter && <span className="ml-auto text-[10px] bg-blue-500/20 px-1.5 rounded-full">Filtre Aktif</span>}
              </button>"""
text = re.sub(img_btn_pattern, img_btn_repl, text)

# Library Button
lib_btn_pattern = r'<button className=\{`w-full flex items-center gap-3 py-2 px-3 rounded-full text-\[14px\] transition-colors \$\{theme === "dark" \? "text-zinc-300 hover:bg-\[#333537\]" : "text-zinc-700 hover:bg-\[#e1e5ea\]"\}`\}>\s*<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1\.5" className="opacity-70">[\s\S]*?<\/svg>\s*Kitaplık\s*<\/button>'
lib_btn_repl = r"""<button onClick={() => setIsLibraryOpen(true)} className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                Kitaplık
              </button>"""
text = re.sub(lib_btn_pattern, lib_btn_repl, text)

# New Notebook Button
nb_btn_pattern = r'<button className=\{`w-full flex items-center gap-3 py-2 px-3 rounded-full text-\[14px\] transition-colors \$\{theme === "dark" \? "text-zinc-300 hover:bg-\[#333537\]" : "text-zinc-700 hover:bg-\[#e1e5ea\]"\}`\}>\s*<Plus size=\{18\} className="opacity-70" \/>\s*Yeni not defteri\s*<\/button>'
nb_btn_repl = r"""<button onClick={async () => {
                 try {
                  const newSession = await chatCNRService.createSession(user.uid, "📓 Not Defteri");
                  setSessions([newSession, ...sessions]);
                  setActiveSessionId(newSession.id);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                 } catch (e) {
                  console.error(e);
                 }
               }} className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <Plus size={18} className="opacity-70" />
                Yeni not defteri
              </button>"""
text = re.sub(nb_btn_pattern, nb_btn_repl, text)

# Activity Button
act_btn_pattern = r'<button className=\{`w-full flex items-center gap-3 py-2 px-3 rounded-full text-\[14px\] transition-colors \$\{theme === "dark" \? "text-zinc-300 hover:bg-\[#333537\]" : "text-zinc-700 hover:bg-\[#e1e5ea\]"\}`\}>\s*<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1\.5" className="opacity-70">[\s\S]*?<\/svg>\s*Etkinlik\s*<\/button>'
act_btn_repl = r"""<button onClick={() => setIsActivityOpen(true)} className={`w-full flex items-center gap-3 py-2 px-3 rounded-full text-[14px] transition-colors ${theme === "dark" ? "text-zinc-300 hover:bg-[#333537]" : "text-zinc-700 hover:bg-[#e1e5ea]"}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Etkinlik
              </button>"""
text = re.sub(act_btn_pattern, act_btn_repl, text)

# 5. Apply Filters to sessions mapping
# `sessions.filter((s) => s && s.id).map((session, idx)`
filter_pattern = r'\{sessions\s*\.filter\(\(s\) => s && s\.id\)\s*\.map\(\(session,\s*idx\) => \('
filter_repl = r"""{sessions
                .filter((s) => s && s.id)
                .filter((s) => !searchQuery || (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())))
                .filter((s) => !imageFilter || (s.messages && s.messages.some(m => !!m.imageUrl)))
                .map((session, idx) => ("""
text = re.sub(filter_pattern, filter_repl, text)

# 6. Add Library and Activity Modals at the end (before `return` or in modals area)
modals = """
        {/* Activity Modal */}
        {isActivityOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-md border rounded-3xl p-6 shadow-2xl ${theme === "dark" ? "bg-[#1e1f20] border-zinc-700/50 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Activity size={20} className="text-blue-500" /> Etkinlik Özeti</h2>
                <button onClick={() => setIsActivityOpen(false)} className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}><X size={18} /></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-[#131314]" : "bg-zinc-50"} flex flex-col items-center justify-center`}>
                   <div className="text-3xl font-bold text-blue-500">{sessions.length}</div>
                   <div className="text-sm opacity-70 mt-1">Sohbet</div>
                </div>
                <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-[#131314]" : "bg-zinc-50"} flex flex-col items-center justify-center`}>
                   <div className="text-3xl font-bold text-purple-500">
                     {sessions.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0)}
                   </div>
                   <div className="text-sm opacity-70 mt-1">Toplam Mesaj</div>
                </div>
              </div>
              
              <div className={`text-sm p-4 rounded-xl ${theme === "dark" ? "bg-zinc-800/50" : "bg-blue-50 text-blue-800"}`}>
                <p>Chat_CNR deneyiminiz {user?.isPro ? "PRO" : "Standart"} seviyesinde devam ediyor. Günlük etkileşimleriniz gizlilik ve hız odaklı işlenmektedir.</p>
              </div>
            </div>
          </div>
        )}

        {/* Library Modal */}
        {isLibraryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-2xl h-[70vh] border rounded-3xl p-6 shadow-2xl flex flex-col ${theme === "dark" ? "bg-[#1e1f20] border-zinc-700/50 text-white" : "bg-white border-zinc-200 text-zinc-900"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-500"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> 
                  Kitaplık
                </h2>
                <button onClick={() => setIsLibraryOpen(false)} className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-zinc-800" : "hover:bg-zinc-100"}`}><X size={18} /></button>
              </div>
              
              <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 rounded-2xl ${theme === "dark" ? "bg-[#131314]" : "bg-zinc-50"}`}>
                 <Sparkles size={48} className="text-zinc-500 mb-4 opacity-50" />
                 <h3 className="text-lg font-medium mb-2">Kitaplığınız Yakında Burada!</h3>
                 <p className="text-sm opacity-70 max-w-sm">Favori sohbetlerinizi, koleksiyonlarınızı ve özel komut istemlerinizi tek bir yerde toplayabileceğiniz kitaplık modülü yakında aktif olacak.</p>
              </div>
            </div>
          </div>
        )}
"""

# Insert modals right before the final `</div>`
text = text.replace('{/* Delete Confirmation Modal */}', modals + '\n        {/* Delete Confirmation Modal */}')


with open("App.tsx", "w") as f:
    f.write(text)

print("App features updated")
