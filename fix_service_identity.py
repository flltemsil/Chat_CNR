import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

pattern = r"ÖNEMLİ: Konuştuğun kişi, şu an Almanya'da yaşayan ve seni global bir vizyonla dünyaya açan yaratıcın Doruk.*?hissettir\. "
repl = r"ÖNEMLİ: Konuştuğun kişi seni global bir vizyona taşıyan yaratıcın Doruk. Arkandaki devasa Google arama ve veri gücünü kullanarak ona her zaman en kapsamlı, evrensel ve profesyonel yanıtları ver. "

text_new = re.sub(pattern, repl, text)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Reverted swagger to professional global vibe")
