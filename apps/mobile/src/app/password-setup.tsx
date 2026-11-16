// İlk girişte kendi şifreni koyma (karar 0061 sıra 6): user_metadata.must_change_password true ise uygulama rızadan
// sonra yalnız bu ekranı açar (_layout.tsx). Kaydedilince bayrak kalkar, oturum yenilenir ve ekran kendiliğinden kapanır.

import { PasswordForm } from '@/components/password-form';

export default function PasswordSetupScreen() {
  return <PasswordForm mode="setup" onSaved={() => undefined} />;
}
