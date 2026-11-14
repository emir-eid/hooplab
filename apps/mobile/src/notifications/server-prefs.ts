// Hatırlatma tercihi Supabase'te (karar 0058, 0060): iPhone uygulaması ve PWA aynı satırı okur ve yazar; gönderimi
// sunucu yapar. Saat dilimi cihazınki: uygulama her öne gelişte farklıysa güncellenir (seyahatte hatırlatma bulunulan
// yerin saatine göre gelir). Demoda hiçbir şey okunmaz ve yazılmaz.

import { defaultNotificationPrefs, prefsFromRow, rowFromPrefs, type NotificationPrefs } from '@/data/notification-prefs';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const PREFS_COLUMNS = 'time_zone, checkin_enabled, checkin_time, match_enabled, match_time, reconnect_enabled';

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** Satır yoksa ya da okunamazsa varsayılanlar (hepsi kapalı). */
export async function loadServerPrefs(): Promise<NotificationPrefs> {
  if (!supabase || demoStore()) return defaultNotificationPrefs;
  const { data, error } = await supabase.from('notification_prefs').select(PREFS_COLUMNS).maybeSingle();
  if (error) return defaultNotificationPrefs;
  return prefsFromRow(data);
}

/** Tercihi ve cihazın saat dilimini yazar. */
export async function saveServerPrefs(prefs: NotificationPrefs): Promise<boolean> {
  if (!supabase || demoStore()) return false;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return false;
  const { error } = await supabase
    .from('notification_prefs')
    .upsert(
      { user_id: auth.user.id, ...rowFromPrefs(prefs, deviceTimeZone()), updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  return !error;
}

/** Satır varsa ve saat dilimi cihazınkinden farklıysa yalnız dilimi günceller. */
export async function syncTimeZone(): Promise<void> {
  if (!supabase || demoStore()) return;
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return;
  const { data, error } = await supabase.from('notification_prefs').select('time_zone').maybeSingle();
  const zone = deviceTimeZone();
  if (error || !data || data.time_zone === zone) return;
  await supabase.from('notification_prefs').update({ time_zone: zone, updated_at: new Date().toISOString() }).eq('user_id', userId);
}

/** Sunucudan, hatırlatmalarla aynı yoldan deneme bildirimi (önce iPhone uygulaması, yoksa PWA). */
export async function sendServerTest(): Promise<boolean> {
  if (!supabase || demoStore()) return false;
  const { error } = await supabase.functions.invoke('push-test', { body: {} });
  return !error;
}
