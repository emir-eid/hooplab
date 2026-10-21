# 2026-10-21 14:25 — Bakım: Supabase CLI

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük (Blok 1)
- **Commit'ler:** rep commit'i

## Blok 1 — Supabase CLI 2.119.0 → 2.121.0 (14:25)

### Amaç
Önceki oturumda açık kalan bakım işi: kök devDependency olan Supabase CLI'yı son kararlı sürüme almak. Kullanıcı Apple kaydından bağımsız işlere odaklanmak istedi.

### Yapılanlar
- 2.120.0 ve 2.121.0 sürüm notları okundu (GitHub release): kırıcı değişiklik yok; yenilikler çoğunlukla yerel yığın güvenilirliği, `functions serve` ajan altında stream-json, `db remote commit` / `inspect db` için sonraki ana sürümde kaldırılma uyarısı (projede kullanılmıyor).
- `npm install -D -E supabase@2.121.0`: yalnız `package.json` ve kilitteki CLI paketleri değişti.
- Doğrulama: `npm run check` yeşil; `npm run setup:check` 13/13; `migration list --linked` 16 migration eşit; `db advisors --linked` yalnız bilinen `auth_leaked_password_protection` uyarısı (0015); `npm run db:start` + `npm run test:db` 205/205.
- STATE (Ortam tablosu, Apple kullanıcı işi), CHANGELOG ve LESSONS güncellendi; Apple belgesinin ayrıntısı `private/ops.md`'de.

### Kararlar
- yok.

### Sorunlar ve hatalar
- İlk `test:db` yerel veritabanı kapalı olduğu için bağlanamadı (Docker açık, yığın başlatılmamıştı). `db:start` sonrası geçti. Kapalıyken komut 1 ile çıkıyor (ayrıca denendi), yani yanlış yeşil yok.

### Öğrenilenler
- LESSONS "Supabase": 2.121'de ajan altındaki JSON çıktıları (`start`, hata nesnesi, `functions serve`) ve `test:db` için önce `db:start`.

## Açık kalanlar
- Apple Developer kaydı: ek belge 2026-10-21'de gönderildi, yanıt bekleniyor; 2026-11-03'te sonuç yoksa PWA yedek yolu (0054).
- Durum cümlesindeki tek ihlalin özeti düşürmesi (önceki oturumdan; yeni check-in'lerle izlenir).
- STATE "Açık riskler" ~12 KB; durağan maddeler arşive taşınabilir.

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
