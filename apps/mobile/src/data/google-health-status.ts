// Google Health bağlantı durumunun ekrandaki karşılığı. Saf fonksiyonlar (testli); veri erişimi
// google-health.ts'te. Token ömrü tahmindir: Google, Testing modundaki projelerde yenileme izni için
// 7 gün diyor (LESSONS "Google Health / veri"); kalan gün bağlanma anından hesaplanır, ölçüm değildir.

export const TOKEN_LIFETIME_DAYS = 7;

export type SyncState = 'connected' | 'reconnect_required' | 'disconnected';

export interface SyncStatusRow {
  state: SyncState;
  connected_at: string | null;
  synced_from: string | null;
  synced_through: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

export type ConnectionKind = 'none' | 'connected' | 'reconnect' | 'disconnected';

export interface ConnectionView {
  kind: ConnectionKind;
  /** Ben ekranındaki satırın değeri. */
  summary: string;
  lastSync: string | null;
  range: string | null;
  /** Tahmini; 0 ise yakında yeniden bağlanmak gerekir. */
  tokenDaysLeft: number | null;
  problem: string | null;
}

const shortMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'] as const;

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Bugün 14:05", "Dün 09:17", "3 Eki 14:05" (cihazın yerel saatine göre). */
export function formatSyncTime(iso: string, now: Date): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  const clock = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  if (sameDay(t, now)) return `Bugün ${clock}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(t, yesterday)) return `Dün ${clock}`;
  return `${t.getDate()} ${shortMonths[t.getMonth()]} ${clock}`;
}

/** "2026-07-07" → "7 Tem". */
function formatLocalDate(localDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) return '';
  return `${Number(match[3])} ${shortMonths[Number(match[2]) - 1] ?? ''}`;
}

export function tokenDaysLeft(connectedAt: string | null, now: Date): number | null {
  if (!connectedAt) return null;
  const t = Date.parse(connectedAt);
  if (Number.isNaN(t)) return null;
  const elapsed = Math.floor((now.getTime() - t) / 86_400_000);
  return Math.max(0, TOKEN_LIFETIME_DAYS - elapsed);
}

export function describeConnection(row: SyncStatusRow | null, now: Date): ConnectionView {
  if (!row) {
    return { kind: 'none', summary: 'Bağlı değil', lastSync: null, range: null, tokenDaysLeft: null, problem: null };
  }
  const lastSync = row.last_success_at ? formatSyncTime(row.last_success_at, now) : null;
  const range =
    row.synced_from && row.synced_through
      ? `${formatLocalDate(row.synced_from)} – ${formatLocalDate(row.synced_through)}`
      : null;

  if (row.state === 'reconnect_required') {
    return {
      kind: 'reconnect',
      summary: 'Yeniden bağlan',
      lastSync,
      range,
      tokenDaysLeft: 0,
      problem: 'Google izninin süresi doldu. Veri gelmeye devam etsin diye yeniden bağlan.',
    };
  }
  if (row.state === 'disconnected') {
    return { kind: 'disconnected', summary: 'Bağlı değil', lastSync, range, tokenDaysLeft: null, problem: null };
  }
  return {
    kind: 'connected',
    summary: 'Bağlı',
    lastSync,
    range,
    tokenDaysLeft: tokenDaysLeft(row.connected_at, now),
    problem: row.last_error
      ? 'Son denemede bazı veriler alınamadı. Saatlik senkron yeniden deneyecek.'
      : null,
  };
}

/** Google izin ekranından dönen sonucun (?ghealth=...&code=...) kullanıcıya söylenen hali. */
export function describeConnectOutcome(returnedUrl: string): { ok: boolean; message: string } | null {
  let params: URLSearchParams;
  try {
    const query = returnedUrl.includes('?') ? returnedUrl.slice(returnedUrl.indexOf('?') + 1) : '';
    params = new URLSearchParams(query);
  } catch {
    return null;
  }
  const outcome = params.get('ghealth');
  if (outcome === 'connected') {
    return { ok: true, message: 'Bağlandı. Son 90 günün verisi birkaç dakika içinde gelir.' };
  }
  if (outcome === 'denied') {
    return { ok: false, message: 'İzin verilmedi. Bağlanmak için yeniden dene ve izinleri onayla.' };
  }
  if (outcome === 'error') {
    return params.get('code') === 'missing_scopes'
      ? { ok: false, message: 'İzinlerin bazıları onaylanmadı. Yeniden bağlan ve izin ekranındaki tüm kutuları işaretle.' }
      : { ok: false, message: 'Bağlanılamadı. Biraz sonra yeniden dene.' };
  }
  return null;
}
