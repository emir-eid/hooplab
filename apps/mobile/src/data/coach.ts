// Koçun günlük özeti (karar 0032): uygulama anlık değerleri coach-daily'ye gönderir. Model metni yalnız sunucudaki
// denetimden geçtiyse gelir; sır uygulamaya girmez. Demo modunda API çağrılmaz, sentetik özet döner (karar 0022).
//
// Kipler: `peek` yalnız saklanan sonuca bakar (o gün deneme yoksa model çağrılmaz), `generate` gerekirse yazdırır
// (o gün kayıt varsa sunucu saklananı döner), `regenerate` elle yeniden yazdırır (günde sınırlı).

import type { DailyResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';

import type { CoachSnapshot } from '@/data/coach-snapshot';
import { checkCoachSnapshot } from '@/data/coach-snapshot';
import type { Result } from '@/data/daily-log';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';
import { coachNotConfigured, coachOffline } from '@/copy/coach';

export type CoachMode = 'peek' | 'generate' | 'regenerate';

export interface CoachReply {
  response: DailyResponse;
  /** Demo sporcunun sentetik özeti. */
  demo: boolean;
}

/** Ücretsiz planda fonksiyon en fazla 150 sn çalışır; istemci biraz önce vazgeçer. */
const timeoutMs = 140_000;

// Aynı gün ve kip için süren istek paylaşılır: ekran art arda odaklanınca model iki kez çağrılmasın.
const inFlight = new Map<string, Promise<Result<CoachReply>>>();

function isDailyResponse(value: unknown): value is DailyResponse {
  const status = (value as { status?: unknown } | null)?.status;
  return typeof status === 'string' && ['accepted', 'rejected', 'failed', 'none', 'invalid', 'limit'].includes(status);
}

async function invoke(snapshot: CoachSnapshot, mode: CoachMode): Promise<Result<CoachReply>> {
  if (!supabase) return { ok: false, message: coachOffline };
  const query = mode === 'peek' ? '?peek=1' : mode === 'regenerate' ? '?regenerate=1' : '';
  const { data, error } = await supabase.functions.invoke<unknown>(`coach-daily${query}`, { body: snapshot, timeout: timeoutMs });
  if (!error) {
    return isDailyResponse(data) ? { ok: true, value: { response: data, demo: false } } : { ok: false, message: coachOffline };
  }
  // 2xx dışı yanıt: sunucunun gövdesi (sınır, geçersiz, başarısız deneme) ya da `{ error }` kodu.
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    let body: unknown = null;
    try {
      body = await context.clone().json();
    } catch {
      body = null;
    }
    if (isDailyResponse(body)) return { ok: true, value: { response: body, demo: false } };
    if (context.status === 503) return { ok: false, message: coachNotConfigured };
  }
  return { ok: false, message: coachOffline };
}

export function fetchCoachDaily(snapshot: CoachSnapshot, mode: CoachMode): Promise<Result<CoachReply>> {
  const demo = demoStore();
  if (demo) return demo.fetchCoachDaily(snapshot);
  const checked = checkCoachSnapshot(snapshot);
  if (!checked.ok) {
    // Değer içermeyen alan yolları: geliştirmede neyin bozulduğu görünsün.
    if (__DEV__) console.warn('Koç anlık değerleri geçersiz:', checked.paths.join(', '));
    return Promise.resolve({ ok: true, value: { response: { status: 'invalid', errors: checked.paths }, demo: false } });
  }
  const key = `${snapshot.date}:${mode}`;
  const running = inFlight.get(key);
  if (running) return running;
  const request = invoke(snapshot, mode).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
