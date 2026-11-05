# 0057. Ölçüm kartlarında küçük renk işareti: kişisel aralığa ya da kaynaklı eşiğe göre, eşiksiz ölçüm renksiz

- **Durum:** Kabul edildi (kullanıcı seçimi "B1", 2026-11-05)
- **Tarih:** 2026-11-05
- **İlgili:** [0021](0021-toparlanma-kisisel-bant.md), [0025](0025-antrenman-yuku.md), [0026](0026-aciklama-sayfalari-ve-tur-rengi.md), [0028](0028-solunum-ve-checkin-kisisel.md), [0041](0041-gunun-durumunda-nabiz.md), [oturum raporu](../sessions/2026-11-05-1237-pwa-yayini.md)

## Bağlam
Kullanıcı (2026-11-05), Trend'deki dört yük kartının ve Bugün'deki uyku nabzı, uyku ve solunum kartlarının "beklenen aralıkta / yüksek / düşük" ya da iyi / kötü durumuna göre renklenmesini istedi. Kartlar yalnız günün durumuna katkı verdiklerinde renkli bir nokta alıyordu; çoğu gün hepsi gri görünüyordu.

Kısıtlar (CLAUDE.md §3):
- Her renk bir eşiğe, her eşik doğrulanmış bir kaynağa dayanmalı.
- Yük oranında klasik bölgeler (0,8-1,3 güvenli, 1,5 üstü tehlikeli) başka sporlardan geliyor; basketbolda doğrulanmadı (0025). Monotonluk ve gerilim için eşik yok.
- Solunumda aralık dışının iyi mi kötü mü olduğu kaynakta yok; "her zamankinden farklı" deniyor (0028).

## Seçenekler
1. **B1:** Bugün'deki üç kart kişisel aralığa göre işaret alır; Trend'de yalnız oran, bilgi notu eşiğinde (≥ 1,5). Diğer üç yük kartı renksiz.
2. **B2:** B1 + monotonluk ve gerilim için kişisel geçmişe göre işaret. Yeni kaynak araştırması ve birkaç haftalık düzenli etiketleme gerekir.
3. **Her kartta yeşil / sarı / kırmızı bölge:** kaynaksız eşik; reddedildi.

## Karar
**B1.** Kartın noktası ve altındaki not satırı üç işaretten birini alır:
- **Sakin** (yeşil, durum yeşili): kişisel aralığın içinde ya da uyku yeterli.
- **Dikkat** (sarı, durum sarısı): yönü kaynaklı sapma. Uyku nabzı aralığın üstünde (`rhr_high`, 0041; durumu tek başına değiştirmez), 7 gecelik uyku kısa (`uyku-kisa`), yük oranı ≥ 1,5 (bilgi notunun eşiği, 0025; risk dili yok).
- **Farklı** (mavi, yeni `notice` / `noticeInk` token'ı): aralık dışı ama iyi ya da kötü denemeyen sapma. Solunum iki yönde de; uyku nabzı aralığın altında (yönü kaynakta yok).
- Aralık henüz oluşmadıysa, veri azsa ya da eşik yoksa işaret yok (gri nokta). Ortalama, monotonluk ve gerilim kartları renksiz kalır.
- Ölçüm günün durumuna katkı verdiyse (`flagged`) eskisi gibi günün durum rengi önce gelir; Bugün'ün renkleri birbiriyle çelişmez.
- Renk tek başına anlam taşımaz: not satırı aynı şeyi yazıyla söyler ("7 gün ort. · aralığın üstünde", "kısa").

Kod: `apps/mobile/src/data/tile-mark.ts` (saf, testli), `Tile` bileşeninin `mark` özelliği; renkler `packages/theme` (`notice` kart üstünde grafik için, `noticeInk` yazı için en az 4,5:1; tokens testi).

## Sonuçlar
- Kartlar çoğu gün yeşil görünür; bu "her şey iyi" değil, "kendi aralığında" demektir. Açıklama sayfaları aralığın ne olduğunu zaten anlatıyor.
- 0025'in "oranda renk yok" kuralı daraldı: yalnız ≥ 1,5'te dikkat rengi; güvenli bölge rengi yine yok.
- 0028'in "solunumda renk yok" kuralı daraldı: aralık dışı mavi, iyi / kötü anlamı taşımayan renk.
- **Yeniden değerlendirme tetikleyicisi:** monotonluk / gerilim için kişisel bant (0025 "ileride") gelirse B2; renkler hissiyatla sürekli çelişirse (ör. sık sarı ama iyi hissetmek) işaretlerin hangisinin yanılttığı `private/journal` kayıtlarıyla bakılır.
