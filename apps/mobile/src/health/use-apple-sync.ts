// Apple Health senkronunun uygulama içindeki tetikleyicileri (karar 0061 sıra 3d): açılış, ön plana geliş ve
// HealthKit'in yeni veri bildirimi. Profil apple_health değilse hiçbir şey yapmaz; sahibinde HealthKit yüklenmez.

import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/auth/session';
import { useDataSource } from '@/data/profile';
import {
  appleSyncRunning,
  appleSyncSupported,
  loadAppleSyncState,
  onAppleSyncChange,
  subscribeAppleObservers,
  syncAppleHealth,
  type AppleSyncState,
} from '@/health/apple-sync';

export function useAppleHealthSync(enabled: boolean): void {
  const apple = useDataSource() === 'apple_health';
  const active = enabled && apple && appleSyncSupported;

  useEffect(() => {
    if (!active) return;
    let removeObservers: (() => void) | null = null;
    let cancelled = false;
    void syncAppleHealth('foreground');
    void subscribeAppleObservers()
      .then((remove) => {
        if (cancelled) remove();
        else removeObservers = remove;
      })
      .catch(() => undefined);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncAppleHealth('foreground');
    });
    return () => {
      cancelled = true;
      sub.remove();
      removeObservers?.();
    };
  }, [active]);
}

// Durum değiştikçe artan sürüm; modül yüklenirken ilk dinleyici olarak kaydolur, React'ten önce artar.
let version = 0;
onAppleSyncChange(() => {
  version++;
});

/** Ben ekranı için: kayıtlı durum ve eşitlemenin sürüp sürmediği; durum değişince yeniden okunur. */
export function useAppleSyncState(): { state: AppleSyncState | null; running: boolean } {
  const v = useSyncExternalStore(
    (fn) => onAppleSyncChange(fn),
    () => version,
    () => version,
  );
  const userId = useSession().session?.user.id ?? null;
  const [state, setState] = useState<AppleSyncState | null>(null);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    void loadAppleSyncState(userId).then((s) => {
      if (live) setState(s);
    });
    return () => {
      live = false;
    };
  }, [userId, v]);
  return { state, running: appleSyncRunning() };
}
