// Supabase bağlantı değerlerinin denetimi. Değerler kullanıcının kendi projesinden gelir ve koda
// sabit yazılmaz (0009); apps/mobile/.env.local'a kurulum sihirbazı yazar (npm run setup, 0023). Saf fonksiyon; testi yanında.

export type SupabaseConfigResult =
  | { ok: true; url: string; publishableKey: string }
  | { ok: false; problem: 'missing' | 'invalid-url' | 'secret-key' | 'invalid-key' };

/**
 * Yalnız publishable anahtar kabul edilir. Gizli anahtar (`sb_secret_`) uygulama paketine gömülürse
 * RLS'yi aşan tam erişim herkese açılır; yanlışlıkla yapıştırılırsa istemci hiç kurulmaz.
 */
export function parseSupabaseConfig(
  url: string | undefined,
  publishableKey: string | undefined,
): SupabaseConfigResult {
  const trimmedUrl = url?.trim() ?? '';
  const trimmedKey = publishableKey?.trim() ?? '';
  if (!trimmedUrl || !trimmedKey) return { ok: false, problem: 'missing' };

  let parsed: URL;
  try {
    parsed = new URL(trimmedUrl);
  } catch {
    return { ok: false, problem: 'invalid-url' };
  }
  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
    return { ok: false, problem: 'invalid-url' };
  }

  if (trimmedKey.startsWith('sb_secret_')) return { ok: false, problem: 'secret-key' };
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(trimmedKey)) return { ok: false, problem: 'invalid-key' };

  return { ok: true, url: parsed.origin, publishableKey: trimmedKey };
}
