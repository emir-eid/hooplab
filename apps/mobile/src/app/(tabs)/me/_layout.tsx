import { Stack } from 'expo-router/stack';

import { usePalette } from '@/theme/appearance';

// Alt sayfaya doğrudan bağlantıyla gelinse de (ör. /me/appearance) geri düğmesi Ben'e dönsün.
export const unstable_settings = { initialRouteName: 'index' };

export default function MeLayout() {
  const palette = usePalette();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />;
}
