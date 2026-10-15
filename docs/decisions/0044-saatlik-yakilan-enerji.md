# 0044. Saatlik yakılan enerji: kartın içinde 24 saatlik grafik, geriye 7 gün

- **Durum:** Kabul edildi. Senkron bulutta çalışıyor (gerçek hesapla 8 gün, 171 saat; her tam günde saatlerin toplamı günlük toplama eşit). Web önizlemesinde demo ile doğrulandı (390×844, açık ve koyu tema; gün geçişi, saat seçimi). iPhone'da gerçek hesapla bakılacak.
- **Tarih:** 2026-10-15
- **İlgili:** [0019](0019-google-health-senkronu.md) (senkron), [0043](0043-yakilan-enerji.md) (yakılan enerji, tahmin etiketi), [0042](0042-okunabilirlik-kartlar-ve-kisaca.md) (kart düzeni), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md) (dokunarak seçilen grafik)

## Bağlam
Kullanıcı (2026-10-14) Bugün'deki "Yakılan enerji" kartında, HRV grafiği gibi dokunarak seçilen, saat saat bir grafik istedi: seçilen saatin kalorisi, yanında günün toplamı; varsayılan bugün, oklarla son 7 güne geri.

Senkron şimdiye kadar yalnız günlük toplamı (`dailyRollUp`) çekiyordu. Saatlik veri için `dataPoints:rollUp` (fiziksel zaman aralığı, `windowSize`) gerekiyor. Kod yazılmadan önce gerçek API yerel `ghealth` CLI'nın token'ıyla ölçüldü (yalnız sayılar ve oranlar okundu, değer okunmadı):
- **Fitbit Air saatlik toplam kalori veriyor.** Son 3 tam günün her birinde 24 saatin 24'ü dolu; saatlerin toplamı günlük toplama eşit (oran 1,000), hem bileklik ailesinde hem tüm kaynaklarda.
- **Sınırlar:** `total-calories` için en çok 14 gün (14 günlük tek istek 336 pencere ve tek sayfa döndü, 15 gün `INVALID_ARGUMENT`). Kaynak ailesi yalnız tam adla kabul ediliyor. `dailyRollUp`'ın aksine `pageSize` kabul ediliyor (gönderilmiyor).
- **Biçim:** pencereler en yeniden eskiye sıralı ve saat başına oturuyor. Süren saat de geliyor (yarım), gelecek saat gelmiyor.
- `active-energy-burned` saatlik geliyor (dinlenme saatlerinde boş). `basal-energy-burned` bu uç noktada `INVALID_ARGUMENT`. Toplam kalori her saatte dolu olduğu için ikisine gerek yok.

## Karar
- **Veri:** senkron her saat `total-calories` rollUp'ını tek istekle çeker (pencere 3600 sn, bileklik ailesi). Kapsam bugün ve önceki 7 gün; aralık sporcunun Google saat dilimindeki yerel gece yarısından başlar. İlk senkronun 90 günü saatlik çekilmez.
- **Yeni tablo `health_hourly_energy`:** anahtar `(user_id, hour_start)`; yerel gün ve saat senkronda yazılır, uygulama saat dilimi bilmeden günü sorgular. Sahibi yalnız okur, yazan yalnız `service_role` (0019 ile aynı kurallar; pgTAP 13 madde, politika gevşetilince kırıldığı denendi).
- **Kartta:** büyük sayı saat seçili değilken günün toplamı. Bugün için bu "şu ana kadar"dır, geçmiş günde "Tam gün". Altında oklarla gün geçişi ("Bugün", "Dün", "Pzt 12 Ekim") ve saatlik çubuk grafik var.
- **Saat seçimi:** dokunma ya da yatay sürükleme bir saat seçer. Başlıkta saat aralığı ve o saatin kalorisi görünür, sağda günün toplamı. Bugünün son çubuğu süren saattir, soluk çizilir; seçilince "Süren saat, şu ana kadar" yazar.
- **Grafik kuralları:**
  - Ölçek gösterilebilen 8 günün en yüksek saatidir; günler arasında geçince çubuklar kıyaslanabilir kalır.
  - Tek seri olduğu için renk nötr. Eşik, hedef ve durum rengi yok; değerler 10 kcal'e yuvarlanır (`enerji-gosterim`).
  - Saatlik veri yoksa kart eski haliyle (yalnız günlük değerler) görünür.
- **Kural:** `enerji-gosterim` kuralına `hourly_days_back: 7` eklendi (motor `energyRule.hourlyDaysBack`, testle bağlı). 7 bir gösterim penceresi, bilimsel eşik değil; uygulamanın öbür 7 günlük pencereleriyle aynı.
- **Kaynak:** yeni kaynak yok. Saatlik değerin ayrı bir doğruluk çalışması yok; kaynaklar dakika ve etkinlik düzeyinde ölçtü (chevance-2022), saatlik toplam günün tahminiyle aynı hatayı taşır. Açıklama sayfası bunu sınırlarda yazar.
- **Koç:** saatlik veri koça gitmez (0043 ile aynı). Kural metni değiştiği için kanıt paketi yeniden üretildi ve `coach-daily` / `coach-ask` yeniden dağıtıldı.

## Sonuçlar
- Senkron başına bir Google isteği daha (saatte bir; ücret yok). Tabloya günde 24 satır yazılır; eski satırlar silinmez (yılda ~8.800 satır, ücretsiz planın çok altında).
- Gece yarısından hemen sonra bugünün grafiğinde birkaç çubuk olur; varsayılan yine bugündür (kullanıcı isteği).
- Saat dilimi değişirse (seyahat) senkron son 8 günü yeni dilime göre yeniden yazar. Anahtar saatin başladığı an olduğu için satır çoğalmaz, yalnız yerel gün ve saat güncellenir.
