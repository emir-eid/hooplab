// Yerel bildirim planı (karar 0045): hangi bildirim ne zaman. Saf modül; zamanlama `notifications/scheduler.ts`'te.
// Bildirimler telefonda zamanlanır, sunucu ve push yok. Metinlerde sağlık değeri yok: kilit ekranında görünürler.

import { TOKEN_LIFETIME_DAYS, type SyncState } from './google-health-status.ts';

export interface NotificationPrefs {
  checkin: { enabled: boolean; hour: number; minute: number };
  reconnect: { enabled: boolean };
}

export const defaultNotificationPrefs: NotificationPrefs = {
  checkin: { enabled: false, hour: 8, minute: 30 },
  reconnect: { enabled: false },
};

/** Check-in saati seçimi: 05:00-12:00, 15 dakikalık adım (gösterim tercihi, eşik değil). */
export const checkinTimeRange = { firstMinute: 5 * 60, lastMinute: 12 * 60, stepMinutes: 15 } as const;

/** Check-in bildirimi kaç gün ileriye zamanlanır; uygulama her açılışta planı yeniler. */
export const checkinDaysAhead = 7;
/** İzin dolmadan önce hatırlatmalar (saat): bir gün önce ve son saatler. */
export const reconnectLeadHours = [24, 3] as const;
/** Senkron durmuşsa hatırlatmanın saati (yerel). */
export const reconnectMorningHour = 9;

export type NotificationKind = 'checkin' | 'reconnect';

export interface PlannedNotification {
  id: string;
  kind: NotificationKind;
  at: Date;
  title: string;
  body: string;
  /** Dokununca açılacak ekran. */
  route: '/checkin' | '/me/google-health';
}

export interface PlanContext {
  now: Date;
  /** Bugünün check-in'i tamam mı (cihazın yerel günü). */
  checkinDoneToday: boolean;
  sync: { state: SyncState; connected_at: string | null } | null;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Yerel tarih "YYYY-AA-GG" (cihazın saat dilimi). */
function localIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

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

/** Saklanan tercihi okur; bozuk ya da eksik alan varsayılana düşer. */
export function parseNotificationPrefs(raw: string | null): NotificationPrefs {
  if (!raw) return defaultNotificationPrefs;
  try {
    const v = JSON.parse(raw) as Partial<NotificationPrefs>;
    const c = v.checkin;
    const minutes = c && Number.isInteger(c.hour) && Number.isInteger(c.minute) ? c.hour * 60 + c.minute : NaN;
    const { firstMinute, lastMinute, stepMinutes } = checkinTimeRange;
    const validTime = minutes >= firstMinute && minutes <= lastMinute && minutes % stepMinutes === 0;
    return {
      checkin: {
        enabled: c?.enabled === true,
        hour: validTime ? c!.hour : defaultNotificationPrefs.checkin.hour,
        minute: validTime ? c!.minute : defaultNotificationPrefs.checkin.minute,
      },
      reconnect: { enabled: v.reconnect?.enabled === true },
    };
  } catch {
    return defaultNotificationPrefs;
  }
}

export function anyEnabled(prefs: NotificationPrefs): boolean {
  return prefs.checkin.enabled || prefs.reconnect.enabled;
}

export function planNotifications(prefs: NotificationPrefs, ctx: PlanContext): PlannedNotification[] {
  const plan: PlannedNotification[] = [];
  const { now } = ctx;

  if (prefs.checkin.enabled) {
    for (let d = 0; d < checkinDaysAhead; d++) {
      const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, prefs.checkin.hour, prefs.checkin.minute);
      if (at <= now || (d === 0 && ctx.checkinDoneToday)) continue;
      plan.push({
        id: `hooplab-checkin-${localIso(at)}`,
        kind: 'checkin',
        at,
        title: "Sabah check-in'i",
        body: 'Bir dakikalık check-in bugünün okumasını tamamlar.',
        route: '/checkin',
      });
    }
  }

  if (prefs.reconnect.enabled && ctx.sync) {
    const { state, connected_at } = ctx.sync;
    const connected = connected_at ? Date.parse(connected_at) : NaN;
    if (state === 'connected' && Number.isFinite(connected)) {
      const expiry = connected + TOKEN_LIFETIME_DAYS * 86_400_000;
      for (const lead of reconnectLeadHours) {
        const at = new Date(expiry - lead * 3_600_000);
        if (at <= now) continue;
        plan.push({
          id: `hooplab-reconnect-${lead}h`,
          kind: 'reconnect',
          at,
          title: lead >= 24 ? 'Google Health izni yarın doluyor' : 'Google Health izni birkaç saat içinde doluyor',
          body: 'Senkron durmasın: Ben → Google Health → Yeniden bağlan.',
          route: '/me/google-health',
        });
      }
    } else if (state === 'reconnect_required') {
      const morning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), reconnectMorningHour, 0);
      const at = morning > now ? morning : new Date(morning.getTime() + 86_400_000);
      plan.push({
        id: 'hooplab-reconnect-stopped',
        kind: 'reconnect',
        at,
        title: 'Google Health senkronu durdu',
        body: 'Yeniden bağlanınca kaldığı yerden devam eder: Ben → Google Health.',
        route: '/me/google-health',
      });
    }
  }

  return plan.sort((a, b) => a.at.getTime() - b.at.getTime());
}
