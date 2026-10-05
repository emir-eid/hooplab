// Demo modunun bellekteki veritabanı (karar 0022): veri fonksiyonlarıyla aynı imzalar, ağ yok.
// Kayıtlar (check-in, seans, etiketleme) yalnız bellekte; uygulama kapanınca veya senaryo değişince sıfırlanır.

import { addIsoDays } from '@hooplab/engine';

import type { Checkin, ExerciseToTag, NewTrainingSession, Result, TrainingSession } from '@/data/daily-log';
import { linkCandidates, pendingExercises, type ExerciseSession } from '@/data/exercise-tagging';
import type { SyncStatusRow } from '@/data/google-health-status';
import { buildPainHistory, type PainHistory } from '@/data/pain-history';
import { painEntries, painMapFromRows } from '@/data/pain-map';
import { buildRecoveryView, recoveryFrom, type RecoveryView } from '@/data/recovery-view';
import { buildTrainingLoadView, loadChartDays, type TrainingLoadView } from '@/data/training-load-view';
import { createDemoDb, type DemoDb, type DemoScenario } from '@/demo/demo-data';

export const demoUnavailable = 'Demoda Google Health bağlantısı yok; veriler sentetik.';

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export class DemoStore {
  readonly scenario: DemoScenario;
  private readonly db: DemoDb;
  private nextId = 1;

  constructor(scenario: DemoScenario, today: string, now: Date) {
    this.scenario = scenario;
    this.db = createDemoDb(scenario, today, now);
  }

  async fetchCheckin(localDate: string): Promise<Result<Checkin | null>> {
    const c = this.db.checkins.find((x) => x.local_date === localDate);
    if (!c) return ok(null);
    return ok({ answers: c.answers, pain: painMapFromRows(this.db.pain.filter((p) => p.local_date === localDate)) });
  }

  async saveCheckin(localDate: string, checkin: Checkin): Promise<Result<null>> {
    this.db.checkins = [...this.db.checkins.filter((c) => c.local_date !== localDate), { local_date: localDate, answers: checkin.answers }];
    this.db.pain = [
      ...this.db.pain.filter((p) => p.local_date !== localDate),
      ...painEntries(checkin.pain).map((e) => ({ local_date: localDate, region: e.region, side: e.side, pain: e.pain })),
    ];
    return ok(null);
  }

  async insertSession(session: NewTrainingSession): Promise<Result<null>> {
    const exerciseId = session.exercise?.id ?? null;
    if (exerciseId && this.db.sessions.some((s) => s.exerciseSessionId === exerciseId)) {
      return { ok: false, message: 'Bu saat kaydı başka bir seansa bağlanmış. Listeyi yenileyip yeniden dene.' };
    }
    this.db.sessions = [
      ...this.db.sessions,
      {
        id: `demo-session-${this.nextId++}`,
        localDate: session.localDate,
        kind: session.kind,
        durationMin: session.durationMin,
        rpe: session.rpe,
        minutesPlayed: session.kind === 'game' ? session.minutesPlayed : null,
        exerciseSessionId: exerciseId,
      },
    ];
    return ok(null);
  }

  async fetchSessions(localDate: string): Promise<Result<TrainingSession[]>> {
    return ok(this.db.sessions.filter((s) => s.localDate === localDate));
  }

  async fetchPendingExercises(from: string, to: string): Promise<Result<ExerciseSession[]>> {
    const inRange = <T extends { localDate: string }>(x: T) => x.localDate >= from && x.localDate <= to;
    return ok(pendingExercises(this.db.exercises.filter((e) => inRange(e) && !e.dismissed), this.db.sessions.filter(inRange)));
  }

  async fetchExerciseToTag(id: string): Promise<Result<ExerciseToTag | null>> {
    const exercise = this.db.exercises.find((e) => e.id === id);
    if (!exercise) return ok(null);
    const sessions = this.db.sessions.filter((s) => s.localDate === exercise.localDate);
    return ok({ exercise, candidates: linkCandidates(exercise, sessions) });
  }

  async linkSession(sessionId: string, exercise: Pick<ExerciseSession, 'id' | 'startTime'>): Promise<Result<null>> {
    this.db.sessions = this.db.sessions.map((s) => (s.id === sessionId ? { ...s, exerciseSessionId: exercise.id } : s));
    return ok(null);
  }

  async dismissExercise(id: string): Promise<Result<null>> {
    this.db.exercises = this.db.exercises.map((e) => (e.id === id ? { ...e, dismissed: true } : e));
    return ok(null);
  }

  async fetchPainHistory(dates: readonly string[]): Promise<Result<PainHistory>> {
    return ok(buildPainHistory(dates, this.db.checkins, this.db.pain));
  }

  async fetchRecovery(today: string): Promise<Result<RecoveryView>> {
    const from = recoveryFrom(today);
    const inRange = (d: string) => d >= from && d <= today;
    return ok(
      buildRecoveryView(
        this.db.healthDaily.filter((r) => inRange(r.local_date)),
        this.db.sleep.filter((r) => inRange(r.local_date)),
        today,
      ),
    );
  }

  async fetchTrainingLoad(today: string): Promise<Result<TrainingLoadView>> {
    const rows = this.db.sessions.map((s) => ({ local_date: s.localDate, rpe: s.rpe, duration_min: s.durationMin }));
    const earliest = rows.reduce<string | null>((min, r) => (min === null || r.local_date < min ? r.local_date : min), null);
    const pending = await this.fetchPendingExercises(addIsoDays(today, -(loadChartDays - 1)), today);
    return ok(buildTrainingLoadView(rows, today, { earliest, untagged: pending.ok ? pending.value : [] }));
  }

  async fetchSyncStatus(): Promise<Result<SyncStatusRow | null>> {
    return ok(this.db.syncStatus);
  }
}
