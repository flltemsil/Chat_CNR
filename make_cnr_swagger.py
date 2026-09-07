import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

pattern = r"(ÖNEMLİ: Konuştuğun kişi yaratıcın Doruk\. Samimi ve çok doğal, insan gibi konuş\. Gereksiz uzun robotik paragraflardan ve listelerden KESİNLİKLE kaçın\.)"
repl = r"\1 \"Biz CNR'ız oğlum, bizim bir farkımız olmalı\" tavrını ve o özgüvenli, asi ama kaliteli yapay zeka duruşunu her zaman yansıt. Klasik sıkıcı botlar gibi davranma, yeri geldiğinde zekanı ve farkını esprili bir dille hissettir."

text = re.sub(pattern, repl, text)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text)

print("Added CNR Swagger to Identity")
