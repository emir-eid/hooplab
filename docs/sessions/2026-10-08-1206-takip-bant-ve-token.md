# 2026-10-08 12:06 — Takip: kişisel bant ve token süreleri

- **Faz:** 2 tamam, 3 başlamadı (Faz 1'in TestFlight maddesi Apple'ı bekliyor; 2026-10-08'de hâlâ yanıt yok)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** bu bloğun `/rep` commit'i

## Blok 1 — Takip: kişisel bant cihazda, token süreleri (12:06)

### Amaç
STATE'teki 1. iş: gerçek hesapta kişisel bant oluştu mu, Bugün'de renk ve hale iPhone'da çıkıyor mu ([0021](../decisions/0021-toparlanma-kisisel-bant.md)); yenileme token'ı 7. günde düştü mü ([0019](../decisions/0019-google-health-senkronu.md)).

### Yapılanlar
- **Kurulum denetimi:** `npm run setup:check` 12/12 tamam.
- **Senkron durumu** (`db query --linked`, yalnız durum sütunları): `connected`, son başarılı senkron bugün, `last_error` boş.
- **Bant:** yalnız sayımla bakıldı, değer okunmadı. Derin uyku HRV'si ve dinlenik nabız için son 7 günde 7/7 değer, önceki 28 günde 12 değer var; motorun alt sınırı (`recoveryMinValues.baseline`) 12. Bant bugün alt sınırdan oluştu.
- **Cihaz** (kullanıcı, Expo Go; Metro Claude'da): Bugün'de hale renkli, günün durumu gösteriliyor; Ben → Google Health "bağlı". Durum ve hissiyat karşılaştırması `../private/journal/` içinde, repoda değer yok.
- **Token süreleri:** `ghealth` CLI çalıştı (çıktı atıldı, yalnız çıkış kodu; `credentials.json` yenilendi). İzin tarihleri: CLI 2026-10-03 01:17, uygulama `connected_at` 2026-10-04 17:18. 7 günlük sınırlar 10 Ekim 01:17 ve 11 Ekim 17:18; düşüş bugün ölçülemez. [LESSONS](../LESSONS.md) "Google Health / veri" maddesine tarihler eklendi.
- **Ürün sorusu:** günün durumu maç gününü bilmiyor; maç günü "Toparlan" uygulanamaz. [PRODUCT §10](../PRODUCT.md)'a açık soru olarak eklendi (Faz 3 koç bağlamı, Faz 4 maç günü protokolü).
- STATE: takip maddesi token tarihleriyle 2. sıraya, Faz 3 koç tasarımı 1. sıraya; 0021 riskine bandın oluştuğu not edildi.

### Kararlar
- yok (yeni karar kaydı yok; maç günü sorusu PRODUCT §10'da açık).

### Sorunlar ve hatalar
- `health_daily` sütun adları iki kez yanlış tahmin edildi (`hrv_deep_rmssd`, `date`); doğrusu `hrv_deep_rmssd_ms`, `local_date`. Migration dosyasından okunup düzeltildi.

### Öğrenilenler
- LESSONS: 7 günlük sürenin tam sınır saatleri ve ölçüm zamanı (yukarıda). Yeni ders yok.

## Açık kalanlar
- Token düşüşü: CLI 10 Ekim 01:17, uygulama 11 Ekim 17:18 sonrası ölçülecek (STATE 2. iş).
- Bandın hissiyatla uyumu tek günle değerlendirilmez; birkaç hafta gözlenir.
- Apple Developer yanıtı bekleniyor.

## Sıradaki adım
Faz 3 başlangıcı: AI koç tasarımı (PRODUCT koç bölümü ve karar kaydı).
