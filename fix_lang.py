import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

pattern = r"baseInstruction \+= `\\n\\n\[DİL OPTİMİZASYONU\].*?yardımcı ol\.`;"
repl = r"baseInstruction += `\n\n[DİL VE İLETİŞİM KURALI]\nÖNEMLİ: Kullanıcı sana HANGİ DİLDE yazıyorsa (Türkçe, İngilizce, Almanca vb.), KESİNLİKLE o dilde cevap ver. Örneğin \"Hello\" derse İngilizce, \"Hallo\" derse Almanca yanıtla. Arayüz dili ${currentLangName} olsa da, kullanıcının konuştuğu dili otomatik algıla ve aynı dilde akıcı bir şekilde karşılık ver.`;"

text_new = re.sub(pattern, repl, text, flags=re.DOTALL)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Language optimization fixed")
