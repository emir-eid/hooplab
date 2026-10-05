# 0009. Herkes kendi hesabıyla: merkezi servis yok

- **Durum:** Kabul edildi; sihirbazın yeri [0023](0023-kurulum-sihirbazi-terminalde.md) ile uygulamadan terminale taşındı (2026-10-05)
- **Tarih:** 2026-10-03
- **İlgili:** 0001, 0003, 0005, [Google Health bağlantısı rehberi](../guides/google-health-baglantisi.md)

## Bağlam
HoopLab sahibinin kendi kullanımı için yapılıyor. Faz 0'da Google Cloud projesi ve OAuth istemcisi sahibinin Google hesabında açıldı. Repo ileride public olacak. Kodu indiren biri sahibinin projesini, kotasını veya faturasını kullanmamalı; sahibi de başkalarının verisine aracılık etmemeli.

## Seçenekler
1. **Merkezi uygulama:** sahibi Google OAuth uygulamasını yayımlar ve doğrulatır, tek Supabase'de çok kullanıcı tutar. Kullanıcı için kolay. Ama sağlık verisi kapsamları için Google doğrulaması, başkalarının sağlık verisinin sorumluluğu ve maliyet sahibine düşer.
2. **Kendi hesabınla kur (self-host):** her kullanıcı kendi Google Cloud projesini, Supabase projesini ve Anthropic API anahtarını açar; uygulama bunları kurulumda kullanıcıdan alır. Kurulum zahmetli. Ama veri, kota ve ödeme tamamen kullanıcıda kalır.

## Karar
Seçenek 2. Kodda veya repoda hiçbir proje kimliği, istemci kimliği, URL veya anahtar sabit yazılmaz; hepsi kullanıcının kendi ortam dosyasından veya uygulamadaki kurulum sihirbazından gelir. Faz 0'da yapılan konsol adımları adım adım bir rehbere dönüştürülür; uygulamanın ilk açılışındaki sihirbaz aynı adımları anlatır ve gerekli değerleri kullanıcıdan alır. *(2026-10-05: sunucu tarafı uygulamadan kurulamadığı için sihirbaz terminale taşındı, `npm run setup`; uygulama yalnız eksikliği söyler. Bkz. [0023](0023-kurulum-sihirbazi-terminalde.md).)*

## Sonuçlar
- Her kullanıcının açacağı hesaplar: Google Cloud (Google Health API + OAuth istemcisi), Supabase, Anthropic API (Faz 3), iPhone kurulumu için kendi Apple Developer hesabı veya Expo/EAS derlemesi.
- OAuth uygulaması "Testing" modunda kalır; yenileme token'ı 7 günde düşer, haftalık yeniden bağlanma akışı zorunlu (LESSONS).
- Kurulum zahmeti kabul edildi; rehber ve sihirbaz bunu hafifletir.
- Faz 1'e eklenenler: kurulum sihirbazı, Supabase/Google değerlerinin ortam dosyasından okunması, "yeniden bağlan" akışı.
- **Yeniden değerlendirme tetikleyicisi:** Google kişisel projelere erişimi kapatırsa, ya da uygulama başkalarına hizmet olarak sunulmak istenirse (o zaman doğrulama, gizlilik politikası ve veri sorumluluğu yeniden ele alınır).
