import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r'<div className="space-y-\[2px\]">\s*<AnimatePresence mode="popLayout">'
replacement = r'<div className="space-y-[2px]">\s*<AnimatePresence mode="popLayout">'

if '<div className="space-y-[2px]">\n            <AnimatePresence mode="popLayout">' in text:
    print("Found space-y-[2px]")
    # We opened `<div className="space-y-[2px]">` but where does it close?
    # It probably closes right before `</AnimatePresence>`
    
    pattern2 = r'<\/AnimatePresence>\s*<\/div>\s*<div className="mt-2 mb-2">'
    repl2 = r'</AnimatePresence>\n            </div>\n            </div>\n            \n            <div className="mt-2 mb-2">'
    
    text = re.sub(pattern2, repl2, text)

with open("App.tsx", "w") as f:
    f.write(text)

