// Şifre koyma ve değiştirme (karar 0061 sıra 6). Saf modül; testi yanında.
//
// Davetli hesabı sahibi açar ve geçici bir şifre verir; hesap user_metadata.must_change_password = true ile açılır.
// Bu bayrak varsa uygulama ilk girişte kendi şifreni koyma ekranını gösterir. Şifre ve bayrak tek
// `auth.updateUser` çağrısıyla birlikte değişir (bayrak false olur). Sahibinin hesabında bayrak yok: ekran çıkmaz.

import type { AuthErrorLike } from '@/auth/auth-errors';

export const MIN_PASSWORD_LENGTH = 10;

/** Oturumdaki kullanıcı geçici şifreyle mi giriyor? Yalnız açıkça `true` yazan bayrak ekranı açar. */
export function mustChangePassword(user: { user_metadata?: Record<string, unknown> | null } | null | undefined): boolean {
  return user?.user_metadata?.must_change_password === true;
}

/** Yeni şifrenin denetimi; geçerliyse null, değilse kullanıcıya gösterilecek Türkçe uyarı. */
export function checkNewPassword(password: string, repeat: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`;
  if (password.trim().length === 0) return 'Şifre yalnız boşluktan oluşamaz.';
  if (password !== repeat) return 'İki şifre aynı değil.';
  return null;
}

/** Şifre değiştirme hatasının Türkçe karşılığı. */
export function describePasswordError(error: AuthErrorLike | null): string {
  if (!error) return 'Sunucu bağlantısı ayarlanmamış.';
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) {
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  }
  switch (error.code) {
    case 'same_password':
      return 'Yeni şifre eskisiyle aynı olamaz.';
    case 'weak_password':
      return 'Şifre çok zayıf. Daha uzun ya da tahmin edilmesi zor bir şifre seç.';
    case 'reauthentication_needed':
    case 'session_expired':
    case 'session_not_found':
      return 'Oturumun eskimiş. Çıkış yapıp yeniden girdikten sonra tekrar dene.';
    case 'over_request_rate_limit':
      return 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.';
    default:
      return 'Şifre değiştirilemedi. Biraz sonra tekrar dene.';
  }
}
