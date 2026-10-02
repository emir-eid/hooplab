# 0008. Gizlilik altyapısı eklemeleri: Drive yedeği, CI'da denylist, geçmiş taraması

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0005, 0006

## Bağlam
Kurulum sonrası öz denetimde üç boşluk bulundu:
1. `private` klasörünün (ham veri, kişisel notlar, oturum dökümleri) yedeği yoktu.
2. Kişisel denylist yalnız ana bilgisayardaydı. Başka makineden atılan commit'lerde ve CI'da kişisel bilgi kontrolü atlanıyordu.
3. Public'e geçiş öncesi tüm git geçmişini tarayacak bir araç yoktu; bekçi yalnız güncel dosyalara bakıyordu.

## Seçenekler
- **Yedek:** (a) Drive'a otomatik eklemeli kopya; (b) Drive'a elle şifreli arşiv; (c) harici disk; (d) yedek yok.
- **CI denylist:** (a) GitHub Actions secret; (b) yalnız yerel (CI kör kalır).
- **Geçmiş:** (a) bekçiye `--history` modu; (b) harici araç (gitleaks) ve elle denetim.

## Karar
- **Yedek:** Drive'a otomatik, eklemeli (ayna değil) kopya. `tools/backup/backup-private.mjs`; hedef repo dışında `private/backup-target.txt`. SessionEnd hook'u ve `/kapat` çalıştırır. Eklemeli olduğu için `private` yanlışlıkla silinirse yedek silinmez.
- **CI denylist:** Bekçi, dosyaya ek olarak `HOOPLAB_GUARD_DENYLIST_TEXT` ortam değişkenini okur; CI bunu `GUARD_DENYLIST` secret'ından verir. Secret'ı kullanıcı kendisi ekler: listede devlet kimlik numarası gibi bilgiler olduğu için Claude bu değerleri bir servise girmez.
- **Geçmiş:** Bekçiye `--history` modu eklendi. Tüm dal ve etiketlerden erişilebilen her dosya sürümünü ve geçmişte görülmüş her yolu tarar. Pre-push'ta, CI'da ve `npm run check` içinde çalışır.

## Sonuçlar
- Drive yedeği şifresiz; kullanıcının kendi Google hesabında (Fitbit verisi zaten Google'da). Şifreli yedek gerekirse bu karar yenisiyle değiştirilir.
- Drive dosya sisteminin zaman damgasını kaba sakladığı ölçüldü; yedek script'i 2 saniyelik tolerans kullanır (LESSONS).
- Geçmişte bir sır bulunursa CI kalıcı olarak kırmızı kalır; çözüm geçmişin yeniden yazılması ve sırrın iptalidir. Bu, public öncesi bilinmesi istenen bir durumdur.
- **Yeniden değerlendirme tetikleyicisi:** Repo public olduğunda (geçmiş taraması o noktada bir kez daha elle denetlenir) veya yedek boyutu Drive kotasını zorlarsa.
