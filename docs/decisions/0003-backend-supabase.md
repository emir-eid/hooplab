# 0003. Backend: Supabase (Frankfurt)

- **Durum:** Kabul edildi
- **Tarih:** 2026-10-03
- **İlgili:** 0001, 0004, 0005

## Bağlam
Google Health senkronu bilgisayar kapalıyken de çalışmalı; Claude API anahtarı ve Google OAuth sırrı uygulama paketine girmemeli (paket açılıp okunabilir). Sağlık verisi için AB bölgesi tercih ediliyor. Zaman serisi analizi ve kanıt tabanında vektör arama gerekecek.

## Seçenekler
1. **Supabase:** Postgres, giriş, Edge Functions, pg_cron, pgvector, RLS tek pakette; Expo için resmi doküman. Ücretsiz planda 7 gün istek gelmezse duraklatma.
2. **Firebase (AB bölgesi):** Expo ile iyi çalışır; NoSQL olduğu için zaman serisi ve SQL hesapları zahmetli, vektör arama ayrı iş.
3. **Neon + Vercel/Cloudflare:** Esnek ama üç ayrı servis; giriş sistemini kendimiz kurarız.
4. **Kendi VPS'i:** Tam kontrol, ama güvenlik ve bakım tamamen bizde; sağlık verisi için gereksiz risk.

## Karar
Supabase, Frankfurt bölgesi. Tek pakette gereken her şey, SQL ile analiz kolaylığı ve RLS ile tek kullanıcıya kilitlenebilen veri.

## Sonuçlar
- Sırlar Supabase secrets içinde; mobil uygulama yalnız publishable anahtar ve kullanıcı oturumuyla erişir. `service_role` mobil koda giremez (bekçi kuralı).
- Supabase MCP yalnız `read_only=true` ve tek `project_ref` ile eklenir (Faz 1).
- Ücretsiz plan duraklatması Faz 1'de gözlenir; sorun olursa Pro plana geçilir.
- **Yeniden değerlendirme tetikleyicisi:** Maliyet veya veri yerleşimi gereksinimi değişirse.
