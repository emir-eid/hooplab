// Ben → Profil (karar 0061 sıra 4c): cinsiyet, döngü takibi ve hormonal korunma sonradan buradan değişir.

import { router } from 'expo-router';

import { ProfileForm } from '@/components/profile-form';

export default function ProfileScreen() {
  return <ProfileForm mode="edit" onSaved={() => router.back()} />;
}
