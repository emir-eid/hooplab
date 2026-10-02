# HoopLab

Profesyonel bir basketbolcunun kendi kullanımı için geliştirdiği iPhone uygulaması. Fitbit Air / Google Health verisini ve sporcunun kendi girdilerini (antrenman yükü, iyi oluş, kas ağrısı haritası, beslenme, sıvı) birleştirir. Değerleri sedanter popülasyon normlarına göre değil, **sporcunun kendi baseline'ına** göre değerlendirir. Yük, toparlanma, kas ve tendon yorgunluğu, uyku, beslenme ve hidrasyon için **yalnız doğrulanmış bilimsel kaynaklara dayanan** yorumlar üretir.

> Durum: Faz 0 (veri erişimi testi). Canlı durum: [docs/STATE.md](docs/STATE.md) · Yol haritası: [docs/ROADMAP.md](docs/ROADMAP.md)

## Mimari

```
Google Health API ─┐
Sporcu girdileri ──┴─> Veri (Supabase) ─> Hesap motoru ─> Kanıt tabanı ─> AI yorum ─> iPhone (Expo)
                                          (deterministik,   (her eşik bir    (yalnız hesaplanmış
                                           testli TS)        kaynağa bağlı)   değerler + kaynaklar)
```

- **Sayıları kod hesaplar, AI hesaplamaz.** Dil modeli yalnız hesaplanmış değerleri ve ilgili kanıtları yorumlar; her iddiada kaynak gösterir.
- **Her eşik bir kaynağa bağlıdır.** Kaynaklar DOI/PMID ile doğrulanır ve geri çekilme kontrolünden geçer ([research/](research/README.md)).
- **Kişisel baseline önce gelir.** Popülasyon referansı yalnız sporculara özgü bir kaynak varsa kullanılır.

Kararlar ve gerekçeleri: [docs/decisions/](docs/decisions/README.md).

## Yığın

Expo (React Native, TypeScript, Expo Router) · Supabase (Postgres, Auth, Edge Functions, pg_cron, pgvector; Frankfurt) · Google Health API v4 · Claude API (yalnız sunucu tarafında)

## Repo yapısı

```
apps/mobile/       Expo uygulaması (Faz 1)
supabase/          şema, migration, Edge Functions (Faz 1)
packages/engine/   hesap motoru (Faz 2)
research/          kanıt tabanı: kaynaklar, kurallar, literatür takibi
docs/              geliştirme arşivi: durum, kararlar, oturum raporları, dersler, denetimler
tools/             gizlilik bekçisi, kaynak doğrulayıcı, Claude Code hook'ları
.claude/           Claude Code komutları (/ac, /kapat), skill'ler, ayarlar
```

## Gizlilik

Bu repo kod ve süreç içerir; **kişisel veri içermez.** Sağlık verisi yalnız Supabase'de ve geliştiricinin yerel makinesinde repo dışında durur. Commit öncesi ve CI'da otomatik gizlilik taraması yapılır ([tools/guard](tools/guard/privacy-guard.mjs)). Demo ve ekran görüntüleri sentetik veriyle üretilir.

## Geliştirme

```bash
npm run hooks:install   # yeni klonda bir kez: git hook'larını etkinleştirir
npm run check           # araç testleri + gizlilik taraması + kaynak doğrulama
```

Uyarı: Bu uygulama tıbbi bir cihaz değildir ve tıbbi tavsiye vermez.
