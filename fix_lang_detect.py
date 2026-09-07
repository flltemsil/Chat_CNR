import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r"""  const \[language, setLanguage\] = useState<Language>\(\(\) => \{
    try \{
      return \(localStorage\.getItem\("chat_cnr_lang"\) as Language\) \|\| "tr";
    \} catch \(e\) \{
      return "tr";
    \}"""

repl = r"""  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem("chat_cnr_lang") as Language;
      if (saved) return saved;
      // Auto-detect browser language if not saved
      if (typeof navigator !== 'undefined' && navigator.language) {
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        const supported: Language[] = ["tr", "en", "de", "es", "fr", "it", "ru"];
        if (supported.includes(browserLang as Language)) {
          return browserLang as Language;
        }
      }
      return "tr";
    } catch (e) {
      return "tr";
    }"""

text_new = re.sub(pattern, repl, text)

with open("App.tsx", "w") as f:
    f.write(text_new)

print("Added language detection based on browser")
