# 0016. Dış servis işlemlerini Claude yürütür

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-04
- **İlgili:** [0006](0006-calisma-sistemi.md), [0015](0015-veritabani-tek-sahip-rls.md), [CLAUDE.md §7](../../CLAUDE.md)

## Bağlam
İlk Supabase migration'ı buluta kullanıcının terminalinden gönderildi. Komutu Claude yazdı, kullanıcı kopyalayıp çalıştırdı. PowerShell `npx`'i engelledi (`npx.cmd` gerekti); `db push` beklenen şifreyi sormadı, çünkü CLI girişinin token'ıyla bağlanıyordu. Bu gidiş geliş işi yavaşlatıyor ve hata payı ekliyor. Kullanıcının isteği: Supabase, Expo/EAS, Vercel ve benzeri servislerde CLI ile yapılabilen her işi Claude yürütsün; bu katı bir kural olarak belgelensin.

## Seçenekler
1. **Kullanıcı çalıştırır:** her uzak işlem kullanıcının gözünden geçer, ama her adım bir gidiş geliş ister ve kopyala-yapıştır hatasına açıktır.
2. **Claude çalıştırır, sınırlar yazılı:** hızlı; Claude her adımın çıktısını görüp doğrular. Riskli işlemler için onay kuralı ve sırların ekrana basılmaması şart.

## Karar
Seçenek 2. CLI veya API ile yapılabilen dış servis işlerini Claude kendisi çalıştırır. Kullanıcıya yalnız Claude'un yapamayacağı veya yapmaması gereken adımlar kalır: tarayıcıda hesap girişi, hesap açma, şifre ve ödeme bilgisi, yalnız konsoldan yapılabilen ayarlar, cihazda test. Geri alınamayan, veri silen, ücret doğuran veya herkese açık yayın yapan işlemlerden önce tek satırlık onay alınır. Kural metni [CLAUDE.md §7](../../CLAUDE.md)'de.

## Sonuçlar
- CLI girişleri bu makinede kalıcıdır. Supabase girişi yalnız HoopLab'in bulunduğu ayrı hesaptadır, böylece token'ın erişimi bu projeyle sınırlı kalır. EAS ve diğer servislerde de HoopLab'e ayrılmış hesap tercih edilir ([COSTS](../COSTS.md)).
- Claude'un çalıştırdığı her uzak işlem önce yerelde veya `--dry-run` ile denenir, sonra doğrulanır (ör. `migration list`, `db advisors`, `curl`). Sonuç oturum raporuna yazılır.
- Sırlar komut çıktısında gösterilmez (`--reveal` kullanılmaz); bir sır gerekirse ya kullanıcı kendi terminalinde girer ya da CLI'dan doğrudan gitignore'lu dosyaya veya Supabase secrets'a yazılır.
- **Yeniden değerlendirme tetikleyicisi:** yanlış projeye veya hesaba işlem gitmesi, bir CLI girişinin sızması veya kullanıcının yeniden adım adım onay istemesi.
