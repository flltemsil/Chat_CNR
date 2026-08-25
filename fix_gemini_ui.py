import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Update lucide-react imports to add Compass, Lightbulb, PenTool, Code
import_pattern = r"import \{\n(.*?)\n\} from \"lucide-react\";"
match = re.search(import_pattern, text, re.DOTALL)
if match:
    imports = match.group(1)
    if "Compass" not in imports:
        new_imports = imports + "\n  Compass,\n  Lightbulb,\n  PenTool,\n  Code,"
        text = text.replace(imports, new_imports)

# 2. Replace the empty state UI
target = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
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

replacement = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-[75vh] flex flex-col justify-center p-4 md:p-8 w-full max-w-4xl mx-auto"
                >
                  <div className="flex flex-col mb-12 md:mb-16">
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight mb-2"
                    >
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570]">
                        Merhaba{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
                      </span>
                    </motion.h1>
                    <motion.h2 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className={`text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight ${theme === "dark" ? "text-[#444746]" : "text-[#c4c7c5]"}`}
                    >
                      Bugün size nasıl yardımcı olabilirim?
                    </motion.h2>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full"
                  >
                    {[
                      { icon: <Compass size={22} strokeWidth={1.5} />, text: "Görmediğim yerler için seyahat planı oluştur", action: "Görmediğim yerler için bana 3 günlük bir seyahat planı oluştur." },
                      { icon: <Lightbulb size={22} strokeWidth={1.5} />, text: "Karmaşık bir konuyu basitçe açıkla", action: "Kuantum bilgisayarları 5 yaşındaki bir çocuğa anlatır gibi anlat." },
                      { icon: <PenTool size={22} strokeWidth={1.5} />, text: "İş görüşmesi için e-posta yaz", action: "İş görüşmesi sonrasında İK yöneticisine gönderilecek profesyonel bir teşekkür e-postası taslağı yaz." },
                      { icon: <Code size={22} strokeWidth={1.5} />, text: "React uygulamasında optimizasyon", action: "React uygulamalarında performansı artırmak için kullanılabilecek en iyi 5 yöntemi açıkla." }
                    ].map((suggestion, idx) => (
                      <div 
                        key={idx}
                        onClick={() => { setInput(suggestion.action); document.querySelector('textarea')?.focus(); }}
                        className={`flex flex-col justify-between p-5 h-48 rounded-2xl cursor-pointer transition-all duration-300 ${theme === "dark" ? "bg-[#1e1f20] hover:bg-[#2a2b2f] text-zinc-200" : "bg-[#f0f4f9] hover:bg-[#e1e5ea] text-zinc-800"}`}
                      >
                        <div className={`text-[15px] font-medium leading-snug`}>
                          {suggestion.text}
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mt-4 ${theme === "dark" ? "bg-[#131314] text-zinc-300" : "bg-white text-zinc-700"} shadow-sm`}>
                          {suggestion.icon}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              )}"""

if target in text:
    text = text.replace(target, replacement)
    print("SUCCESS")
else:
    print("FAILED")

with open("App.tsx", "w") as f:
    f.write(text)
