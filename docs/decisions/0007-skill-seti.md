# 0007. Skill seti

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0002

## Bağlam
Kurulu tasarım skill'lerinin çoğu (frontend-design, emil-design-eng) web odaklı. Mobil geliştirme ve native tasarım için yaygın ve güvenilir skill'ler araştırıldı (Ekim 2026; skills.sh kurulum sayıları, GitHub yıldızları, yapımcının resmiyeti, lisans, içerdiği script'ler).

## Seçenekler ve değerlendirme
- **Kuruldu:**
  - `expo` plugin (Expo, resmi): navigasyon, native UI (Apple kuralları, SF Symbols), animasyon, tasarım token'ları, EAS.
  - `supabase` + `postgres-best-practices` (Supabase, resmi).
  - `animate-expo`, `apple-design`, `review-animations` (Emil Kowalski, MIT): emil-design-eng'in React Native karşılığı.
  - `react-native-best-practices` (Software Mansion, MIT): Reanimated 4, Gesture Handler, SVG, Skia.
- **Sonraya bırakıldı:** Vercel `react-native-skills` (performans; Faz 4). Callstack'in benzer skill'i Software Mansion'ınkiyle aynı adı taşıdığı için seçilmedi. EAS Simulator ve Maestro (iOS testi; önizleme veya ücretli).
- **Elendi:** Impeccable, taste-skill, Vercel web-design-guidelines (web'e özel); ui-ux-pro-max (Python script'i, genel tavsiye, mevcut skill'lerle çakışma); hig-doctor (Liquid Glass öncesi kurallar); Argent (Mac odaklı, kapalı parçalar, telemetri).

## Karar
Yukarıdaki "Kuruldu" seti. Expo ve Supabase plugin olarak `.claude/settings.json` üzerinden; diğerleri gereken skill klasörleri değiştirilmeden `.claude/skills/` içine kopyalandı. Kaynak commit'leri ve lisanslar: `.claude/skills/THIRD_PARTY_NOTICES.md`.

## Sonuçlar
- Skill'ler proje düzeyinde; kullanıcı düzeyindeki skill klasörü başka bir projeyle paylaşıldığı için oraya kurulmadı.
- Software Mansion paketinin geri kalanı (canlı yayın, ses, cihaz üstü AI) bilinçli olarak alınmadı.
- Web odaklı kurulu skill'lerin rolü CLAUDE.md §5'te tanımlı.
- **Yeniden değerlendirme tetikleyicisi:** Faz 4'te veya bir skill bakımsız kalırsa; kopyalanan skill'ler için kaynak repodaki önemli güncellemeler haftalık denetimde fark edilirse.
