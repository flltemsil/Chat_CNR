import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Update the empty state greeting
empty_state_target = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
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
                        Merhaba{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
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

empty_state_replacement = """              {(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-end w-full max-w-3xl mx-auto pb-4"
                >
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`text-3xl md:text-4xl lg:text-[44px] font-medium tracking-tight text-center ${theme === "dark" ? "text-[#e3e3e3]" : "text-[#1f1f1f]"}`}
                  >
                    Nereden başlayalım?
                  </motion.h1>
                </motion.div>
              )}"""
if empty_state_target in text:
    text = text.replace(empty_state_target, empty_state_replacement)

# 2. Main content container classes to handle centering when empty
main_content_pattern = r'<main\s+className=\{`flex-1 overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-8 py-8 space-y-8 bg-transparent`\}\s*>'
main_content_replacement = r'<main className={`overflow-y-auto custom-scrollbar relative z-10 px-4 md:px-8 ${(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) ? "flex-1 flex flex-col justify-end pb-8" : "flex-1 py-8 space-y-8"} bg-transparent`}>'
text = re.sub(main_content_pattern, main_content_replacement, text)

# 3. Footer classes to handle centering when empty
footer_pattern = r'<footer\s+className=\{`px-4 py-4 md:p-6 pb-\[calc\(env\(safe-area-inset-bottom,0\)\+16px\)\] border-t transition-colors duration-500 \$\{theme === "dark" \? "bg-\[#1e1f20\]\/95 backdrop-blur-2xl border-zinc-800\/40 shadow-\[0_-20px_50px_rgba\(0,0,0,0\.5\)\]" : "bg-white border-zinc-100"\}`\}\s*>'
footer_replacement = r'<footer className={`px-4 md:px-8 transition-colors duration-500 ${(!activeSession || (activeSession.messages && activeSession.messages.length === 0)) ? "pb-[20vh] border-transparent" : "py-4 md:py-6 pb-[calc(env(safe-area-inset-bottom,0)+16px)] border-t"} ${theme === "dark" ? ((!activeSession || (activeSession.messages && activeSession.messages.length === 0)) ? "bg-transparent border-transparent" : "bg-[#131314] border-zinc-800/40") : "bg-white border-zinc-100"}`}>\n'
text = re.sub(footer_pattern, footer_replacement, text)

# 4. Input box styling (Pill shape, +, Flash selector)
input_container_pattern = r'<div className=\{`flex-1 border-2 rounded-3xl p-2 md:p-3 flex flex-col transition-all duration-500 shadow-inner relative overflow-hidden group \$\{\s*theme === "dark"\s*\? "bg-\[#0a0a0a\] border-zinc-800\/80 focus-within:border-blue-600\/30 focus-within:shadow-\[0_0_60px_rgba\(37,99,235,0\.05\)\]"\s*: "bg-zinc-50 border-zinc-200 focus-within:border-blue-500\/20"\s*\}\`\}>'
input_container_replacement = r'<div className={`flex-1 rounded-[32px] p-2 md:p-3 flex flex-col transition-all relative overflow-hidden border ${theme === "dark" ? "bg-[#1e1f20] border-zinc-700/50" : "bg-[#f0f4f9] border-transparent"}`}>'
text = re.sub(input_container_pattern, input_container_replacement, text)

# Replace the toolbar inside input box
toolbar_pattern = r'<div className="flex items-center justify-between mt-1 md:mt-2 px-1">[\s\S]*?<div className="flex items-center gap-1">\s*<button\s+type="button"\s+onClick=\{toggleRecording\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>'

toolbar_replacement = """<div className="flex items-center justify-between mt-1 md:mt-2 px-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${theme === "dark" ? "text-zinc-400 hover:bg-[#333537] hover:text-zinc-200" : "text-zinc-500 hover:bg-[#e1e5ea] hover:text-zinc-800"}`}
                        title="Dosya veya Görsel Ekle"
                      >
                        <Plus size={22} strokeWidth={1.5} />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-full flex items-center gap-1 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-[#333537]" : "hover:bg-[#e1e5ea]"}`}>
                        <span className={`text-[13px] font-medium ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Flash</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 ${
                          isRecording
                            ? "bg-red-500/10 text-red-500 animate-pulse"
                            : theme === "dark"
                              ? "text-zinc-400 hover:bg-[#333537] hover:text-zinc-200"
                              : "text-zinc-500 hover:bg-[#e1e5ea] hover:text-zinc-800"
                        }`}
                      >
                        {isRecording ? <Mic size={20} strokeWidth={1.5} /> : <Mic size={20} strokeWidth={1.5} />}
                      </button>
                      <button
                        type="submit"
                        disabled={
                          !activeSession ||
                          (!input.trim() && !selectedImage) ||
                          isLoading
                        }
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:scale-100 active:scale-95 ${
                          input.trim() || selectedImage
                            ? (theme === "dark" ? "bg-white text-zinc-900" : "bg-[#1a73e8] text-white")
                            : "bg-transparent text-zinc-500"
                        }`}
                      >
                        <Send size={18} strokeWidth={2} className={(input.trim() || selectedImage) ? "ml-0.5" : ""} />
                      </button>
                    </div>
                  </div>"""

text = re.sub(toolbar_pattern, toolbar_replacement, text)

# Textarea Placeholder
text = text.replace('placeholder={t.typeMessage}', 'placeholder={"Chat_CNR\'a sorun"}')
text = text.replace('className={`w-full bg-transparent resize-none outline-none custom-scrollbar text-[15px] max-h-32 min-h-[44px] px-2', 'className={`w-full bg-transparent resize-none outline-none custom-scrollbar text-[16px] max-h-32 min-h-[24px] px-3')


with open("App.tsx", "w") as f:
    f.write(text)
print("SUCCESS")
