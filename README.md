# Chat_CNR | Gelişmiş Yapay Zeka Bilgi Merkezi

Bu proje, **Doruk Ali Arslan** tarafından geliştirilmiş, yüksek doğruluklu ve çok fonksiyonlu bir yapay zeka bilgi merkezidir. Modern web teknolojileri ile inşa edilmiş olup, hem web hem de yerel uygulama (Desktop/Mobile) olarak çalışmaya uygundur.

## 🛡️ Güvenlik ve Bütünlük (Full Protection Mode)
Bu uygulama, izinsiz kod değişikliklerine ve telif hakkı ihlallerine karşı **Tam Koruma Modu** ile korunmaktadır. 
- **Checksum Kontrolü:** Kritik dosyalardaki değişiklikler algılandığında sistem kendini kilitler.
- **Sahip Doğrulaması:** Sadece yetkili e-posta adresi (`dorukaliarslan20@gmail.com`) üzerinden tam erişim sağlanır.
- **Master Key:** Olası kilitlenmelerde `CNR_2026_SECURE` anahtarı ile sistem tekrar aktif edilebilir.

## 🚀 Özellikler
- **Gemini 3.1 Pro Altyapısı:** En güncel yapay zeka modeli ile akıllı yanıtlar.
- **Sesli Yanıt (TTS):** Yapay zeka cevaplarını sesli olarak dinleyebilme.
- **Görsel Analiz:** Fotoğraf yükleyerek yapay zekaya analiz ettirme.
- **PWA Desteği:** Tarayıcı üzerinden uygulama olarak yüklenebilme.
- **Karanlık/Aydınlık Tema:** Göz dostu arayüz seçenekleri.

## 🛠️ Kurulum (Geliştiriciler İçin)

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/kullanici-adiniz/chat-cnr.git
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun ve Gemini API anahtarınızı ekleyin:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## 📦 Gerçek Uygulama Haline Getirme

### Masaüstü (Windows/Mac)
Electron kullanarak `.exe` veya `.app` dosyası oluşturmak için:
```bash
npm install -g electron
# Gerekli yapılandırmadan sonra
npm run build:desktop
```

### Mobil (Android/iOS)
Capacitor kullanarak paketlemek için:
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap open android
```

---
**Geliştirici:** Doruk Ali Arslan  
**Sürüm:** 1.0.0 (2026)
