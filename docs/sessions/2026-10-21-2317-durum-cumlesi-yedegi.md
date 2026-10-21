# 2026-10-21 23:17 — Koç: durum cümlesi yedeği

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** Blok 1 rep commit'i

## Blok 1 — Durum cümlesi düşünce özetin tamamen kaybolması (23:17)

### Amaç
Önceki oturumdan açık kalan iş: günlük özette durum cümlesindeki tek bir ihlal, temiz cümleler dahil özetin tamamını düşürüyordu (2026-10-15, 10 denemede 1).

### Yapılanlar
- Sentetik durum cümleleriyle denetçinin öneri / yorum sınıflayıcısı denendi (gerçek özet metni okunmadı). Üç neden bulundu: cümle sonundaki "için" emir sayılıyordu ("iç" + "-in"); yönerge "durum ve nedeni" isterken "çünkü / nedeniyle / yüzünden" yorum sayılıp kaynak istiyordu; 0034 durum cümlesi kalmazsa tam ret diyordu.
- Kullanıcı üç çözümün birlikte uygulanmasını seçti ([0056](../decisions/0056-durum-cumlesi-yedegi.md)):
  - Denetçi ([audit.ts](../../supabase/functions/_shared/coach/audit.ts)): sonda "için", önündeki sözcük ortaç / mastar / tamlayan ise emir sayılmıyor ("su için" hala öneri).
  - Yönerge ([daily.ts](../../supabase/functions/_shared/coach/daily.ts)): ilk cümle "Günün durumu X; nedeni: Y." kalıbında, bağlaçsız, öneri sonraki cümlede.
  - Yedek: `salvageAudit` `statusFallback` (yalnız günlük özet, `dailySalvageOptions`) ve `statusSentence`. Model durum cümlesi kalmazsa motorun durum bloğu metni öne konur; `audit.engineStatus` kaydı, yanıtta `engineStatus: true` ([contract.ts](../../supabase/functions/_shared/coach/contract.ts)), kartta "İlk cümle uygulamanın kendi durum metni." ([coach-card.tsx](../../apps/mobile/src/components/coach-card.tsx), [copy/coach.ts](../../apps/mobile/src/copy/coach.ts)).
- Testler: sınıflayıcı örnekleri, yedek seçimi ve en az cümle sayısı (`audit.test.ts`), uçtan uca günlük akış ve önbellek (`daily.test.ts`). `npm run check` yeşil (87 / 153 / 200 / 122).
- Bulut (§7): `functions deploy` `coach-daily` (v19), `coach-weekly` (v4), `coach-ask` (v11); üçü ACTIVE, girişsiz istek 401. Bağlı proje `supabase/.temp/project-ref` ile doğrulandı.

### Kararlar
- [0056 Durum cümlesi yedeği](../decisions/0056-durum-cumlesi-yedegi.md) — kabul edildi (kullanıcı kararı); 0034'ün durum maddesini değiştirir.

### Sorunlar ve hatalar
- İlk düzeltme "için"i hiç emir saymıyordu; "Antrenmandan sonra su için." testi kırıldı (gerçek öneri kaçıyordu). Kural, önündeki sözcüğe bakan dar biçime çevrildi.

### Öğrenilenler
- LESSONS "Claude API (koç)": emir kipi listesi Türkçe eş yazımlı sözcüklerle çakışabilir ("için").

## Açık kalanlar
- Yeni yönergenin ve yedeğin gerçek yanıttaki etkisi yeni check-in'lerle görülür; `engineStatus` dolu özet oranı izlenir.
- Kart notu ("İlk cümle uygulamanın kendi durum metni.") gözle görülmedi: yalnız yedek devreye girince çıkar, demoda yok.
- Haftalık yorumda 7 cümle kırpmasının oranı ilk yeni yorumla ölçülür.
- Apple Developer kaydı; 2026-11-03'te sonuç yoksa PWA yedek yolu (0054).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
