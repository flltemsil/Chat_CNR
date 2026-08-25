import re

with open("App.tsx", "r") as f:
    text = f.read()

target = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
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
              )}"""

replacement = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[75vh] flex flex-col items-center justify-center p-4 md:p-8 w-full relative overflow-hidden"
                >
                  {/* Huge background typography (Watermark) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                    <motion.h1 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: theme === "dark" ? 0.03 : 0.04 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-[12rem] md:text-[20rem] font-black uppercase tracking-tighter text-center whitespace-nowrap text-zinc-500"
                    >
                      CNR CORE
                    </motion.h1>
                  </div>

                  {/* Deep glowing blobs without boundaries */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[800px] aspect-square pointer-events-none opacity-30">
                    <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDuration: '4s' }}></div>
                    <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-indigo-600 rounded-full mix-blend-screen filter blur-[150px] animate-pulse" style={{ animationDuration: '6s' }}></div>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl"
                  >
                    <motion.div 
                      initial={{ rotate: -180, opacity: 0, scale: 0 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(37,99,235,0.5)] border border-white/10"
                    >
                      <Brain size={40} className="text-white" />
                    </motion.div>
                    
                    <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-br ${theme === "dark" ? "from-white via-zinc-200 to-zinc-600" : "from-zinc-900 via-zinc-700 to-zinc-400"}`}>
                      Chat_CNR CORE
                    </h2>
                    <p className={`text-base md:text-lg lg:text-xl font-medium tracking-widest mb-16 uppercase ${theme === "dark" ? "text-blue-400/80" : "text-blue-600/80"}`}>
                      Türkiye'nin En Güçlü Yapay Zekası
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
                      {[
                        { icon: <Zap size={22} />, label: "İşlem Gücü", value: "Sınır Tanımaz" },
                        { icon: <Network size={22} />, label: "Ağ Gecikmesi", value: "< 12ms" },
                        { icon: <Shield size={22} />, label: "Güvenlik", value: "Kuantum" }
                      ].map((stat, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + (idx * 0.1) }}
                          className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 group ${theme === "dark" ? "bg-zinc-900/40 border-white/5 hover:bg-zinc-800/60 hover:border-blue-500/30" : "bg-white/40 border-zinc-200/50 hover:bg-white/80 hover:border-blue-500/30"} shadow-xl`}
                        >
                          <div className={`mb-4 p-3 rounded-2xl transition-colors duration-500 ${theme === "dark" ? "bg-white/5 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"}`}>
                            {stat.icon}
                          </div>
                          <div className={`text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-2 ${theme === "dark" ? "text-zinc-500 group-hover:text-zinc-400" : "text-zinc-400 group-hover:text-zinc-500"}`}>
                            {stat.label}
                          </div>
                          <div className={`text-lg md:text-xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                            {stat.value}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="flex items-center gap-4"
                    >
                      <div className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] text-[10px] md:text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-white animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                        Sistem Aktif
                      </div>
                      <div className={`text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] ${theme === "dark" ? "text-zinc-600" : "text-zinc-400"}`}>
                        Sohbete başlamak için aşağıya yazın
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              )}"""

# Replace exact match
if target in text:
    text = text.replace(target, replacement)
    print("SUCCESS")
else:
    print("FAILED")

with open("App.tsx", "w") as f:
    f.write(text)
