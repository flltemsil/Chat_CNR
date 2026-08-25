import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'<motion\.h1\s+initial=\{\{\s*opacity:\s*0,\s*y:\s*10\s*\}\}\s*animate=\{\{\s*opacity:\s*1,\s*y:\s*0\s*\}\}\s*transition=\{\{\s*duration:\s*0\.5\s*\}\}\s*className=\{`text-3xl md:text-4xl lg:text-\[44px\] font-medium tracking-tight text-center \$\{theme === "dark" \? "text-\[#e3e3e3\]" : "text-\[#1f1f1f\]"\}`\}\s*>\s*Nereden başlayalım\?\s*<\/motion\.h1>'

repl = """<div className="flex flex-col mb-12 md:mb-16 self-start w-full px-4">
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
                      Nereden başlayalım?
                    </motion.h2>
                  </div>"""

text = re.sub(pattern, repl, text)

# Align the container to top/center instead of flex-end so it mimics the previous layout
pattern_container = r'<motion\.div\s+initial=\{\{\s*opacity:\s*0\s*\}\}\s*animate=\{\{\s*opacity:\s*1\s*\}\}\s*className="flex flex-col items-center justify-end w-full max-w-3xl mx-auto pb-4"\s*>'
repl_container = r'<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col justify-center min-h-[50vh] w-full max-w-4xl mx-auto pb-4">'
text = re.sub(pattern_container, repl_container, text)

with open("App.tsx", "w") as f:
    f.write(text)

print("Updated greeting")
