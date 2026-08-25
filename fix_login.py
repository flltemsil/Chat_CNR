import re

with open("App.tsx", "r") as f:
    text = f.read()

pattern = r"""(\} else if \(err\.code === "auth/popup-blocked"\) \{\s*setLoginError\("Tarayıcınız giriş penceresini \(popup\) engelledi\. Lütfen adres çubuğundaki popup engelleyici uyarıya tıklayıp izin verin veya 'Mobil Giriş' butonunu kullanın\."\);\s*)(\})"""

repl = r"""\1} else if (err.code === "auth/network-request-failed") {
                      setLoginError("Bağlantı hatası veya güvenlik kısıtlaması (Iframe kaynaklı olabilir). Lütfen sağ üstteki 'Open in New Tab' simgesine tıklayarak uygulamayı YENİ SEKMEDE açıp tekrar deneyin.");
                    \2"""

text_new = re.sub(pattern, repl, text)

with open("App.tsx", "w") as f:
    f.write(text_new)

print("Added specific error message for auth/network-request-failed")
