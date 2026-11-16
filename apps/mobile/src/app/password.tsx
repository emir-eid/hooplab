// Ben → Şifreyi değiştir (karar 0061 sıra 6). Modal; kaydedilince kapanır.

import { router } from 'expo-router';

import { PasswordForm } from '@/components/password-form';

export default function PasswordScreen() {
  return <PasswordForm mode="edit" onSaved={() => router.back()} />;
}
