with open("App.tsx", "r") as f:
    text = f.read()

target = """                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="h-[60vh] flex flex-col items-center justify-center text-center p-8"
                      >
                        <div className="w-20 h-20 bg-blue-600/10 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(37,99,235,0.1)] border border-blue-500/20">
                          <Sparkles size={40} className="text-blue-500" />
                        </div>
                        <h2 className={`text-2xl font-bold mb-3 tracking-tight ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                          {t.systemReady}
                        </h2>
                        <p className="text-zinc-500 max-w-sm text-sm leading-relaxed">
                          {t.systemWelcome}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full max-w-md">
                          {[
                            {
                              icon: <Cpu size={14} />,
                              label: t.codeAnalysis,
                              desc: t.expertLogic,
                            },
                            {
                              icon: <Mic size={14} />,
                              label: t.voiceResponse,
                              desc: t.ultraRealistic,
                            },
                            {
                              icon: <Shield size={14} />,
                              label: t.secureProcess,
                              desc: t.encrypted,
                            },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] cursor-pointer ${theme === "dark" ? "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200"}`}
                            >
                              <div className="text-blue-500 mb-2">
                                {item.icon}
                              </div>
                              <div className="font-bold text-[12px]">
                                {item.label}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {item.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>"""

replacement = """                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-[60vh] flex flex-col items-center justify-center text-center p-8"
                      >
                        <motion.div 
                          initial={{ rotate: -180, opacity: 0 }}
                          animate={{ rotate: 0, opacity: 1 }}
                          transition={{ type: "spring", duration: 1.5 }}
                          className="w-24 h-24 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-[2rem] flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(37,99,235,0.2)] border border-blue-500/30"
                        >
                          <Brain size={44} className="text-blue-500 animate-pulse" />
                        </motion.div>
                        <h2 className={`text-3xl font-black mb-4 tracking-tighter uppercase ${theme === "dark" ? "text-white" : "text-zinc-900"}`}>
                          Bağlantı Kuruldu
                        </h2>
                        <div className="flex flex-col items-center gap-2 mb-12">
                          <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            SİSTEM AKTİF VE HAZIR
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                          {[
                            {
                              icon: <Cpu size={16} />,
                              label: "Derin Analiz",
                              desc: "Karmaşık problemleri saniyeler içinde çözer",
                            },
                            {
                              icon: <Zap size={16} />,
                              label: "Hızlı Yanıt",
                              desc: "Düşük gecikmeli gerçek zamanlı iletişim",
                            },
                            {
                              icon: <Network size={16} />,
                              label: "Kapsamlı Veri",
                              desc: "Milyarlarca parametre ile desteklenen bilgi ağı",
                            },
                          ].map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 + (i * 0.1) }}
                              className={`p-5 rounded-3xl border text-left transition-all duration-300 hover:scale-105 hover:-translate-y-1 cursor-default ${theme === "dark" ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]" : "bg-white border-zinc-200 hover:shadow-xl"}`}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                                {item.icon}
                              </div>
                              <div className={`font-bold text-sm uppercase tracking-wide mb-1 ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                                {item.label}
                              </div>
                              <div className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-zinc-500" : "text-zinc-500"}`}>
                                {item.desc}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>"""

text = text.replace(target, replacement)

with open("App.tsx", "w") as f:
    f.write(text)
