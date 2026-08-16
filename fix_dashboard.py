with open("App.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if ") : (" in line and "h-[70vh]" in lines[i+1]:
        start_idx = i + 1
        break

end_idx = start_idx
for i in range(start_idx, len(lines)):
    if "              )}" in lines[i]:
        end_idx = i
        break

dashboard_ui = """                <motion.div 
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
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(37,99,235,0.4)]"
                      >
                        <Brain size={44} className="text-white" />
                      </motion.div>
                      
                      <h2 className={`text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r ${theme === "dark" ? "from-white to-zinc-500" : "from-zinc-900 to-zinc-500"}`}>
                        Chat_CNR CORE
                      </h2>
                      <p className={`text-lg md:text-xl max-w-2xl font-medium tracking-tight mb-12 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
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
                      
                      <div className="mt-12">
                        <button 
                          onClick={() => {
                            const newBtn = document.getElementById('new-chat-btn');
                            if(newBtn) newBtn.click();
                          }}
                          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold tracking-widest uppercase text-sm shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95"
                        >
                          Sistemi Başlat
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
"""

new_lines = lines[:start_idx] + [dashboard_ui] + lines[end_idx:]

with open("App.tsx", "w") as f:
    f.writelines(new_lines)
