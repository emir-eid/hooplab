# Karar kayıtları

Kod ne yapıldığını gösterir, nedenini göstermez. Bu klasör "neden böyle yaptık" sorusunun cevabıdır. Her mimari, ürün, araç veya süreç kararı bir dosyadır. Kararlar silinmez; değişen karar yeni bir kayıtla yerini alır ve eskisinin durumu güncellenir.

Kayıtları `/rep` veya `/kapat` açar. Ad biçimi: `NNNN-kisa-ad.md` (sıradaki numara).

## Şablon

```markdown
# NNNN. Başlık

- **Durum:** Önerildi | Kabul edildi | Yerini aldı: NNNN | Geri çekildi
- **Tarih:** YYYY-AA-GG
- **İlgili:** (diğer kararlar, oturum raporu)

## Bağlam
Hangi sorun ya da ihtiyaç bu kararı gerektirdi? Hangi kısıtlar vardı?

## Seçenekler
1. **Seçenek A:** artıları / eksileri
2. **Seçenek B:** artıları / eksileri

## Karar
Hangisi seçildi ve tek paragrafta neden.

## Sonuçlar
- Kabul edilen dezavantajlar
- Bu kararın açtığı veya kapattığı yollar
- Yeniden değerlendirme tetikleyicisi (hangi durumda bu karara geri dönülür)
```

## Dizin

| No | Karar | Durum |
|---|---|---|
| [0001](0001-veri-kaynagi-google-health-api.md) | Veri kaynağı: Google Health API v4 | Kabul edildi, Faz 0'da doğrulandı |
| [0002](0002-platform-expo-react-native.md) | Platform: Expo (React Native), PWA değil | Kabul edildi |
| [0003](0003-backend-supabase.md) | Backend: Supabase (Frankfurt) | Kabul edildi |
| [0004](0004-mimari-hesap-motoru-kanit-ai.md) | Mimari: deterministik hesap motoru + kanıt tabanı + AI yorum | Kabul edildi |
| [0005](0005-repo-ve-gizlilik-ayrimi.md) | Repo ve gizlilik: code/private ayrımı, önce private sonra public | Kabul edildi |
| [0006](0006-calisma-sistemi.md) | Çalışma sistemi: /ac-/kapat, STATE, hook'lar, CI, zamanlanmış görevler | Kabul edildi |
| [0007](0007-skill-seti.md) | Skill seti | Kabul edildi |
| [0008](0008-gizlilik-altyapisi-eklemeleri.md) | Gizlilik altyapısı: Drive yedeği, CI'da denylist, geçmiş taraması | Kabul edildi |
| [0009](0009-herkes-kendi-hesabiyla.md) | Herkes kendi hesabıyla: merkezi servis yok | Kabul edildi |
| [0010](0010-tasarim-yonu-hale.md) | Tasarım yönü: C · Hale, açık ve koyu tema (Sistem / Açık / Koyu) | Kabul edildi |
| [0011](0011-hale-efekti-svg.md) | Hale efekti: react-native-svg radyal gradyan + Reanimated transform | Kabul edildi |
| [0012](0012-ara-rapor-rep.md) | Ara rapor: /rep (oturum içinde kayıt + push, oturum açık kalır) | Kabul edildi |
| [0013](0013-tasarim-tokenlari.md) | Tasarım token'ları: @hooplab/theme, maketle birebir test, erişilebilir renkler, opsz 96 kesimi | Kabul edildi |
| [0014](0014-uygulama-iskeleti.md) | Uygulama iskeleti: apps/mobile (SDK 57), özel cam sekme çubuğu, cihazda saklanan görünüm tercihi | Kabul edildi |
| [0015](0015-veritabani-tek-sahip-rls.md) | Veritabanı: tek sahip RLS, açık GRANT, migration'lar repoda, oturum Keychain'de parçalı | Kabul edildi |
| [0016](0016-dis-servisleri-claude-yurutur.md) | Dış servis işlemlerini Claude yürütür (CLAUDE.md §7) | Kabul edildi |
| [0017](0017-sabah-check-in-olcegi.md) | Sabah check-in: beş madde 1-5 (5 = en iyi), ağrı haritası sol / sağ, NRS 0-10 | Kabul edildi |
| [0018](0018-vucut-gorunumu.md) | Vücut görünümü: stilize 3D manken (three.js + expo-gl), ağrı haritası, aşamalı bölge raporu | Kabul edildi |
