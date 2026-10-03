// Supabase giriş hatalarının kullanıcıya gösterilen Türkçe karşılığı. Saf fonksiyon; testi yanında.
// Hata yapısal olarak okunur (code / name / status), böylece test supabase-js yüklemeden koşar.

export interface AuthErrorLike {
  code?: string | undefined;
  name?: string;
  status?: number | undefined;
}

/** `null`: istemci kurulmamış (bağlantı değerleri eksik). */
export function describeAuthError(error: AuthErrorLike | null): string {
  if (!error) return 'Sunucu bağlantısı ayarlanmamış.';
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  }
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-posta veya şifre hatalı.';
    case 'email_not_confirmed':
      return 'E-posta adresi henüz doğrulanmamış. Supabase panosunda kullanıcıyı onayla.';
    case 'over_request_rate_limit':
      return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    case 'user_banned':
      return 'Bu hesap engellenmiş.';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'E-posta adresini kontrol et.';
    default:
      return 'Giriş yapılamadı. Biraz sonra tekrar dene.';
  }
}
