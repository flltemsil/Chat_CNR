import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r"""(<div className="flex items-center gap-1">)
(\s*<button
\s*type="button"
\s*onClick=\{([^}]+)\}
\s*className=\{`w-9 h-9[^`]+`\}
\s*title="Dosya veya Görsel Ekle"
\s*>
\s*<Plus size=\{22\} strokeWidth=\{1\.5\} />
\s*</button>
\s*<input
\s*type="file"
\s*ref=\{fileInputRef\}
\s*onChange=\{handleImageSelect\}
\s*accept="image/\*"
\s*className="hidden"
\s*/>)"""

repl = r"""\1
\2
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${theme === "dark" ? "text-zinc-400 hover:bg-[#333537] hover:text-zinc-200" : "text-zinc-500 hover:bg-[#e1e5ea] hover:text-zinc-800"}`}
                        title="Kamera ile Fotoğraf Çek"
                      >
                        <Camera size={20} strokeWidth={1.5} />
                      </button>"""

text_new = re.sub(pattern, repl, text)

with open("App.tsx", "w") as f:
    f.write(text_new)

print("Camera button added")
