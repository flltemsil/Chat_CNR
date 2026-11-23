# CNR

Bu proje, web ve yerel uygulama (masaüstü/mobil) olarak çalışabilen CNR yapay zekâ asistanıdır. Modern web teknolojileriyle geliştirilmiş; sohbet, sesli yanıt, görsel analiz ve tema seçenekleri sunar.

## 🛡️ Güvenlik ve Bütünlük (Full Protection Mode)
Bu uygulama, izinsiz kod değişikliklerine ve telif hakkı ihlallerine karşı **Tam Koruma Modu** ile korunmaktadır. 
- **Checksum Kontrolü:** Kritik dosyalardaki değişiklikler algılandığında sistem kendini kilitler.
- **Sahip Doğrulaması:** Sadece yetkili e-posta adresi (``) üzerinden tam erişim sağlanır.
- **Master Key:** Olası kilitlenmelerde `CNR_2026_SECURE` anahtarı ile sistem tekrar aktif edilebilir.

## 🚀 Özellikler
- **Yüksek Performanslı AI Altyapısı:** En güncel ve stabil yapay zeka modeli ile akıllı yanıtlar.
- **Sesli Yanıt (TTS):** Yapay zeka cevaplarını sesli olarak dinleyebilme.
- **Görsel Analiz:** Fotoğraf yükleyerek yapay zekaya analiz ettirme.
- **Karanlık/Aydınlık Tema:** Göz dostu arayüz seçenekleri.

## 🛠️ Kurulum (Geliştiriciler İçin)

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/kullanici-adiniz/Chat_CNR.git
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun ve API anahtarınızı ekleyin:
   ```env
   CHAT_CNR_API_KEY=your_api_key_here
   ```
4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

---
**Ürün:** CNR  
**Sürüm:** 1.0.0 (2026)
