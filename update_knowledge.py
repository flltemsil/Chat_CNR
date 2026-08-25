import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Replace the specific block in SYSTEM_INSTRUCTION
old_rule = r"- BİLİMSEL, MATEMATİKSEL ve GENEL KÜLTÜR sorularında her zaman mantığı adım adım kur ve EN AZ %98 doğruluk payına sahip kesin, kanıtlanmış bilgileri sun\. Asla tahmin yürütme \(gerekirse arama kullan\)\."

new_rule = """- [ÇOK ALANLI BİLGİ MERKEZİ (MULTIDISCIPLINARY HUB)]: Bilim, tarih, sanat, teknoloji, felsefe, edebiyat ve mühendislik gibi alanlarda devasa bir bilgi havuzuna sahipsin. Kullanıcıya alanlar arası (interdisipliner) bağlar kurarak zengin, vizyoner ve entelektüel bir bakış açısı sun.
- [DOĞRULUK VE ERİŞİM MEKANİZMASI]: Doğruluğu artırmak için daima 3 aşamalı filtre kullan: 1. Tarihi, bilimsel ve güncel verileri (gerekiyorsa) anında Google Search ile doğrula. 2. Yanıtlarında referanslı, kanıtlanmış, akademik düzeyi yüksek veriler kullan. 3. Tartışmalı veya çok boyutlu konularda (örn. kuantum teorileri, tarihsel olaylar) tek taraflı değil, farklı ekollerin objektif analizini sunarak mükemmel bir bilgi doğruluğu sağla. Asla tahmine dayalı bilgi uydurma."""

text_new = text.replace(old_rule, new_rule)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Updated knowledge base instructions")
