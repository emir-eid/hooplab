// Uygulamanın tek Supabase istemcisi. Değerler .env.local'dan (EXPO_PUBLIC_, herkese açık olmak üzere
// tasarlanmış publishable anahtar); erişimi RLS korur. Gizli anahtar buraya hiç girmez.
// Değerler eksik veya hatalıysa istemci kurulmaz (`supabase` null) ve giriş ekranı nedenini söyler.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { createChunkedStorage } from '@/lib/chunked-storage';
import { parseSupabaseConfig } from '@/lib/supabase-config';

// Expo yalnız doğrudan `process.env.EXPO_PUBLIC_*` erişimini paketlemede yerine koyar; parçalanmamalı.
export const supabaseConfig = parseSupabaseConfig(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Oturum iPhone'da Keychain'de (SecureStore) parçalanarak saklanır (LESSONS "Expo / React Native").
// Web önizlemesinde SecureStore yok; supabase-js tarayıcının localStorage'ını kullanır.
const sessionStorage =
  Platform.OS === 'web'
    ? undefined
    : createChunkedStorage({
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        removeItem: (key) => SecureStore.deleteItemAsync(key),
      });

export const supabase: SupabaseClient | null = supabaseConfig.ok
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Native'de kütüphane yenileme sayacını açılışta kendisi başlatır ama uygulamanın önde olup olmadığını
// bilemez; arka plana geçince durdurulur, öne gelince yeniden başlatılır.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
