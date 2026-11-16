// İlk giriş profil soruları (karar 0061 sıra 4c): profiles.answered_at boşsa uygulama yalnız bu ekranı açar
// (_layout.tsx). Yanıt kaydedilince profil yeniden okunur ve uygulamanın geri kalanı açılır.

import { router } from 'expo-router';

import { ProfileForm } from '@/components/profile-form';

export default function ProfileSetupScreen() {
  return <ProfileForm mode="setup" onSaved={() => router.replace('/')} />;
}
