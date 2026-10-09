// Demo verisinden koçun girdileri: DemoStore'un fetch* yöntemleriyle aynı görünümler. Testler kullanır
// (DemoStore `@/` takma adıyla import ettiği için Node'da açılmaz). Saf modül.

import { addIsoDays, readCheckin, sweatTest } from '@hooplab/engine';

import type { CoachInputs } from '../data/coach-snapshot.ts';
import { buildNutritionView } from '../data/nutrition-view.ts';
import { buildPainHistory } from '../data/pain-history.ts';
import { painEntries } from '../data/pain-map.ts';
import { buildRecoveryView } from '../data/recovery-view.ts';
import { buildRegionLoadView } from '../data/region-load-view.ts';
import { buildTrainingLoadView } from '../data/training-load-view.ts';
import type { DemoDb } from './demo-data.ts';

/** `now`: bölge yükündeki "son yüklenmeden bu yana" saatleri için. */
export function demoInputs(db: DemoDb, today: string, now: Date): CoachInputs {
  const yesterday = addIsoDays(today, -1);
  const loadRows = db.sessions.map((s) => ({ local_date: s.localDate, rpe: s.rpe, duration_min: s.durationMin, kind: s.kind }));
  const earliest = loadRows.map((r) => r.local_date).sort()[0] ?? null;
  const history = buildPainHistory([yesterday, today], db.checkins, db.pain);
  const readings = (date: string) => (history.byDate[date] ? painEntries(history.byDate[date]!) : null);
  const todaySessions = db.sessions.filter((s) => s.localDate === today);
  const tested = todaySessions.find((s) => s.sweat);
  return {
    today,
    matchDay: false,
    recovery: buildRecoveryView(db.healthDaily, db.sleep, today),
    checkin: readCheckin(
      db.checkins.map((c) => ({ date: c.local_date, answers: c.answers })),
      today,
    ),
    load: buildTrainingLoadView(loadRows, today, { earliest, untagged: [] }),
    regions: buildRegionLoadView(
      db.sessions.map((s) => ({
        local_date: s.localDate,
        rpe: s.rpe,
        duration_min: s.durationMin,
        kind: s.kind,
        content_tags: s.contentTags,
        started_at: s.startedAt,
      })),
      today,
      { earliest, now, painToday: readings(today), painYesterday: readings(yesterday) },
    ),
    nutrition: buildNutritionView(today, db.weights, todaySessions, null, db.meals, db.fluids),
    sweat: tested?.sweat ? sweatTest({ ...tested.sweat, urineL: tested.sweat.urineL ?? 0, durationMin: tested.durationMin }) : null,
  };
}
