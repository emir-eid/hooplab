// Demo modu anahtarı (karar 0022). Açıkken veri fonksiyonları sunucu yerine bellekteki demo deposuna gider;
// gerçek oturuma ve Supabase'e dokunulmaz. Durum saklanmaz: uygulama kapanınca demo da kapanır.

import { useSyncExternalStore } from 'react';

import type { DemoScenario } from '@/demo/demo-data';
import { DemoStore } from '@/demo/demo-store';
import { toLocalDate } from '@/utils/local-date';

/** Açılışta gösterilen senaryo: en çok şeyi (gerekçe, çipler, öneri) gösteren gün. */
export const defaultDemoScenario: DemoScenario = 'yellow';

let current: DemoStore | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Açık demo deposu; demo kapalıysa null. */
export function demoStore(): DemoStore | null {
  return current;
}

export function startDemo(scenario: DemoScenario = defaultDemoScenario) {
  const now = new Date();
  current = new DemoStore(scenario, toLocalDate(now), now);
  emit();
}

/** Senaryo değişince demo verisi baştan üretilir (bellekteki kayıtlar silinir). */
export function setDemoScenario(scenario: DemoScenario) {
  if (current?.scenario === scenario) return;
  startDemo(scenario);
}

export function stopDemo() {
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Demo açıksa senaryosu, değilse null. Değişince bileşen yeniden çizilir. */
export function useDemoScenario(): DemoScenario | null {
  return useSyncExternalStore(
    subscribe,
    () => current?.scenario ?? null,
    () => null,
  );
}
