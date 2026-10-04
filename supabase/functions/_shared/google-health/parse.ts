// Google Health yanıtlarını veritabanı satırlarına çevirir. Saf fonksiyonlar: ağ ve veritabanı yok.
// Kural: API'de olmayan değer null olur, sıfır uydurulmaz ("gün yok" ≠ "0 adım").

import type {
  DailyRollupDataPoint,
  DataPoint,
  Exercise,
  Int64,
  Sleep,
} from './api-types.ts';
import { civilToIso, durationSeconds } from './dates.ts';

export type DailyRow = { local_date: string } & Record<string, number | string | null>;

export interface SleepRow {
  source_id: string;
  local_date: string;
  start_time: string;
  end_time: string;
  start_utc_offset_s: number | null;
  end_utc_offset_s: number | null;
  sleep_type: string | null;
  is_main: boolean | null;
  is_nap: boolean | null;
  processed: boolean | null;
  minutes_in_period: number | null;
  minutes_asleep: number | null;
  minutes_awake: number | null;
  minutes_to_fall_asleep: number | null;
  minutes_after_wake_up: number | null;
  minutes_light: number | null;
  minutes_deep: number | null;
  minutes_rem: number | null;
  short_awakenings: number | null;
  source_updated_at: string | null;
}

export interface ExerciseRow {
  source_id: string;
  local_date: string;
  start_time: string;
  end_time: string;
  start_utc_offset_s: number | null;
  exercise_type: string;
  display_name: string | null;
  active_duration_s: number | null;
  avg_hr_bpm: number | null;
  calories_kcal: number | null;
  distance_m: number | null;
  steps: number | null;
  active_zone_minutes: number | null;
  hr_zone_light_s: number | null;
  hr_zone_moderate_s: number | null;
  hr_zone_vigorous_s: number | null;
  hr_zone_peak_s: number | null;
  source_updated_at: string | null;
}

export function toNumber(value: Int64 | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function toInt(value: Int64 | undefined | null): number | null {
  const n = toNumber(value);
  return n === null ? null : Math.round(n);
}

function round(value: number | null, digits: number): number | null {
  if (value === null) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

// Veri noktası adının son parçası: users/me/dataTypes/sleep/dataPoints/<kimlik>
export function sourceIdOf(point: DataPoint, fallbackStart: string): string {
  const id = point.name?.split('/').pop();
  return id && id.length > 0 ? id : `start:${fallbackStart}`;
}

// Günlük tipler (list): her biri kendi sütunlarını doldurur.
export type DailyListType =
  | 'daily-heart-rate-variability'
  | 'daily-resting-heart-rate'
  | 'daily-oxygen-saturation'
  | 'daily-respiratory-rate'
  | 'daily-sleep-temperature-derivations';

export function parseDailyListPoint(type: DailyListType, point: DataPoint): DailyRow | null {
  switch (type) {
    case 'daily-heart-rate-variability': {
      const v = point.dailyHeartRateVariability;
      const local_date = civilToIso(v?.date);
      if (!v || !local_date) return null;
      return {
        local_date,
        hrv_rmssd_ms: round(toNumber(v.averageHeartRateVariabilityMilliseconds), 2),
        hrv_deep_rmssd_ms: round(toNumber(v.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds), 2),
        hrv_entropy: round(toNumber(v.entropy), 4),
        nrem_hr_bpm: toInt(v.nonRemHeartRateBeatsPerMinute),
      };
    }
    case 'daily-resting-heart-rate': {
      const v = point.dailyRestingHeartRate;
      const local_date = civilToIso(v?.date);
      if (!v || !local_date) return null;
      return {
        local_date,
        resting_hr_bpm: toInt(v.beatsPerMinute),
        resting_hr_method: v.dailyRestingHeartRateMetadata?.calculationMethod ?? null,
      };
    }
    case 'daily-oxygen-saturation': {
      const v = point.dailyOxygenSaturation;
      const local_date = civilToIso(v?.date);
      if (!v || !local_date) return null;
      return {
        local_date,
        spo2_avg_pct: round(toNumber(v.averagePercentage), 2),
        spo2_lower_pct: round(toNumber(v.lowerBoundPercentage), 2),
        spo2_upper_pct: round(toNumber(v.upperBoundPercentage), 2),
      };
    }
    case 'daily-respiratory-rate': {
      const v = point.dailyRespiratoryRate;
      const local_date = civilToIso(v?.date);
      if (!v || !local_date) return null;
      return { local_date, respiratory_rate_bpm: round(toNumber(v.breathsPerMinute), 2) };
    }
    case 'daily-sleep-temperature-derivations': {
      const v = point.dailySleepTemperatureDerivations;
      const local_date = civilToIso(v?.date);
      if (!v || !local_date) return null;
      return {
        local_date,
        skin_temp_nightly_c: round(toNumber(v.nightlyTemperatureCelsius), 3),
        skin_temp_baseline_c: round(toNumber(v.baselineTemperatureCelsius), 3),
      };
    }
  }
}

// Günlük özetler (dailyRollUp). Değer alanı yoksa o gün atlanır.
export type DailyRollupType = 'heart-rate' | 'steps' | 'distance' | 'total-calories' | 'active-zone-minutes';

export function parseDailyRollupPoint(type: DailyRollupType, point: DailyRollupDataPoint): DailyRow | null {
  const local_date = civilToIso(point.civilStartTime?.date);
  if (!local_date) return null;
  switch (type) {
    case 'heart-rate': {
      const v = point.heartRate;
      if (!v || toNumber(v.beatsPerMinuteAvg) === null) return null;
      return {
        local_date,
        hr_min_bpm: round(toNumber(v.beatsPerMinuteMin), 1),
        hr_avg_bpm: round(toNumber(v.beatsPerMinuteAvg), 1),
        hr_max_bpm: round(toNumber(v.beatsPerMinuteMax), 1),
      };
    }
    case 'steps': {
      const steps = toInt(point.steps?.countSum);
      return steps === null ? null : { local_date, steps };
    }
    case 'distance': {
      const mm = toNumber(point.distance?.millimetersSum);
      return mm === null ? null : { local_date, distance_m: round(mm / 1000, 1) };
    }
    case 'total-calories': {
      const kcal = toNumber(point.totalCalories?.kcalSum);
      return kcal === null ? null : { local_date, calories_kcal: round(kcal, 1) };
    }
    case 'active-zone-minutes': {
      const v = point.activeZoneMinutes;
      if (!v) return null;
      return {
        local_date,
        azm_fat_burn: toInt(v.sumInFatBurnHeartZone) ?? 0,
        azm_cardio: toInt(v.sumInCardioHeartZone) ?? 0,
        azm_peak: toInt(v.sumInPeakHeartZone) ?? 0,
      };
    }
  }
}

function localDateFrom(civil: string | null, instant: string, offset: string | undefined): string | null {
  if (civil) return civil;
  const t = Date.parse(instant);
  if (Number.isNaN(t)) return null;
  const shifted = new Date(t + (durationSeconds(offset) ?? 0) * 1000);
  return shifted.toISOString().slice(0, 10);
}

function stageMinutes(sleep: Sleep, type: string): number | null {
  const stage = sleep.summary?.stagesSummary?.find((s) => s.type === type);
  return stage ? toInt(stage.minutes) : null;
}

export function parseSleep(point: DataPoint): SleepRow | null {
  const s = point.sleep;
  if (!s?.interval?.startTime || !s.interval.endTime) return null;
  const { interval } = s;
  // Uyku, uyanılan güne yazılır.
  const local_date = localDateFrom(civilToIso(interval.civilEndTime?.date), interval.endTime, interval.endUtcOffset);
  if (!local_date) return null;
  return {
    source_id: sourceIdOf(point, interval.startTime),
    local_date,
    start_time: interval.startTime,
    end_time: interval.endTime,
    start_utc_offset_s: durationSeconds(interval.startUtcOffset),
    end_utc_offset_s: durationSeconds(interval.endUtcOffset),
    sleep_type: s.type ?? null,
    is_main: s.metadata?.mainSleep ?? null,
    is_nap: s.metadata?.nap ?? null,
    processed: s.metadata?.processed ?? null,
    minutes_in_period: toInt(s.summary?.minutesInSleepPeriod),
    minutes_asleep: toInt(s.summary?.minutesAsleep),
    minutes_awake: toInt(s.summary?.minutesAwake),
    minutes_to_fall_asleep: toInt(s.summary?.minutesToFallAsleep),
    minutes_after_wake_up: toInt(s.summary?.minutesAfterWakeUp),
    minutes_light: stageMinutes(s, 'LIGHT'),
    minutes_deep: stageMinutes(s, 'DEEP'),
    minutes_rem: stageMinutes(s, 'REM'),
    short_awakenings: Array.isArray(s.shortAwakenings) ? s.shortAwakenings.length : null,
    source_updated_at: s.updateTime ?? null,
  };
}

function zoneSeconds(e: Exercise, key: 'lightTime' | 'moderateTime' | 'vigorousTime' | 'peakTime'): number | null {
  const s = durationSeconds(e.metricsSummary?.heartRateZoneDurations?.[key]);
  return s === null ? null : Math.round(s);
}

export function parseExercise(point: DataPoint): ExerciseRow | null {
  const e = point.exercise;
  if (!e?.interval?.startTime || !e.interval.endTime) return null;
  const { interval } = e;
  const local_date = localDateFrom(civilToIso(interval.civilStartTime?.date), interval.startTime, interval.startUtcOffset);
  if (!local_date) return null;
  const active = durationSeconds(e.activeDuration);
  const distanceMm = toNumber(e.metricsSummary?.distanceMillimeters);
  return {
    source_id: sourceIdOf(point, interval.startTime),
    local_date,
    start_time: interval.startTime,
    end_time: interval.endTime,
    start_utc_offset_s: durationSeconds(interval.startUtcOffset),
    exercise_type: e.exerciseType ?? 'EXERCISE_TYPE_UNSPECIFIED',
    display_name: e.displayName ?? null,
    active_duration_s: active === null ? null : Math.round(active),
    avg_hr_bpm: toInt(e.metricsSummary?.averageHeartRateBeatsPerMinute),
    calories_kcal: round(toNumber(e.metricsSummary?.caloriesKcal), 1),
    distance_m: distanceMm === null ? null : round(distanceMm / 1000, 1),
    steps: toInt(e.metricsSummary?.steps),
    active_zone_minutes: toInt(e.metricsSummary?.activeZoneMinutes),
    hr_zone_light_s: zoneSeconds(e, 'lightTime'),
    hr_zone_moderate_s: zoneSeconds(e, 'moderateTime'),
    hr_zone_vigorous_s: zoneSeconds(e, 'vigorousTime'),
    hr_zone_peak_s: zoneSeconds(e, 'peakTime'),
    source_updated_at: e.updateTime ?? null,
  };
}
