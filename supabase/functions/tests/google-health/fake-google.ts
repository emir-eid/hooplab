// Sahte Google (OAuth token uç noktası + Health API v4). Tamamen sentetik, deterministik değerler.
// Birim testleri `fetch` olarak, yerel uçtan uca deneme (tools/dev/fake-google-health.ts) HTTP sunucusu
// olarak kullanır. Gerçek API'nin kurallarını taklit eder: 14 / 90 gün sınırı, sayfalama, int64 dize.

import { addDays, daysBetween, isoToCivil } from '../../_shared/google-health/dates.ts';
import { GOOGLE_HEALTH_SCOPES } from '../../_shared/google-health/oauth.ts';

export const FAKE_ACCESS_TOKEN = 'erisim-sentetik';
export const FAKE_REFRESH_TOKEN = 'yenileme-sentetik';
export const EXPIRED_REFRESH_TOKEN = 'dusmus-sentetik';

export interface FakeGoogleOptions {
  timeZone?: string;
  // Bu tiplere 403 döner (yetki eksik senaryosu).
  failTypes?: string[];
  // Token değişiminde verilecek kapsam (eksik kapsam senaryosu).
  grantedScope?: string;
}

export interface FakeCall {
  method: string;
  path: string;
  dataType?: string;
  from?: string;
  to?: string;
  family?: string;
  pageToken?: string;
}

const MAX_ROLLUP_DAYS: Record<string, number> = { 'heart-rate': 14, 'total-calories': 14 };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function rangeFromFilter(filter: string): [string, string] {
  const values = [...filter.matchAll(/"(\d{4}-\d{2}-\d{2})"/g)].map((m) => m[1] as string);
  if (values.length !== 2) throw new Error(`beklenmeyen filtre: ${filter}`);
  return [values[0] as string, values[1] as string];
}

function days(from: string, to: string): string[] {
  return Array.from({ length: Math.max(0, daysBetween(from, to)) }, (_, i) => addDays(from, i));
}

// Gün sırasına bağlı sentetik değer (gerçek bir kişiye ait değil).
const seed = (iso: string) => Number(iso.slice(8, 10));

function dailyPoint(type: string, iso: string): Record<string, unknown> {
  const date = isoToCivil(iso);
  const k = seed(iso);
  switch (type) {
    case 'daily-heart-rate-variability':
      return {
        dailyHeartRateVariability: {
          date,
          averageHeartRateVariabilityMilliseconds: 40 + (k % 9) + 0.123,
          deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds: 50 + (k % 5),
          entropy: 2.5,
          nonRemHeartRateBeatsPerMinute: String(50 + (k % 4)),
        },
      };
    case 'daily-resting-heart-rate':
      return {
        dailyRestingHeartRate: {
          date,
          beatsPerMinute: String(45 + (k % 6)),
          dailyRestingHeartRateMetadata: { calculationMethod: 'WITH_SLEEP' },
        },
      };
    case 'daily-oxygen-saturation':
      return { dailyOxygenSaturation: { date, averagePercentage: 96.5, lowerBoundPercentage: 94, upperBoundPercentage: 98 } };
    case 'daily-respiratory-rate':
      return { dailyRespiratoryRate: { date, breathsPerMinute: 14.2 } };
    case 'daily-sleep-temperature-derivations':
      return { dailySleepTemperatureDerivations: { date, nightlyTemperatureCelsius: 33.4, baselineTemperatureCelsius: 33.3 } };
    default:
      throw new Error(`bilinmeyen günlük tip: ${type}`);
  }
}

function rollupValue(type: string, iso: string): Record<string, unknown> {
  const k = seed(iso);
  switch (type) {
    case 'heart-rate':
      return { heartRate: { beatsPerMinuteMin: 44, beatsPerMinuteAvg: 70 + (k % 5), beatsPerMinuteMax: 170 } };
    case 'steps':
      return { steps: { countSum: String(6000 + k * 100) } };
    case 'distance':
      return { distance: { millimetersSum: String(4_500_000 + k * 1000) } };
    case 'total-calories':
      return { totalCalories: { kcalSum: 2800.25 } };
    case 'active-zone-minutes':
      return { activeZoneMinutes: { sumInFatBurnHeartZone: '20', sumInCardioHeartZone: '30' } };
    default:
      return {};
  }
}

function sleepPoint(iso: string): Record<string, unknown> {
  const prev = addDays(iso, -1);
  return {
    name: `users/me/dataTypes/sleep/dataPoints/uyku-${iso}`,
    sleep: {
      interval: {
        startTime: `${prev}T20:00:00Z`,
        endTime: `${iso}T04:00:00Z`,
        startUtcOffset: '10800s',
        endUtcOffset: '10800s',
        civilEndTime: { date: isoToCivil(iso) },
      },
      type: 'STAGES',
      metadata: { mainSleep: true, nap: false, processed: true },
      summary: {
        minutesInSleepPeriod: '480',
        minutesAsleep: '440',
        minutesAwake: '40',
        minutesToFallAsleep: '8',
        minutesAfterWakeUp: '0',
        stagesSummary: [
          { type: 'LIGHT', minutes: '240', count: '20' },
          { type: 'DEEP', minutes: '90', count: '5' },
          { type: 'REM', minutes: '110', count: '6' },
          { type: 'AWAKE', minutes: '40', count: '12' },
        ],
      },
      shortAwakenings: [{}, {}],
      updateTime: `${iso}T05:00:00Z`,
    },
  };
}

function exercisePoint(iso: string): Record<string, unknown> {
  return {
    name: `users/me/dataTypes/exercise/dataPoints/egzersiz-${iso}`,
    exercise: {
      interval: {
        startTime: `${iso}T15:00:00Z`,
        endTime: `${iso}T16:45:00Z`,
        startUtcOffset: '10800s',
        endUtcOffset: '10800s',
        civilStartTime: { date: isoToCivil(iso) },
      },
      exerciseType: 'SPORT',
      displayName: 'Sport',
      activeDuration: '6000s',
      notes: 'serbest metin alınmamalı',
      metricsSummary: {
        caloriesKcal: 900.5,
        distanceMillimeters: 5_000_000,
        steps: '9000',
        activeZoneMinutes: '60',
        averageHeartRateBeatsPerMinute: '138',
        heartRateZoneDurations: { lightTime: '1200s', moderateTime: '1800s', vigorousTime: '1500s', peakTime: '600s' },
      },
    },
  };
}

function page<T>(items: T[], pageSize: number, pageToken: string | null): { items: T[]; next?: string } {
  const start = pageToken ? Number(pageToken) : 0;
  const end = start + pageSize;
  return end < items.length ? { items: items.slice(start, end), next: String(end) } : { items: items.slice(start) };
}

export function createFakeGoogle(options: FakeGoogleOptions = {}) {
  const calls: FakeCall[] = [];

  const handle = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith('/token')) {
      const form = new URLSearchParams(await request.text());
      calls.push({ method: 'POST', path: '/token' });
      if (form.get('grant_type') === 'authorization_code') {
        if (!form.get('code_verifier')) return json({ error: 'invalid_request' }, 400);
        return json({
          access_token: FAKE_ACCESS_TOKEN,
          refresh_token: FAKE_REFRESH_TOKEN,
          expires_in: 3599,
          scope: options.grantedScope ?? GOOGLE_HEALTH_SCOPES.join(' '),
          token_type: 'Bearer',
        });
      }
      if (form.get('refresh_token') === EXPIRED_REFRESH_TOKEN) {
        return json({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }, 400);
      }
      return json({ access_token: FAKE_ACCESS_TOKEN, expires_in: 3599, token_type: 'Bearer' });
    }

    if (path.endsWith('/revoke')) {
      calls.push({ method: 'POST', path: '/revoke' });
      return json({});
    }

    if (request.headers.get('Authorization') !== `Bearer ${FAKE_ACCESS_TOKEN}`) {
      return json({ error: { code: 401, status: 'UNAUTHENTICATED' } }, 401);
    }

    if (path.endsWith('/users/me/settings')) {
      calls.push({ method: 'GET', path: '/settings' });
      return json({ timeZone: options.timeZone ?? 'Europe/Istanbul' });
    }

    const match = /\/users\/me\/dataTypes\/([a-z0-9-]+)\/dataPoints(:dailyRollUp)?$/.exec(path);
    if (!match) return json({ error: { code: 404, status: 'NOT_FOUND' } }, 404);
    const dataType = match[1] as string;
    if (options.failTypes?.includes(dataType)) {
      calls.push({ method: request.method, path, dataType });
      return json({ error: { code: 403, status: 'PERMISSION_DENIED' } }, 403);
    }

    if (match[2]) {
      const body = (await request.json()) as {
        range: { start: { date: { year: number; month: number; day: number } }; end: { date: { year: number; month: number; day: number } } };
        dataSourceFamily?: string;
        pageToken?: string;
        pageSize?: number;
      };
      const iso = (d: { year: number; month: number; day: number }) =>
        `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
      const from = iso(body.range.start.date);
      const to = iso(body.range.end.date);
      calls.push({ method: 'POST', path, dataType, from, to, ...(body.dataSourceFamily ? { family: body.dataSourceFamily } : {}) });
      // Gerçek API (2026-10-04 ölçümü): dailyRollUp'ta pageSize INVALID_ARGUMENT; kaynak ailesi tam adla.
      if (body.pageSize !== undefined) return json({ error: { code: 400, status: 'INVALID_ARGUMENT' } }, 400);
      if (body.dataSourceFamily !== undefined && !body.dataSourceFamily.startsWith('users/me/dataSourceFamilies/')) {
        return json({ error: { code: 400, status: 'INVALID_ARGUMENT' } }, 400);
      }
      if (daysBetween(from, to) > (MAX_ROLLUP_DAYS[dataType] ?? 90)) {
        return json({ error: { code: 400, status: 'INVALID_ARGUMENT' } }, 400);
      }
      return json({
        rollupDataPoints: days(from, to).map((d) => ({
          civilStartTime: { date: isoToCivil(d) },
          civilEndTime: { date: isoToCivil(addDays(d, 1)) },
          ...rollupValue(dataType, d),
        })),
      });
    }

    const [from, to] = rangeFromFilter(url.searchParams.get('filter') ?? '');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '1440');
    const pageToken = url.searchParams.get('pageToken');
    calls.push({ method: 'GET', path, dataType, from, to, ...(pageToken ? { pageToken } : {}) });
    let points: Array<Record<string, unknown>>;
    if (dataType === 'sleep') points = days(from, to).map(sleepPoint);
    else if (dataType === 'exercise') points = days(from, to).filter((d) => seed(d) % 2 === 0).map(exercisePoint);
    else points = days(from, to).map((d) => dailyPoint(dataType, d));
    // Gerçek API gibi en yeniden eskiye.
    points.reverse();
    const { items, next } = page(points, pageSize, pageToken);
    return json({ dataPoints: items, ...(next ? { nextPageToken: next } : {}) });
  };

  return {
    calls,
    handle,
    fetch: (input: string, init?: RequestInit) => handle(new Request(input, init)),
  };
}
