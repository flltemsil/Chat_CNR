with open("App.tsx", "r") as f:
    text = f.read()

target = """              <div className="flex items-baseline gap-3">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  Chat_CNR
                </h1>
                <span className="text-sm font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  1.0 Edition
                </span>
              </div>"""

replacement = """              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                  Chat_CNR
                </h1>
                <span className="text-xs font-bold text-blue-400 border border-blue-400/30 bg-blue-400/10 px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(96,165,250,0.3)]">
                  Turkey's Strongest
                </span>
              </div>"""

text = text.replace(target, replacement)

with open("App.tsx", "w") as f:
    f.write(text)
