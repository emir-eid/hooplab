// Günlük adım görünümü (karar 0061 sıra 6, fitness profili): health_daily.steps satırlarından motorun okumasına.
// Saf modül; sorgu steps.ts'te. Hedef, renk ve uyarı yok (rules/aktivite.json → adim-gunluk).

import { addIsoDays, readSteps, stepsRule, type StepsReading } from '@hooplab/engine';

export interface StepsDayRow {
  local_date: string;
  steps: number | null;
  /** Satırın son eşitlemede yazıldığı an; bugünün değeri bu ana kadardır. */
  updated_at?: string | null;
}

export interface StepsView {
  reading: StepsReading;
  /** Bugünün satırının son güncellenmesi (ISO); bugün satırı yoksa null. */
  updatedAt: string | null;
  /** Gösterilecek hiçbir değer yok (kart görünmez). */
  empty: boolean;
}

/** Sorgunun en eski günü: bugünden önceki ortalama penceresi. */
export function stepsFrom(today: string): string {
  return addIsoDays(today, -stepsRule.averageDays);
}

export function buildStepsView(rows: readonly StepsDayRow[], today: string): StepsView {
  const reading = readSteps(
    rows.map((r) => ({ date: r.local_date, value: r.steps })),
    today,
  );
  return {
    reading,
    updatedAt: rows.find((r) => r.local_date === today)?.updated_at ?? null,
    empty: reading.today === null && reading.yesterday === null && reading.average === null,
  };
}
