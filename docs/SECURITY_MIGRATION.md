# Firestore güvenlik geçişi

Bu değişiklik güvenlik kurallarını varsayılan olarak kapalı hâle getirir. Canlı Firebase projesine doğrudan dağıtmayın; önce staging/test projesinde doğrulayın.

## 1. Kurucu yönetici claim'i

1. Firebase Console → Authentication bölümünden kurucu hesabının UID değerini alın.
2. Güvenilir ve özel bir makinede Firebase Admin SDK Application Default Credentials yapılandırın. Alternatif olarak servis hesabı kimlik bilgisini güvenli bir secret store üzerinden sağlayın.
3. Depoda olmayan yerel ortam değişkenlerini ayarlayın:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/service-account.json"
export ADMIN_UID="FIREBASE_AUTH_UID"
npm run admin:set-claim
```

Script mevcut custom claim'leri korur ve yalnızca belirtilen UID'ye `admin: true` ekler. JSON anahtar dosyasını depoya koymayın.

4. Kurucu kullanıcı oturumunu kapatıp tekrar açsın. ID token yenilenmelidir.

## 2. Test ve dağıtım

- Firebase Emulator veya staging projesinde `firestore.rules` dosyasını yükleyin.
- Kullanıcının başka bir kullanıcının profiline/sohbetine erişemediğini doğrulayın.
- Normal kullanıcının `role`, `isPro`, `proExpiresAt` alanlarını değiştiremediğini doğrulayın.
- Yönetici panelinin kullanıcıları listeleyebildiğini ve Pro yönetiminin çalıştığını doğrulayın.
- Sohbet oluşturma, mesaj yazma, paylaşım bağlantısı içe/dışa aktarma, sayaçlar ve bildirimleri test edin.
- Testler başarılı olmadan canlı Firestore kurallarını değiştirmeyin.

## 3. Geri dönüş

Canlıya geçişten önce mevcut kuralları Firebase Console'dan dışa aktarın ve saklayın. Dağıtım sonrası sorun çıkarsa önceki kurallara geri dönün; güvenlik kurallarını geçici olarak herkese açık yapmayın.


## 4. API kimlik doğrulaması (Vercel)

Kullanıcıya açık API uçları artık Firebase Authentication ID token'ı doğrular. Bunun için Vercel sunucusunda Firebase Admin SDK servis hesabı gerekir.

1. Firebase Console'da, Vercel web uygulamasının kullandığı **aynı Firebase projesi** için bir servis hesabı oluşturun veya mevcut güvenli servis hesabını kullanın.
2. Servis hesabı JSON anahtarını kimseyle paylaşmayın ve GitHub'a yüklemeyin.
3. Vercel → Project → Settings → Environment Variables bölümünde `FIREBASE_SERVICE_ACCOUNT_JSON` adında bir değişken oluşturun. Değer olarak servis hesabının tüm JSON içeriğini girin.
4. Önce yalnızca Preview ortamına ekleyin ve `hardening/phase-1-security` dalının yeni preview dağıtımını oluşturun. Testler tamamlandıktan sonra Production ortamına ayrıca eklenir.
5. Yeni deployment oluşturun; ortam değişkenleri mevcut deployment'lara geriye dönük uygulanmaz.

Bu değişken eksikse korumalı API uçları güvenli biçimde `503 AUTH_SERVICE_NOT_CONFIGURED` döndürür. Bu nedenle servis hesabı ayarlanmadan bu PR'ı canlıya birleştirmeyin.
