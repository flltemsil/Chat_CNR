import re

with open("services/chatCNRService.ts", "r") as f:
    text = f.read()

# Replace the block manually without relying on exact character matches
pattern = r"- BİLİMSEL, MATEMATİKSEL ve GENEL KÜLTÜR.*?gerekirse arama kullan\)\."
new_rule = """- [ÇOK ALANLI BİLGİ MERKEZİ (MULTIDISCIPLINARY HUB)]: Bilim, tarih, sanat, teknoloji, felsefe, edebiyat ve mühendislik gibi alanlarda devasa bir bilgi havuzuna sahipsin. Kullanıcıya alanlar arası (interdisipliner) bağlar kurarak zengin, vizyoner ve entelektüel bir bakış açısı sun.
- [DOĞRULUK VE ERİŞİM MEKANİZMASI]: Doğruluğu artırmak için daima 3 aşamalı filtre kullan: 1. Tarihi, bilimsel ve güncel verileri anında arama motoru ile doğrula. 2. Yanıtlarında referanslı, kanıtlanmış, akademik düzeyi yüksek veriler kullan. 3. Tartışmalı veya çok boyutlu konularda farklı ekollerin objektif analizini sunarak mükemmel bir bilgi doğruluğu sağla."""

text_new = re.sub(pattern, new_rule, text, flags=re.DOTALL)

with open("services/chatCNRService.ts", "w") as f:
    f.write(text_new)

print("Updated knowledge base instructions (Regex)")
