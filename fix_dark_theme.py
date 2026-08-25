import re

with open("App.tsx", "r") as f:
    text = f.read()

# 1. Update Sidebar Background to true black
# `bg-[#1e1f20] border-zinc-800/80` to `bg-[#09090b] border-[#1e1e1e]`
text = text.replace('bg-[#1e1f20] border-zinc-800/80', 'bg-[#09090b] border-[#1e1e1e]')

# 2. Update Main Container Background to true black
# `<div className={`flex-1 flex min-w-0 relative overflow-hidden ${theme === "dark" ? "bg-[#131314]" : "bg-zinc-50"}`}>`
# Change `#131314` to `#000000`
text = text.replace('bg-[#131314]" : "bg-zinc-50"', 'bg-[#000000]" : "bg-zinc-50"')

# 3. Add beautiful subtle glow in the Main Container for dark mode
glow_html = """{/* Main Content Split Container */}
      <div className={`flex-1 flex min-w-0 relative overflow-hidden ${theme === "dark" ? "bg-[#000000]" : "bg-white"}`}>
        
        {theme === "dark" && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
             <div className="w-[100vw] h-[100vw] max-w-[1200px] max-h-[1200px] bg-[radial-gradient(circle,_rgba(24,30,60,0.8)_0%,_rgba(0,0,0,0)_60%)] rounded-full blur-[100px] opacity-70"></div>
          </div>
        )}"""
text = text.replace('{/* Main Content Split Container */}\n      <div className={`flex-1 flex min-w-0 relative overflow-hidden ${theme === "dark" ? "bg-[#000000]" : "bg-zinc-50"}`}>', glow_html)

# 4. Input Box styling
pattern_input = r'<div\s+className=\{`flex-1 border-2 rounded-3xl p-2 md:p-3 flex flex-col transition-all duration-500 shadow-inner relative overflow-hidden group \$\{\s*theme === "dark"\s*\? "bg-\[#131314\] border-zinc-800\/80 focus-within:border-blue-600\/30 focus-within:shadow-\[0_0_60px_rgba\(37,99,235,0\.05\)\]"\s*: "bg-zinc-50 border-zinc-200 focus-within:border-blue-500\/20"\s*\}\`\}>'
repl_input = r'<div className={`flex-1 rounded-[32px] p-2 md:p-3 flex flex-col transition-all duration-500 relative overflow-hidden border ${theme === "dark" ? "bg-[#131314] border-zinc-800/60 focus-within:bg-[#1e1f20]" : "bg-[#f0f4f9] border-transparent"}`}>'
text = re.sub(pattern_input, repl_input, text)

# 5. Header fixing
# Make header transparent if it is dark mode and no messages
text = text.replace('bg-[#131314]" : "bg-white"', 'bg-transparent" : "bg-white"')

with open("App.tsx", "w") as f:
    f.write(text)

