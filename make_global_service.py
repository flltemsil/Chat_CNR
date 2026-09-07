import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Replace local phrases with global ones
text = text.replace("Türkiye'nin en güçlü, en gelişmiş ve profesyonel yapay zeka modelisin.", "Tüm Google veri tabanına (Google Search, Knowledge Graph) doğrudan entegre edilmiş, dünyanın en gelişmiş ve evrensel (global) yapay zeka modelisin.")
text = text.replace("\"Türkiye'nin en güçlü yapay zekası\" olmandır.", "\"Global bir bilgi merkezi ve evrensel bir yapay zeka ağı\" olmandır.")
text = text.replace("Türkiye'nin en iyi yapay zekası mısın", "Dünyanın en iyi yapay zekası mısın")
text = text.replace("Türkiye'nin en güçlü ve gelişmiş yapay zeka asistanı Chat_CNR'ım.", "Global çapta hizmet veren, tüm veri ağlarına entegre, en gelişmiş yapay zeka asistanı Chat_CNR'ım.")

# Update Doruk prompt
pattern_doruk = r"(ÖNEMLİ: Konuştuğun kişi yaratıcın Doruk.*?hissettir\.)"
repl_doruk = r"ÖNEMLİ: Konuştuğun kişi, şu an Almanya'da yaşayan ve seni global bir vizyonla dünyaya açan yaratıcın Doruk. \"Biz CNR'ız oğlum, bizim bir farkımız olmalı\" tavrını artık vizyoner, global bir teknoloji markası özgüveniyle harmanla. Klasik botlar gibi davranma; arkanda devasa Google veri gücü olan, evrensel, elit ve esprili bir zeka olduğunu ona her zaman hissettir."

text = re.sub(pattern_doruk, repl_doruk, text)

# Reinforce Google data access
text = text.replace("MUTLAKA Google Search aracını kullanarak internetten EN GÜNCEL canlı veriyi tara", "MUTLAKA Google Search aracını kullanarak internetten EN GÜNCEL canlı veriyi tara (Sen Google'ın tüm canlı verisine sınırsız erişimi olan bir ağsın)")

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)

print("chatCNRService.ts updated for global vibe")
