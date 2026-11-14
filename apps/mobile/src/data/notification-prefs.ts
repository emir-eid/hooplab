// Hatırlatma tercihleri (karar 0045, 0058, 0060). Saf modül. Tercihin tek kaynağı Supabase `notification_prefs`:
// hatırlatmaları sunucu gönderir (iPhone uygulamasına Expo push, yoksa PWA'ya Web Push). Plan ve metinler sunucuda
// (`supabase/functions/_shared/push/plan.ts`). Burada yalnız tercih biçimi, saat seçimi ve satır dönüşümü var.

export interface NotificationPrefs {
  checkin: { enabled: boolean; hour: number; minute: number };
  reconnect: { enabled: boolean };
  match: { enabled: boolean; hour: number; minute: number };
}

export const defaultNotificationPrefs: NotificationPrefs = {
  checkin: { enabled: false, hour: 8, minute: 30 },
  reconnect: { enabled: false },
  match: { enabled: false, hour: 9, minute: 0 },
};

/** Saat seçimi: 05:00-12:00, 15 dakikalık adım (gösterim tercihi, eşik değil; sunucu 15 dakikada bir gönderir). */
export const checkinTimeRange = { firstMinute: 5 * 60, lastMinute: 12 * 60, stepMinutes: 15 } as const;

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "08:30" */
export function formatClock(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

/** Saati aralık içinde bir adım ileri / geri; uçlarda durur. */
export function stepCheckinTime(hour: number, minute: number, direction: 1 | -1): { hour: number; minute: number } {
  const { firstMinute, lastMinute, stepMinutes } = checkinTimeRange;
  const current = hour * 60 + minute;
  const next = Math.min(lastMinute, Math.max(firstMinute, current + direction * stepMinutes));
  return { hour: Math.floor(next / 60), minute: next % 60 };
}

export function anyEnabled(prefs: NotificationPrefs): boolean {
  return prefs.checkin.enabled || prefs.reconnect.enabled || prefs.match.enabled;
}

/** `notification_prefs` satırı (Postgres `time` "08:30:00" biçiminde). */
export interface NotificationPrefsRow {
  time_zone: string;
  checkin_enabled: boolean;
  checkin_time: string;
  match_enabled: boolean;
  match_time: string;
  reconnect_enabled: boolean;
}

/** Saat metnini okur; aralık dışı ya da adımsızsa varsayılan saat. */
function readTime(value: unknown, fallback: { hour: number; minute: number }): { hour: number; minute: number } {
  const m = typeof value === 'string' ? /^(\d{2}):(\d{2})/.exec(value) : null;
  if (!m) return { hour: fallback.hour, minute: fallback.minute };
  const minutes = Number(m[1]) * 60 + Number(m[2]);
  const { firstMinute, lastMinute, stepMinutes } = checkinTimeRange;
  const valid = minutes >= firstMinute && minutes <= lastMinute && minutes % stepMinutes === 0;
  return valid ? { hour: Number(m[1]), minute: Number(m[2]) } : { hour: fallback.hour, minute: fallback.minute };
}

/** Sunucu satırından tercih; satır yoksa varsayılanlar (hepsi kapalı). */
export function prefsFromRow(row: Partial<NotificationPrefsRow> | null | undefined): NotificationPrefs {
  if (!row) return defaultNotificationPrefs;
  const d = defaultNotificationPrefs;
  return {
    checkin: { enabled: row.checkin_enabled === true, ...readTime(row.checkin_time, d.checkin) },
    match: { enabled: row.match_enabled === true, ...readTime(row.match_time, d.match) },
    reconnect: { enabled: row.reconnect_enabled === true },
  };
}

/** Tercihten sunucu satırı; saat dilimi cihazınki (sunucu yerel saati bununla hesaplar, seyahatte güncellenir). */
export function rowFromPrefs(prefs: NotificationPrefs, timeZone: string): NotificationPrefsRow {
  return {
    time_zone: timeZone || 'UTC',
    checkin_enabled: prefs.checkin.enabled,
    checkin_time: formatClock(prefs.checkin.hour, prefs.checkin.minute),
    match_enabled: prefs.match.enabled,
    match_time: formatClock(prefs.match.hour, prefs.match.minute),
    reconnect_enabled: prefs.reconnect.enabled,
  };
}
