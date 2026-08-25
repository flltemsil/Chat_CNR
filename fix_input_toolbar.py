import re

with open("App.tsx", "r") as f:
    text = f.read()

# Replace the toolbar inside input box
toolbar_pattern = r'<div className="flex items-center justify-between mt-1 md:mt-2 px-1">[\s\S]*?<div className="flex items-center gap-1">\s*<button\s+type="button"\s+onClick=\{toggleRecording\}[\s\S]*?<\/button>\s*<\/div>\s*<\/div>'

toolbar_replacement = """<div className="flex items-center justify-between mt-1 md:mt-2 px-1">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${theme === "dark" ? "text-zinc-400 hover:bg-[#333537] hover:text-zinc-200" : "text-zinc-500 hover:bg-[#e1e5ea] hover:text-zinc-800"}`}
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
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:scale-100 active:scale-95 ${
                          input.trim() || selectedImage
                            ? (theme === "dark" ? "bg-white text-zinc-900" : "bg-[#1a73e8] text-white")
                            : "bg-transparent text-zinc-500"
                        }`}
                      >
                        <Send size={18} strokeWidth={2} className={(input.trim() || selectedImage) ? "ml-0.5" : ""} />
                      </button>
                    </div>
                  </div>"""

if '<div className="flex items-center gap-1">\s*<button\s+type="button"\s+onClick=\{toggleRecording\}' in text or '<form onSubmit={handleSend}' in text:
    text = re.sub(toolbar_pattern, toolbar_replacement, text)

# Textarea Placeholder
text = text.replace('placeholder={t.typeMessage}', 'placeholder={"Chat_CNR\'a sorun"}')
text = text.replace('className={`w-full bg-transparent resize-none outline-none custom-scrollbar text-[15px] max-h-32 min-h-[44px] px-2', 'className={`w-full bg-transparent resize-none outline-none custom-scrollbar text-[16px] max-h-32 min-h-[24px] px-3')

with open("App.tsx", "w") as f:
    f.write(text)

