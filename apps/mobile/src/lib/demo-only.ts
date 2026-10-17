// Yalnız demo derlemesi (karar 0050): portfolyo sayfasındaki web demosu. Uygulama demoyla açılır, giriş
// formu ve kurulum notu gösterilmez; Supabase değerleri zaten boş derlenir, sunucuya bağlanılmaz.
// Expo yalnız doğrudan `process.env.EXPO_PUBLIC_*` erişimini paketlemede yerine koyar; parçalanmamalı.
export const demoOnlyBuild = process.env.EXPO_PUBLIC_HOOPLAB_DEMO_ONLY === '1';
