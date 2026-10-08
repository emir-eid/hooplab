// Sentetik anlık değerler (CLAUDE.md §2: test verisi her zaman sentetik). Bütün ölçümler dolu.

import type { CoachSnapshot } from '../../_shared/coach/snapshot.ts';

export function fullSnapshot(): CoachSnapshot {
  return {
    version: 1,
    date: '2026-01-15',
    matchDay: false,
    status: { level: 'caution', signals: ['hrv_low', 'sleep_short'] },
    hrv: { rolling: 48.4, lastNight: 45.2, band: { low: 50.1, high: 61.7 }, position: 'below' },
    rhr: { rolling: 52.3, lastNight: 53, band: { low: 49.2, high: 54.8 }, position: 'within' },
    sleep: { rollingHours: 6.4, lastNightHours: 7.25, short: true },
    respiration: { rolling: 14.2, lastNight: 14.6, band: { low: 13.6, high: 14.9 }, position: 'within', nightHigh: false },
    checkin: { total: 16, baselineMean: 19.4, z: -1.3, low: true, topDrop: 'fatigue' },
    load: {
      week: 2450,
      previousWeek: 1980,
      weekChange: 0.237,
      weeklyAverage: 2105.5,
      ratio: 1.18,
      spike: false,
      monotony: 1.42,
      strain: 3479,
    },
    regions: [
      { region: 'patellar_tendon', load: 960, sessions: 2, hoursSinceLoaded: 20.4, windowHours: 48, typical: 610 },
      { region: 'quadriceps', load: 1310, sessions: 3, hoursSinceLoaded: 20.4, windowHours: 72, typical: null },
    ],
    pain: [{ region: 'patellar_tendon', side: 'left', pain: 3, yesterdayPain: 3, reasons: ['notDecreasing'] }],
    nutrition: {
      dayType: 'training',
      carbsPerKg: [5, 7],
      proteinPerKg: [1.2, 2],
      carbsG: [430, 602],
      proteinG: [103, 172],
      intakeCarbsG: 212.6,
      intakeProteinG: 98.2,
      carbsPosition: 'below',
      proteinPosition: 'below',
      meals: 2,
    },
    fluid: { totalL: 1.75 },
    sweatTest: {
      lossL: 1.4,
      rateLPerH: 0.93,
      changePercent: -1.12,
      lossNote: false,
      gainNote: false,
      fluidTargetL: [1.4, 2.1],
    },
  };
}

/** JSON'a çevrilip geri okunmuş hali: istekten gelen gövde gibi (readonly tipler düşer). */
export function asRequestBody(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}
