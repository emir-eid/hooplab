// Profil (karar 0061): veri kaynağı ve spor. Oturum başına bir kez okunur ve bellekte tutulur; kullanıcı değişince
// (giriş / çıkış) yeniden okunur. Demo modunda ve profil okunamazken sahibinin profili (Google Health) kullanılır.
// Ekranlar kaynağa göre metin ve sütun seçer; sahibinin hesabında hiçbir şey değişmez.

import type { DataSource, Sport } from '@hooplab/engine';
import { useEffect, useSyncExternalStore } from 'react';

import type { Result } from '@/data/daily-log';
import { defaultProfile, profileUpdate, toProfile, type Profile, type ProfileAnswers } from '@/data/profile-row';
import { demoStore, useDemoScenario } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

let cache: { userId: string; profile: Profile } | null = null;
let pending: { userId: string; promise: Promise<Profile> } | null = null;
// Bu kullanıcı için okuma bitti mi (başarılı ya da hatalı)? Açılış ekranı ve kapılar (rıza, şifre, sorular) buna
// kadar bekler; böylece davetliye ekranlar yanlış sırayla görünmez. Hatada sahibinin profiliyle devam edilir.
let settledFor: string | null = null;
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
  if (settledFor !== null && settledFor !== id) {
    settledFor = null;
    emit();
  }
});

function invalidate() {
  cache = null;
  pending = null;
}

async function load(userId: string): Promise<Profile> {
  if (!supabase) return defaultProfile;
  const { data, error } = await supabase
    .from('profiles')
    .select('data_source, sport, sex, cycle_tracking, hormonal_contraception, answered_at, consented_at')
    .eq('user_id', userId)
    .maybeSingle();
  // Okunamadıysa önbelleğe yazılmaz (sonraki çağrı yeniden dener); bu çağrı sahibinin profiliyle devam eder.
  if (error) {
    settledFor = userId;
    emit();
    return defaultProfile;
  }
  const profile = toProfile(data);
  cache = { userId, profile };
  settledFor = userId;
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

/** Profilin sporu (karar 0061 sıra 4); demo ve okuma hatasında sahibinin sporu (basketbol). */
export async function fetchSport(): Promise<Sport> {
  return (await fetchProfile()).sport;
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

/** Bu kullanıcının profil okuması bitti mi (başarılı ya da hatalı)? Oturum yoksa ya da demodaysa hemen evet. */
export function useProfileSettled(userId: string | null): boolean {
  const settled = useSyncExternalStore(
    subscribe,
    () => settledFor,
    () => settledFor,
  );
  const demo = useDemoScenario();
  return demo !== null || userId === null || settled === userId;
}

export function useDataSource(): DataSource {
  return useProfile().dataSource;
}

export function useSport(): Sport {
  return useProfile().sport;
}

/**
 * İlk giriş soruları ve Ben → Profil (karar 0061 sıra 4c): yanıtı kendi satırına yazar ve önbelleği yeniler. Veri
 * kaynağı ve spor yazılamaz (sütun yetkisi). Demo modunda yazılmaz.
 */
export async function saveProfileAnswers(answers: ProfileAnswers): Promise<Result<null>> {
  if (demoStore() || !supabase) return { ok: false, message: 'Demo modunda profil değiştirilemez.' };
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { ok: false, message: 'Oturum yok; yeniden giriş yap.' };
  const { error } = await supabase.from('profiles').update(profileUpdate(answers, new Date().toISOString())).eq('user_id', userId);
  if (error) return { ok: false, message: 'Kaydedilemedi. Bağlantını kontrol edip yeniden dene.' };
  invalidate();
  await fetchProfile();
  return { ok: true, value: null };
}

/**
 * Rıza ekranı (karar 0061 sıra 6): onayı ve onaylanan metnin sürümünü kendi satırına yazar, profili yeniden okur.
 * Onaydan önce uygulamanın geri kalanı, Apple senkronu ve bildirim kaydı açılmaz.
 */
export async function saveConsent(version: string): Promise<Result<null>> {
  if (demoStore() || !supabase) return { ok: false, message: 'Demo modunda rıza kaydedilmez.' };
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { ok: false, message: 'Oturum yok; yeniden giriş yap.' };
  const { error } = await supabase
    .from('profiles')
    .update({ consented_at: new Date().toISOString(), consent_version: version })
    .eq('user_id', userId);
  if (error) return { ok: false, message: 'Kaydedilemedi. Bağlantını kontrol edip yeniden dene.' };
  invalidate();
  await fetchProfile();
  return { ok: true, value: null };
}
