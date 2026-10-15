// Demo modunun bellekteki veritabanı (karar 0022): veri fonksiyonlarıyla aynı imzalar, ağ yok.
// Kayıtlar (check-in, seans, etiketleme) yalnız bellekte; uygulama kapanınca veya senaryo değişince sıfırlanır.

import { addIsoDays, checkinBaseline, readCheckin, type CheckinReading, type DayType, type Match, type Meal, type Trip } from '@hooplab/engine';

import { routingNotes } from '../../../../supabase/functions/_shared/coach/contract.ts';

import type { CoachReply } from '@/data/coach';
import type { AskEntry, AskReply } from '@/data/coach-ask';
import type { CoachSnapshot } from '@/data/coach-snapshot';
import type { Checkin, ExerciseToTag, NewTrainingSession, Result, TrainingSession } from '@/data/daily-log';
import { buildEnergyView, energyFrom, energyHoursFrom, type EnergyView } from '@/data/energy-view';
import { linkCandidates, pendingExercises, type ExerciseSession } from '@/data/exercise-tagging';
import type { SyncStatusRow } from '@/data/google-health-status';
import { buildPainHistory, type PainHistory } from '@/data/pain-history';
import { painEntries, painMapFromRows } from '@/data/pain-map';
import { buildRecoveryView, recoveryFrom, type RecoveryView } from '@/data/recovery-view';
import type { MealInput } from '@/data/nutrition';
import { buildNutritionView, distinctRecent, recentMealDays, toMeals, toStoredItems, weightFrom, type NutritionView } from '@/data/nutrition-view';
import { buildRegionLoadView, regionFrom, type RegionLoadView } from '@/data/region-load-view';
import { buildTrainingLoadView, loadChartDays, type TrainingLoadView } from '@/data/training-load-view';
import { buildWeeklyReportView, firstWeekOf, type WeeklyReport } from '@/data/weekly-report-view';
import { askDemoOnlySamples } from '@/copy/coach-ask';
import { demoAnswer } from '@/demo/demo-ask';
import { demoCoachSummary } from '@/demo/demo-coach';
import { createDemoDb, type DemoDb, type DemoScenario } from '@/demo/demo-data';

export const demoUnavailable = 'Demoda Google Health bağlantısı yok; veriler sentetik.';

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export class DemoStore {
  readonly scenario: DemoScenario;
  private readonly db: DemoDb;
  private nextId = 1;
  /** Koça sorulan örnek sorular (yalnız bellekte), en yeni önce. */
  private asks: AskEntry[] = [];

  constructor(scenario: DemoScenario, today: string, now: Date) {
    this.scenario = scenario;
    this.db = createDemoDb(scenario, today, now);
  }

  async fetchCheckin(localDate: string): Promise<Result<Checkin | null>> {
    const c = this.db.checkins.find((x) => x.local_date === localDate);
    if (!c) return ok(null);
    return ok({ answers: c.answers, pain: painMapFromRows(this.db.pain.filter((p) => p.local_date === localDate)) });
  }

  async fetchCheckinReading(today: string): Promise<Result<CheckinReading>> {
    const from = addIsoDays(today, -checkinBaseline.baselineDays);
    const days = this.db.checkins
      .filter((c) => c.local_date >= from && c.local_date <= today)
      .map((c) => ({ date: c.local_date, answers: c.answers }));
    return ok(readCheckin(days, today));
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
        contentTags: session.contentTags,
        sweat: session.sweat,
        exerciseSessionId: exerciseId,
        startedAt: session.exercise?.startTime ?? null,
        kcal: null,
      },
    ];
    return ok(null);
  }

  async fetchSessions(localDate: string): Promise<Result<TrainingSession[]>> {
    return ok(this.db.sessions.filter((s) => s.localDate === localDate).map((s) => this.withKcal(s)));
  }

  /** Seansın kalorisi bağlı saat oturumundan (gerçek sorgudaki gömülü okuma gibi). */
  private withKcal(s: TrainingSession): TrainingSession {
    const kcal = s.exerciseSessionId ? (this.db.exercises.find((e) => e.id === s.exerciseSessionId)?.kcal ?? null) : null;
    return { ...s, kcal };
  }

  async fetchEnergy(today: string): Promise<Result<EnergyView>> {
    const from = energyFrom(today);
    const hoursFrom = energyHoursFrom(today);
    return ok(
      buildEnergyView(
        this.db.energy.filter((r) => r.local_date >= from && r.local_date <= today),
        today,
        this.db.energyHours.filter((r) => r.local_date >= hoursFrom && r.local_date <= today),
      ),
    );
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
    const rows = this.db.sessions.map((s) => ({ local_date: s.localDate, rpe: s.rpe, duration_min: s.durationMin, kind: s.kind }));
    const earliest = rows.reduce<string | null>((min, r) => (min === null || r.local_date < min ? r.local_date : min), null);
    const pending = await this.fetchPendingExercises(addIsoDays(today, -(loadChartDays - 1)), today);
    return ok(buildTrainingLoadView(rows, today, { earliest, untagged: pending.ok ? pending.value : [] }));
  }

  async fetchRegionLoad(today: string, now: Date): Promise<Result<RegionLoadView>> {
    const from = regionFrom(today);
    const rows = this.db.sessions
      .filter((s) => s.localDate >= from && s.localDate <= today)
      .map((s) => ({
        local_date: s.localDate,
        rpe: s.rpe,
        duration_min: s.durationMin,
        kind: s.kind,
        content_tags: s.contentTags,
        started_at: s.startedAt,
      }));
    const earliest = this.db.sessions.reduce<string | null>((min, s) => (min === null || s.localDate < min ? s.localDate : min), null);
    const yesterday = addIsoDays(today, -1);
    const history = buildPainHistory([yesterday, today], this.db.checkins, this.db.pain);
    const readings = (date: string) => {
      const map = history.byDate[date];
      return map ? painEntries(map) : null;
    };
    return ok(buildRegionLoadView(rows, today, { earliest, now, painToday: readings(today), painYesterday: readings(yesterday) }));
  }

  async fetchNutrition(today: string): Promise<Result<NutritionView>> {
    const from = weightFrom(today);
    const weights = this.db.weights.filter((w) => w.local_date >= from && w.local_date <= today);
    const on = (date: string) => this.db.sessions.filter((s) => s.localDate === date);
    return ok(
      buildNutritionView(
        today,
        weights,
        on(today),
        this.db.dayTypes[today] ?? null,
        this.db.meals,
        this.db.fluids,
        this.db.matches,
        on(addIsoDays(today, -1)),
      ),
    );
  }

  async fetchWeeklyReport(weekStart: string, today: string): Promise<Result<WeeklyReport>> {
    const db = this.db;
    const earliest = (dates: string[]) => dates.reduce<string | null>((min, d) => (min === null || d < min ? d : min), null);
    const earliestSession = earliest(db.sessions.map((s) => s.localDate));
    const view = buildWeeklyReportView(
      {
        sessions: db.sessions.map((s) => ({
          local_date: s.localDate,
          rpe: s.rpe,
          duration_min: s.durationMin,
          kind: s.kind,
          minutes_played: s.minutesPlayed,
          sweat: s.sweat !== null,
        })),
        earliestSession,
        healthDaily: db.healthDaily,
        energy: db.energy,
        sleep: db.sleep,
        checkins: db.checkins.map((c) => ({ local_date: c.local_date, ...c.answers })),
        pain: db.pain,
        weights: db.weights,
        dayTypes: Object.entries(db.dayTypes).map(([local_date, day_type]) => ({ local_date, day_type })),
        matches: db.matches,
        meals: db.meals,
        fluids: db.fluids,
      },
      weekStart,
      today,
    );
    return ok({
      view,
      firstWeek: firstWeekOf([earliestSession, earliest(db.healthDaily.map((r) => r.local_date)), earliest(db.checkins.map((c) => c.local_date))]),
    });
  }

  async fetchRecentMeals(today: string): Promise<Result<Meal[]>> {
    const from = addIsoDays(today, -recentMealDays);
    return ok(distinctRecent(toMeals(this.db.meals.filter((m) => m.local_date >= from && m.local_date <= today))));
  }

  async fetchMeal(id: string): Promise<Result<Meal | null>> {
    return ok(toMeals(this.db.meals.filter((m) => m.id === id))[0] ?? null);
  }

  async saveMeal(meal: MealInput): Promise<Result<null>> {
    const old = meal.id ? this.db.meals.find((m) => m.id === meal.id) : undefined;
    const row = {
      id: old?.id ?? `demo-meal-new-${this.nextId++}`,
      local_date: meal.localDate,
      slot: meal.slot,
      items: toStoredItems(meal.items),
      created_at: old?.created_at ?? new Date().toISOString(),
    };
    this.db.meals = [...this.db.meals.filter((m) => m.id !== row.id), row];
    return ok(null);
  }

  async addFluid(localDate: string, ml: number): Promise<Result<null>> {
    this.db.fluids = [
      ...this.db.fluids,
      { id: `demo-fluid-new-${this.nextId++}`, local_date: localDate, volume_ml: ml, created_at: new Date().toISOString() },
    ];
    return ok(null);
  }

  async deleteFluid(id: string): Promise<Result<null>> {
    this.db.fluids = this.db.fluids.filter((f) => f.id !== id);
    return ok(null);
  }

  async deleteMeal(id: string): Promise<Result<null>> {
    this.db.meals = this.db.meals.filter((m) => m.id !== id);
    return ok(null);
  }

  async saveWeight(localDate: string, kg: number): Promise<Result<null>> {
    this.db.weights = [...this.db.weights.filter((w) => w.local_date !== localDate), { local_date: localDate, weight_kg: kg }];
    return ok(null);
  }

  async saveDayType(localDate: string, dayType: DayType | null): Promise<Result<null>> {
    const { [localDate]: _removed, ...rest } = this.db.dayTypes;
    this.db.dayTypes = dayType === null ? rest : { ...rest, [localDate]: dayType };
    return ok(null);
  }

  async saveMatchDay(localDate: string, matchDay: boolean): Promise<Result<null>> {
    if (!matchDay) return this.deleteMatch(localDate);
    if (this.db.matches.some((m) => m.date === localDate)) return ok(null);
    return this.saveMatch({ date: localDate, startTime: null, venue: null });
  }

  async fetchMatches(from: string, to: string): Promise<Result<Match[]>> {
    return ok(this.db.matches.filter((m) => m.date >= from && m.date <= to).sort((a, b) => (a.date < b.date ? -1 : 1)));
  }

  async saveMatch(match: Match): Promise<Result<null>> {
    this.db.matches = [...this.db.matches.filter((m) => m.date !== match.date), { ...match }];
    return ok(null);
  }

  async deleteMatch(localDate: string): Promise<Result<null>> {
    this.db.matches = this.db.matches.filter((m) => m.date !== localDate);
    return ok(null);
  }

  async fetchTrips(from: string, to: string): Promise<Result<Trip[]>> {
    return ok(this.db.trips.filter((t) => t.departDate >= from && t.departDate <= to).sort((a, b) => (a.departDate < b.departDate ? -1 : 1)));
  }

  async saveTrip(trip: Trip): Promise<Result<null>> {
    const id = trip.id ?? `demo-trip-${this.nextId++}`;
    this.db.trips = [...this.db.trips.filter((t) => t.id !== id), { ...trip, id }];
    return ok(null);
  }

  async deleteTrip(id: string): Promise<Result<null>> {
    this.db.trips = this.db.trips.filter((t) => t.id !== id);
    return ok(null);
  }

  /** Koçun özeti: önceden yazılmış sentetik metin, o anki demo değerlerinden (karar 0032); API çağrılmaz. */
  async fetchCoachDaily(snapshot: CoachSnapshot): Promise<Result<CoachReply>> {
    return ok({
      response: { status: 'accepted', cached: true, sentences: demoCoachSummary(this.scenario, snapshot), omitted: 0, matchDay: snapshot.matchDay, notes: routingNotes(snapshot) },
      demo: true,
    });
  }

  /** Koçta soru-cevap: örnek sorulara önceden yazılmış sentetik yanıt (karar 0037); API çağrılmaz. */
  async askCoach(question: string, localDate: string): Promise<Result<AskReply>> {
    const answer = demoAnswer(question);
    if (!answer) return { ok: false, message: askDemoOnlySamples };
    this.asks.unshift({ id: `demo-ask-${this.nextId++}`, createdAt: new Date().toISOString(), localDate, question: question.trim(), answer, demo: true });
    return ok({ response: answer, demo: true });
  }

  async fetchAskHistory(): Promise<Result<AskEntry[]>> {
    return ok([...this.asks]);
  }

  async fetchSyncStatus(): Promise<Result<SyncStatusRow | null>> {
    return ok(this.db.syncStatus);
  }
}
