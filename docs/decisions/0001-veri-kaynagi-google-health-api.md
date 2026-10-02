# 0001. Veri kaynağı: Google Health API v4

- **Durum:** Kabul edildi (Faz 0 ölçümüne bağlı)
- **Tarih:** 2026-10-03
- **İlgili:** 0002, 0004

## Bağlam
Kullanıcı Fitbit Air takıyor; verisi Google Health uygulamasında. Google Health'in birçok özelliği Türkiye'de çalışmıyor ve referans aralıkları sedanter bireylere göre ayarlı. Uygulamanın en değerli girdisi toparlanma takibi için HRV, uyku evreleri ve dinlenik nabız.

## Seçenekler
1. **Fitbit Web API:** 30 Eylül 2026'da desteği bitti, 30 Ekim 2026'da kapanıyor. Elendi.
2. **Google Health API v4** (`health.googleapis.com`): HRV, uyku, dinlenik nabız, SpO2, solunum, VO2max, egzersiz ve gün içi nabız dahil yaklaşık 30-40 veri tipi; Google OAuth. Resmi bireysel CLI (`ghealth`) var. Risk: doküman "yeni projeleri şu an kabul etmiyoruz" diyor.
3. **Apple Health (HealthKit):** Google Health Ağustos 2026'dan beri Apple Health'e senkron ediyor ama HRV aktarılmıyor. Native modül ve ücretli Apple hesabı gerekir.
4. **Google Takeout:** Elle, periyodik dışa aktarma. Otomatik değil.

## Karar
Google Health API v4. En zengin ve en doğrudan veri yolu, HRV dahil. Erişimin bireysel bir Google Cloud projesiyle gerçekten çalıştığı Faz 0'da `ghealth` CLI ile ölçülecek.

## Sonuçlar
- Veri sunucu tarafında (Supabase Edge Function) çekilir; Google OAuth sırrı ve token'lar uygulamaya girmez.
- Test modundaki OAuth uygulamasında token ömrü kısa olabilir; yeniden giriş akışı gerekebilir.
- **B planı** (Faz 0 başarısız olursa): Takeout ile periyodik içe aktarma ve/veya iOS Kısayollar ile Apple Health'ten otomatik gönderim (HRV hariç). HRV yoksa toparlanma modülü dinlenik nabız, uyku ve öznel ölçeklerle çalışır.
- **Yeniden değerlendirme tetikleyicisi:** Faz 0'da erişim reddedilirse, Google erişim politikasını değiştirirse veya Türkiye hesabında veri dönmezse.
