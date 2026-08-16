with open("App.tsx", "r") as f:
    text = f.read()

text = text.replace('                  <div className="space-y-2">\n                    {activeSession.messages &&', '                  <div className="space-y-2">\n                    <AnimatePresence mode="popLayout">\n                      {activeSession.messages &&')

text = text.replace('                        />\n                      ))}\n                  </div>', '                        />\n                      ))}\n                    </AnimatePresence>\n                  </div>')

with open("App.tsx", "w") as f:
    f.write(text)
