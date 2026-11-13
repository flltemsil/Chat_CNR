# Chat_CNR

Chat_CNR, Doruk Ali Arslan tarafından geliştirilen çok dilli bir yapay zekâ sohbet uygulamasıdır. Bu depo; web arayüzünü, API katmanını, Firebase entegrasyonunu ve yardımcı servisleri içerir.

## Mevcut özellikler

- React + TypeScript tabanlı web arayüzü
- Firebase Authentication ve Firestore entegrasyonu
- Sohbet geçmişi ve paylaşılan sohbet bağlantıları
- Metin ve görsel destekli sohbet akışı
- Ayrı uzun sohbet, rol yapma ve görsel üretim yapılandırmaları
- Google GenAI sağlayıcısı üzerinden model erişimi

> Model sağlayıcısı ve model sürümü dağıtım yapılandırmasına bağlıdır. Chat_CNR uygulama ve ürün markasıdır; kullanılan temel modelin kaynağı teknik olarak doğru şekilde belirtilmelidir.

## Geliştirme

Gereksinimler: Node.js 20+ ve npm.

```bash
npm install
npm run dev
```

Üretim derlemesi ve TypeScript kontrolü:

```bash
npm run lint
npm run build
```

## Sunucu ortam değişkenleri

Aşağıdaki değerleri yalnızca sunucu ortamında (ör. Vercel Project Settings → Environment Variables) tanımlayın:

- `CHAT_CNR_API_KEY` — genel sohbet/arama sağlayıcısı
- `LONG_CHAT_API_KEY` — uzun sohbet için ayrılmış anahtar
- `RP_MODE_API_KEY` — rol yapma modu için ayrılmış anahtar
- `PICTURE_AI` — görsel üretimi için ayrılmış anahtar

Gerçek anahtarları kaynak koda, README dosyalarına, ekran görüntülerine veya istemci tarafı `.env` dosyalarına koymayın. Daha önce herkese açık bir depoya eklenmiş gerçek bir anahtar varsa sağlayıcı panelinden iptal edip yenileyin.

Firebase web yapılandırmasındaki istemci API anahtarı tek başına sunucu sırrı değildir. Firebase Authentication, yetkilendirme kuralları ve API/domain kısıtlamalarıyla korunmalıdır.

## Güvenlik

Firestore kuralları `firestore.rules` dosyasındadır. Kurallar artık varsayılan olarak erişimi reddeder ve kullanıcı verilerini UID üzerinden sınırlar. Yönetici yetkisi, değiştirilebilir profil alanlarından değil Firebase Auth custom claim (`admin: true`) üzerinden doğrulanır.

**Önemli geçiş notu:** Güvenli Firestore kurallarını canlı Firebase projesine uygulamadan önce aşağıdaki adımları tamamlayın:

1. Firebase Admin SDK kullanan güvenilir bir ortamdan kurucu hesabına `admin: true` custom claim atayın.
2. Kurucu hesabından çıkış yapıp tekrar giriş yaparak yeni ID token alın.
3. Yönetici paneli, kullanıcı profili oluşturma, kullanım sayaçları ve bildirim akışlarını test edin.
4. Firestore Emulator veya ayrı bir test Firebase projesinde kuralları doğrulayın.
5. Ancak testler başarılı olduktan sonra canlı projeye dağıtın.

Admin claim kurulumu için `docs/SECURITY_MIGRATION.md` dosyasını izleyin. Servis hesabı anahtarını asla GitHub'a yüklemeyin.

## Geliştirme ilkeleri

- Çalışan özellikler korunur; büyük değişiklikler ayrı branch ve Pull Request üzerinden yapılır.
- API anahtarları ve farklı kullanım amaçları birbirine karıştırılmaz.
- Kota aşımı, anahtar havuzunu gelişigüzel değiştirerek değil; limit yönetimi, önbellekleme, model yönlendirme ve sağlayıcıların kurallarına uygun yedekleme ile çözülür.
- Model yetenekleri ve performans iddiaları ölçüm ve kaynakla desteklenir.

## Lisans

Lisans bilgisi henüz tanımlanmamıştır. Depoyu veya içindeki kodu yeniden dağıtmadan önce sahibiyle iletişime geçin.
