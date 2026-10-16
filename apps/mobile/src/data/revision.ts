// Veri sürümü (performans turu, 2026-10-16). Sekmeler odaklandıkça bütün veriyi yeniden çekiyordu
// (Bugün'de ~27 istek ve bütün kartların yeniden çizimi, her sekme dönüşünde). Artık ekran yalnız
// veri değişmişse, gün dönmüşse ya da son çekişin üstünden `focusRefreshMs` geçmişse yeniden çeker.
// Sürümü artıranlar: Supabase'e giden yazma istekleri (lib/supabase.ts), giriş / çıkış ve demo deposu.

let revision = 0;

/** Saatlik senkron ve uzun süre açık kalan uygulama için: bu kadar süre sonra odakta yine çekilir. */
export const focusRefreshMs = 5 * 60_000;

export function bumpDataRevision(): void {
  revision++;
}

export function dataRevision(): number {
  return revision;
}

/** Bu istek veriyi değiştirir mi? Okuma (GET / HEAD), oturum ve koç çağrıları değiştirmez. */
export function isDataWrite(method: string, url: string): boolean {
  const m = method.toUpperCase();
  if (m === 'GET' || m === 'HEAD' || m === 'OPTIONS') return false;
  const path = safePath(url);
  // Senkron ve bağlantı fonksiyonları sağlık verisini değiştirir; koç kendi özetini kendi yönetir.
  return path.includes('/rest/v1/') || path.includes('/functions/v1/ghealth-');
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export interface FocusGate {
  /** Odakta yeniden çekilmeli mi? */
  shouldFetch(day: string): boolean;
  /** Çekiş başladı: o anki sürüm ve gün kaydedilir (çekiş sırasında yazma olursa sonraki odak yine çeker). */
  started(day: string): void;
  /** Çekiş yarıda bırakıldı (ekran odağı kaybetti): sonraki odak yeniden çeker. */
  invalidate(): void;
}

export function createFocusGate(now: () => number = Date.now, current: () => number = dataRevision): FocusGate {
  let last: { revision: number; day: string; at: number } | null = null;
  return {
    shouldFetch(day) {
      return last === null || last.revision !== current() || last.day !== day || now() - last.at >= focusRefreshMs;
    },
    started(day) {
      last = { revision: current(), day, at: now() };
    },
    invalidate() {
      last = null;
    },
  };
}
