// Profil (karar 0061): veri kaynağı ve spor. Oturum başına bir kez okunur ve bellekte tutulur; kullanıcı değişince
// (giriş / çıkış) yeniden okunur. Demo modunda ve profil okunamazken sahibinin profili (Google Health) kullanılır.
// Ekranlar kaynağa göre metin ve sütun seçer; sahibinin hesabında hiçbir şey değişmez.

import type { DataSource } from '@hooplab/engine';
import { useEffect, useSyncExternalStore } from 'react';

import { defaultProfile, toProfile, type Profile } from '@/data/profile-row';
import { demoStore, useDemoScenario } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

let cache: { userId: string; profile: Profile } | null = null;
let pending: { userId: string; promise: Promise<Profile> } | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

// Hesap değişince eski profil geçersiz.
supabase?.auth.onAuthStateChange((_event, session) => {
  const id = session?.user.id ?? null;
  if (cache && cache.userId !== id) {
    cache = null;
    emit();
  }
});

async function load(userId: string): Promise<Profile> {
  if (!supabase) return defaultProfile;
  const { data, error } = await supabase.from('profiles').select('data_source, sport').eq('user_id', userId).maybeSingle();
  // Okunamadıysa önbelleğe yazılmaz (sonraki çağrı yeniden dener); bu çağrı sahibinin profiliyle devam eder.
  if (error) return defaultProfile;
  const profile = toProfile(data);
  cache = { userId, profile };
  emit();
  return profile;
}

/** Oturumdaki kullanıcının profili; demo, oturum yok ya da okuma hatasında sahibinin profili. */
export async function fetchProfile(): Promise<Profile> {
  if (demoStore() || !supabase) return defaultProfile;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return defaultProfile;
  if (cache?.userId === userId) return cache.profile;
  if (pending?.userId !== userId) pending = { userId, promise: load(userId).finally(() => (pending = null)) };
  return pending.promise;
}

export async function fetchDataSource(): Promise<DataSource> {
  return (await fetchProfile()).dataSource;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Bileşenler için profil: bilinene kadar ve demo modunda sahibinin profili. İlk kullanımda okumayı başlatır; profil
 * gelince bileşen yeniden çizilir.
 */
export function useProfile(): Profile {
  const demo = useDemoScenario();
  const profile = useSyncExternalStore(
    subscribe,
    () => cache?.profile ?? defaultProfile,
    () => defaultProfile,
  );
  const known = cache !== null;
  useEffect(() => {
    if (!demo && !known) void fetchProfile();
  }, [demo, known]);
  return demo ? defaultProfile : profile;
}

export function useDataSource(): DataSource {
  return useProfile().dataSource;
}
