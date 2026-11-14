// Hatırlatmaların sunucu tarafı planı (karar 0058; 2026-11-14'ten beri iPhone uygulaması için de tek plan, karar 0060).
// Saf modül: hangi kullanıcıya şu an hangi hatırlatma gider. Metinlerde sağlık değeri yok: kilit ekranında görünürler
// (test denetler).

export type PushKind = 'checkin' | 'match' | 'reconnect';

/** `notification_prefs` satırı. Saatler Postgres `time` biçiminde ("08:30:00"). */
export interface PushPrefsRow {
  user_id: string;
  time_zone: string;
  checkin_enabled: boolean;
  checkin_time: string;
  match_enabled: boolean;
  match_time: string;
  reconnect_enabled: boolean;
}

export interface PushContext {
  now: Date;
  /** Kullanıcının yerel gününde check-in var mı. */
  checkinDone: boolean;
  /** Kullanıcının yerel gününde maç varsa başlama saati ("19:00:00" ya da null); maç yoksa undefined. */
  match?: { startTime: string | null };
  /** Google Health senkron durumu; bağlantı yoksa null. */
  sync: { state: string; lastSuccessAt: string | null } | null;
}

export interface DuePush {
  kind: PushKind;
  /** Aynı hatırlatmayı bir kez göndermek için anahtar (`push_log`). */
  key: string;
  title: string;
  body: string;
  /** Dokununca açılacak ekran. */
  route: '/checkin' | '/me/google-health' | '/';
}

/**
 * Seçilen saatten sonra ne kadar süre içinde gönderilir (dakika). Zamanlayıcı 15 dakikada bir çalışır; bir çalışma
 * kaçarsa sonraki yakalar, ama saatlerce gecikmiş bir sabah hatırlatması gönderilmez. Kullanım tercihi, eşik değil.
 */
export const sendWindowMinutes = 60;
/** Senkron durmuşsa hatırlatmanın en erken yerel saati (yerel planla aynı: 09:00). */
export const reconnectMorningHour = 9;

export const pushTexts = {
  checkin: { title: "Sabah check-in'i", body: 'Bir dakikalık check-in bugünün okumasını tamamlar.' },
  reconnect: { title: 'Google Health senkronu durdu', body: 'Yeniden bağlanınca kaldığı yerden devam eder: Ben → Google Health.' },
  matchTitle: 'Bugün maç günü',
  test: { title: 'HoopLab', body: 'Deneme bildirimi: bildirimler bu cihaza ulaşıyor.' },
} as const;

export function matchBody(startTime: string | null): string {
  return startTime ? `Maç ${startTime}. Öğün ve sıvı saatleri Bugün'de.` : "Öğün ve sıvı notları Bugün'de.";
}

/** Verilen anın IANA dilimindeki yerel günü ve günün dakikası. Geçersiz dilimde null (yanlış saatte gönderilmez). */
export function localClock(now: Date, timeZone: string): { date: string; minutes: number } | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now);
  } catch {
    return null;
  }
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) };
}

/** "08:30:00" → 510; bozuksa null. */
export function timeToMinutes(time: string): number | null {
  const m = /^(\d{2}):(\d{2})/.exec(time);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}

/** "19:00:00" → "19:00" */
function shortTime(time: string): string {
  return time.slice(0, 5);
}

function inWindow(minutes: number, time: string): boolean {
  const start = timeToMinutes(time);
  return start !== null && minutes >= start && minutes < start + sendWindowMinutes;
}

/** Bu çalışmada gönderilmesi gereken hatırlatmalar (gönderilmiş olanları `push_log` ayıklar). */
export function duePushes(prefs: PushPrefsRow, ctx: PushContext): DuePush[] {
  const clock = localClock(ctx.now, prefs.time_zone);
  if (!clock) return [];
  const due: DuePush[] = [];

  if (prefs.checkin_enabled && !ctx.checkinDone && inWindow(clock.minutes, prefs.checkin_time)) {
    due.push({ kind: 'checkin', key: clock.date, ...pushTexts.checkin, route: '/checkin' });
  }

  if (prefs.match_enabled && ctx.match && inWindow(clock.minutes, prefs.match_time)) {
    due.push({
      kind: 'match',
      key: clock.date,
      title: pushTexts.matchTitle,
      body: matchBody(ctx.match.startTime ? shortTime(ctx.match.startTime) : null),
      route: '/',
    });
  }

  // Senkron durunca tek hatırlatma: anahtar son başarılı senkronun anı, yani her kopma bir kez.
  if (
    prefs.reconnect_enabled &&
    ctx.sync?.state === 'reconnect_required' &&
    clock.minutes >= reconnectMorningHour * 60
  ) {
    due.push({ kind: 'reconnect', key: ctx.sync.lastSuccessAt?.slice(0, 19) ?? 'never', ...pushTexts.reconnect, route: '/me/google-health' });
  }

  return due;
}
