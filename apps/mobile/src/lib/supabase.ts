// Uygulamanın tek Supabase istemcisi. Değerler .env.local'dan (EXPO_PUBLIC_, herkese açık olmak üzere
// tasarlanmış publishable anahtar); erişimi RLS korur. Gizli anahtar buraya hiç girmez.
// Değerler eksik veya hatalıysa istemci kurulmaz (`supabase` null) ve giriş ekranı nedenini söyler.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

import { bumpDataRevision, isDataWrite } from '@/data/revision';
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

// Veri yazan istek bitince veri sürümü artar; sekmeler odakta yalnız o zaman yeniden çeker (data/revision.ts).
const trackingFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method ?? (typeof input === 'object' && 'method' in input ? input.method : 'GET');
  const result = fetch(input, init);
  if (isDataWrite(method, url)) void result.finally(bumpDataRevision).catch(() => undefined);
  return result;
};

export const supabase: SupabaseClient | null = supabaseConfig.ok
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: {
        storage: sessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: { fetch: trackingFetch },
    })
  : null;

// Başka bir hesaba geçiş ya da çıkış: ekranlardaki veri artık geçersiz. Olay adına bakılmaz; kayıtlı oturum
// geri yüklenirken de SIGNED_IN gelir (web, 2026-10-16), yalnız kullanıcı değişince sürüm artar.
let sessionUserId: string | null | undefined;
supabase?.auth.onAuthStateChange((_event, session) => {
  const id = session?.user.id ?? null;
  if (sessionUserId !== undefined && id !== sessionUserId) bumpDataRevision();
  sessionUserId = id;
});

// Native'de kütüphane yenileme sayacını açılışta kendisi başlatır ama uygulamanın önde olup olmadığını
// bilemez; arka plana geçince durdurulur, öne gelince yeniden başlatılır.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
