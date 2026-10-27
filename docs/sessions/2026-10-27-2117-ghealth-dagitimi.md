# 2026-10-27 21:17 — Google fonksiyonlarının dağıtımı

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** kapandı (/kapat, 2026-10-27 22:09)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `a0ec393` (rep) ve kapanış commit'i

Oturum 2026-10-27 20:37'de açıldı (`/ac`), 22:09'da kapandı (1 blok).

## Blok 1 — `ghealth-*` fonksiyonları `2c6dc6c` ile dağıtıldı (21:17)

### Amaç
PWA yayın günü sırasındaki ([0054](../decisions/0054-pwa-yedek-yolu.md) "Hazırlık denetimi", adım 4) dağıtımı önden yapmak: buluttaki Google fonksiyonları 2026-10-15 sürümündeydi, `GHEALTH_WEB_RETURN_URL` desteği (`2c6dc6c`) dağıtılmamıştı. Kullanıcı isteği.

### Yapılanlar
- Kapsam: 2026-10-15'ten sonra `ghealth-*` ve `_shared/google-health` için tek değişiklik `2c6dc6c` (`git log`); arada `_shared/coach` değişti (`9688e59`), Google fonksiyonları onu içe aktarmıyor.
- Yerel (§7): `tsc -p supabase/functions` ve test yapılandırması temiz, `test:functions` 122/122.
- Hesap: `projects list` ile tek bağlı proje `hooplab` (Frankfurt), `supabase/.temp/project-ref` aynı. `functions deploy`'un kuru çalıştırma bayrağı yok.
- Bulut: `npx supabase functions deploy ghealth-connect ghealth-callback ghealth-sync`; üçü v9 → v10, ACTIVE, `verify_jwt=false` korundu (`config.toml`).
- Doğrulama: girişsiz `POST` `ghealth-connect` ve `ghealth-sync` 401, parametresiz `GET` `ghealth-callback` 400. Dağıtımdan sonraki ilk saatlik senkron (21:17, `db query --linked`, yalnız durum sütunları): `connected`, son deneme = son başarı, `last_error` boş, veri bugüne kadar.
- `GHEALTH_WEB_RETURN_URL` ayarlanmadı; ayarlı değilken davranış eskisiyle aynı (testli). 0054 yayın günü sırası güncellendi: 4. adımda yalnız secret kaldı.

### Kararlar
- yok (0054'teki sıranın bir adımı öne alındı).

### Sorunlar ve hatalar
- yok.

### Öğrenilenler
- yok.

## Açık kalanlar
- `GHEALTH_WEB_RETURN_URL` secret'ı: PWA yayın günü.
- İlk pazar CI çalışması 2026-11-01, denetimde görülmesi 2026-11-02.
- Haftalık koç yorumunun 7 cümle sınırından sonraki ilk örneği (Trend → haftalık rapor → "Koç yorumu yaz").
- Supabase'ten duraklatma uyarı e-postası gelirse haber verilir.
- TestFlight Apple onayını bekliyor; PWA karar tarihi 2026-11-03.

## Sıradaki adım
- TestFlight (Apple onayı gelince); gelmezse 2026-11-03'te PWA yedek yolu.
