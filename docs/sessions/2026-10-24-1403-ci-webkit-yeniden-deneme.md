# 2026-10-24 14:03 — CI: WebKit kurulumunda zaman sınırı ve yeniden deneme

- **Faz:** 4 tamamlandı (Faz 4 sonrası bakım; Faz 1'in TestFlight maddesi Apple onayını bekliyor)
- **Durum:** açık (/rep)
- **Model / efor:** Opus 5.5, düşük
- **Commit'ler:** `9d981f2` ve rep commit'i

## Blok 1 — Kontroller iptalinin sebebi ve WebKit adımının sağlamlaştırılması (14:03)

### Amaç
`/ac`'de görülen iptal: 2026-10-22 17:49 UTC'deki `Kontroller` çalışması (`39825966827`) 15 dk 20 sn'de iptal olmuştu. Sebebi bulmak; ağ kaynaklıysa CI'ı bu tür yavaşlıklara karşı dayanıklı yapmak.

### Yapılanlar
- Teşhis (`gh run view --log`): `kontrol` ve `veritabani` yeşil; `uctan-uca` işinde `npx playwright install --with-deps webkit` adımında apt, paketleri `azure.archive.ubuntu.com`'dan saniyede ~40-100 KB ile indirdi (7,5 MB'lık yazı tipi paketi ~2 dk). 35. pakette işin 15 dk sınırı doldu, testler hiç başlamadı. Kod sorunu değil.
- Geçmiş: son 40 çalışmanın 38'i yeşil; öteki hata (2026-10-21, `39669535342`) `kontrol` işinde `npm ci`'de `ECONNRESET`, o da ağ. WebKit adımı normalde 30-50 sn; 2026-10-22 10:31'deki başarılı çalışmada 8 dk 22 sn sürmüş (yavaş ayna, bitmiş).
- [checks.yml](../../.github/workflows/checks.yml) (`9d981f2`): WebKit kurulumu deneme başına `timeout 6m`, bitmezse uyarı ve bir yeniden deneme; iki deneme de bitmezse adım hata verir. İndirilen paketler apt önbelleğinde kaldığı için ikinci deneme kaldığı yerden sürer. İş sınırı 15 → 20 dk (2 × 6 dk + kurulum ve testler).
- Doğrulama: YAML yerelde `yaml` ile ayrıştırıldı, betik `bash -n` ile denetlendi; push sonrası çalışma `39945472803` üç işte yeşil, WebKit adımı 41 sn.

### Kararlar
- yok (CI ayarı; ayrı karar kaydı gerekmedi)

### Sorunlar ve hatalar
- Sınır: yeniden deneme yolu gerçek bir yavaşlıkta henüz çalışmadı; ilk tetiklenişte Actions'ta "WebKit kurulumu 1. denemede bitmedi" uyarısı görünür.

### Öğrenilenler
- LESSONS "Git ve süreç": CI'da `--with-deps` kurulumu apt aynasına bağlı, tek bir adım işin bütün süresini yiyebilir; ağa bağlı adımlara kendi sınırı ve yeniden deneme.

## Açık kalanlar
- Yeniden deneme yolunun ilk gerçek tetiklenişi izlenir (haftalık denetim CI sonucunu okur).
- Kullanıcı: uygulamayı telefonda açmak ve check-in (yerel hatırlatmalar ve koç oranları ölçümü için).

## Sıradaki adım
- Google token ölçümü (2026-10-26 12:25'ten sonra).
