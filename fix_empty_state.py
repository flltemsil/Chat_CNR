import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'<motion\.div initial=\{\{ opacity: 0 \}\} animate=\{\{ opacity: 1 \}\} className="min-h-\[70vh\] flex flex-col items-center justify-center p-4 md:p-8 w-full">[\s\S]*?<\/motion\.div>\s*<\/motion\.div>'

replacement = """<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col justify-center min-h-[50vh] w-full max-w-4xl mx-auto pb-4">
                  <div className="flex flex-col mb-12 md:mb-16 self-start w-full px-4">
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
                  </div>
                </motion.div>"""

new_text = re.sub(pattern, replacement, text)

with open("App.tsx", "w") as f:
    f.write(new_text)

print("Restored original main empty state")
