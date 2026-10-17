// Koçun haftalık yorumu (karar 0052): uygulama biten haftanın sayılarını coach-weekly'ye gönderir. Model metni yalnız
// sunucudaki denetimden geçtiyse gelir. Demo modunda API çağrılmaz, sentetik yorum döner.
//
// Kipler: `peek` yalnız saklanana bakar (model çağrılmaz), `generate` yoksa yazdırır, `regenerate` elle yeniden yazdırır
// (hafta başına sınırlı).

import type { WeeklyResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';

import { coachNotConfigured, coachOffline } from '@/copy/coach';
import { checkWeeklyCoachSnapshot, type WeeklySnapshot } from '@/data/coach-weekly-snapshot';
import type { Result } from '@/data/daily-log';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

export type WeeklyCoachMode = 'peek' | 'generate' | 'regenerate';

export interface WeeklyCoachReply {
  response: WeeklyResponse;
  demo: boolean;
}

/** Ücretsiz planda fonksiyon en fazla 150 sn çalışır; istemci biraz önce vazgeçer. */
const timeoutMs = 140_000;

const inFlight = new Map<string, Promise<Result<WeeklyCoachReply>>>();

function isWeeklyResponse(value: unknown): value is WeeklyResponse {
  const status = (value as { status?: unknown } | null)?.status;
  return typeof status === 'string' && ['accepted', 'rejected', 'failed', 'none', 'invalid', 'limit'].includes(status);
}

async function invoke(snapshot: WeeklySnapshot, mode: WeeklyCoachMode): Promise<Result<WeeklyCoachReply>> {
  if (!supabase) return { ok: false, message: coachOffline };
  const query = mode === 'peek' ? '?peek=1' : mode === 'regenerate' ? '?regenerate=1' : '';
  const { data, error } = await supabase.functions.invoke<unknown>(`coach-weekly${query}`, { body: snapshot, timeout: timeoutMs });
  if (!error) {
    return isWeeklyResponse(data) ? { ok: true, value: { response: data, demo: false } } : { ok: false, message: coachOffline };
  }
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    let body: unknown = null;
    try {
      body = await context.clone().json();
    } catch {
      body = null;
    }
    if (isWeeklyResponse(body)) return { ok: true, value: { response: body, demo: false } };
    if (context.status === 503) return { ok: false, message: coachNotConfigured };
  }
  return { ok: false, message: coachOffline };
}

export function fetchCoachWeekly(snapshot: WeeklySnapshot, mode: WeeklyCoachMode): Promise<Result<WeeklyCoachReply>> {
  const demo = demoStore();
  if (demo) return demo.fetchCoachWeekly(snapshot, mode);
  const checked = checkWeeklyCoachSnapshot(snapshot);
  if (!checked.ok) {
    if (__DEV__) console.warn('Haftalık koç değerleri geçersiz:', checked.paths.join(', '));
    return Promise.resolve({ ok: true, value: { response: { status: 'invalid', errors: checked.paths }, demo: false } });
  }
  const key = `${snapshot.weekStart}:${mode}`;
  const running = inFlight.get(key);
  if (running) return running;
  const request = invoke(snapshot, mode).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
