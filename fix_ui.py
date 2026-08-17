import re

with open("App.tsx", "r") as f:
    text = f.read()

# Remove the monitor button.
# There is a button with `title="Ana Ekran / Arka Plana At"`
pattern_monitor = r"\{activeSession && \(\s*<button\s+onClick=\{\(\) => setActiveSessionId\(null\)\}\s+className=\{`p-2 rounded-lg transition-all border \$\{theme === \"dark\" \? \"bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white\" : \"bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900\"\}`\}\s+title=\"Ana Ekran \/ Arka Plana At\"\s*>\s*<Monitor size=\{16\} \/>\s*<\/button>\s*\)\}"
text = re.sub(pattern_monitor, "", text)

# Now, we extract the inside of `<main ...> ... </main>` and replace it.
# Actually, I'll just use the old `Chat_CNR CORE` block as the empty state.
# Let's find the main section.

start_marker = '<main\n            className={`flex-1 overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-8 py-8 space-y-8 bg-transparent`}\n          >\n            <div className="max-w-4xl mx-auto w-full">'
end_marker = '              <div ref={messagesEndRef} className="h-12" />\n            </div>\n          </main>'

if start_marker in text and end_marker in text:
    before = text.split(start_marker)[0]
    after = text.split(end_marker)[1]
    
    new_main_content = """
              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[70vh] flex flex-col items-center justify-center p-4 md:p-8 w-full"
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full max-w-4xl rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden border shadow-2xl ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800/50" : "bg-white/50 border-zinc-200/50"}`}
                  >
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
                      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
                      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
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
                        Chat_CNR CORE
                      </h2>
                      <p className={`text-sm md:text-base max-w-xl font-medium tracking-wide mb-10 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                        TÜRKİYE'NİN EN GÜÇLÜ YAPAY ZEKASI
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
                            <div className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                              {stat.value}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="mt-8 flex items-center gap-3">
                        <div className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] text-xs uppercase tracking-widest flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          Sistem Aktif
                        </div>
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          Sohbete başlamak için aşağıya yazın
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeSession && activeSession.messages && activeSession.messages.length > 0 && (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {activeSession.messages.map((msg, idx) => (
                      <MessageItem
                        key={msg.id}
                        message={msg}
                        themeColor="blue"
                        appearance={theme}
                        language={language}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {streamingMessage && (
                <MessageItem
                  key={streamingMessage.id}
                  message={{
                    id: streamingMessage.id,
                    role: "model",
                    text: streamingMessage.text,
                    sources: streamingMessage.sources,
                    timestamp: new Date(),
                  }}
                  themeColor="blue"
                  appearance={theme}
                  isStreaming={true}
                  language={language}
                />
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-2xl flex flex-col items-center gap-4 border ${theme === "dark" ? "bg-red-500/5 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
                >
                  <div className="flex items-center gap-3 text-sm font-medium w-full">
                    <AlertTriangle size={20} className="shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold uppercase tracking-widest text-[10px] mb-1">
                        {t.errorNotification}
                      </p>
                      <span className="opacity-90">{error}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setError(null);
                      handleSend(undefined, lastSentMessageRef.current);
                    }}
                    className="self-end px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition-all text-xs border border-red-500/30 uppercase tracking-widest"
                  >
                    {t.reconnect}
                  </button>
                </motion.div>
              )}
"""

    text = before + start_marker + new_main_content + end_marker + after
    with open("App.tsx", "w") as f:
        f.write(text)
    print("UI replaced.")
else:
    print("Could not find start/end markers.")
