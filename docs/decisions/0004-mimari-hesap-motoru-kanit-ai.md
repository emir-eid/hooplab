# 0004. Mimari: deterministik hesap motoru + kanıt tabanı + AI yorum

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0001, 0003

## Bağlam
Uygulama değerlendirme, tahmin ve öneri üretecek ve bunları yalnız sağlam bilimsel kaynaklara dayandırmalı. Dil modelleri sayı ve kaynak uydurabilir. Sağlık uygulamalarının referans aralıkları sedanter popülasyona göre ayarlı ve bir profesyonel sporcu için yanıltıcı.

## Seçenekler
1. **AI her şeyi yapsın:** Ham veri modele verilir, yorum ve sayılar modelden gelir. Hızlı ama doğrulanamaz; halüsinasyon riski yüksek.
2. **Dört katman:** veri → deterministik hesap motoru → kanıt tabanı → AI yorum. Sayıları kod hesaplar; AI yalnız hesaplanmış sayıları ve ilgili kanıtları alıp yorumlar, her iddiada kaynak gösterir.

## Karar
Dört katmanlı mimari:
1. **Veri:** Google Health senkronu ve kullanıcı girdileri (Supabase).
2. **Hesap motoru** (`packages/engine`): saf TypeScript, testli. Kişisel baseline'lar, yük, kas/tendon bölge modeli, beslenme ve hidrasyon hedefleri.
3. **Kanıt tabanı** (`research/`): her eşik bir kurala, her kural DOI/PMID ile doğrulanmış bir kaynağa bağlı.
4. **AI yorum** (Claude API, sunucuda): yalnız hesaplanmış değerler ve kanıt tabanı; kaynak yoksa "yeterli kanıt yok".

Değerler önce kişisel baseline'a göre değerlendirilir (ör. HRV için 7 günlük ortalama ile 60 günlük normal bant). Popülasyon referansı yalnız sporculara özgü bir kaynak varsa kullanılır.

## Sonuçlar
- Hesap motoru bağımsız test edilebilir; portfolyoda da gösterilebilir bir parça.
- Kas yorgunluğu modeli doğrulanmış bir ölçüm değildir; arayüzde "tahmin" olarak etiketlenir ve kullanıcının ağrı puanlarıyla kalibre edilir.
- AI'ya ham veri değil, özet sayılar gider (gizlilik ve maliyet).
- Kırmızı bayraklarda (kalp ritmi uyarısı vb.) yorum yerine doktora yönlendirme; takviyelerde doping uyarısı.
- **Yeniden değerlendirme tetikleyicisi:** Kanıt tabanının kapsamadığı soruların oranı yüksek kalırsa (Faz 3 gözlemi).
