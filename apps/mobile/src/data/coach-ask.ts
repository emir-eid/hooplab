// Koçta soru-cevap (karar 0032, 0037): uygulama soruyu, yerel günü ve varsa bugünün anlık değerlerini coach-ask'a
// gönderir; geçmişi coach_messages'tan okur (sahibi okur, RLS). Model metni yalnız sunucudaki denetimden geçtiyse
// gelir; sır uygulamaya girmez. Demo modunda API çağrılmaz, örnek sorulara sentetik yanıt döner (karar 0022).

import type { AskResponse, StoredAskResponse } from '../../../../supabase/functions/_shared/coach/contract.ts';

import { coachOffline, coachNotConfigured } from '@/copy/coach';
import { askDailyLimit } from '@/copy/coach-ask';
import { checkCoachSnapshot, type CoachSnapshot } from '@/data/coach-snapshot';
import type { Result } from '@/data/daily-log';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

export interface AskEntry {
  id: string;
  /** ISO zaman damgası. */
  createdAt: string;
  localDate: string;
  question: string;
  answer: StoredAskResponse;
  demo: boolean;
}

export interface AskReply {
  response: AskResponse;
  demo: boolean;
}

/** Sınıflandırma ve yanıt en fazla ~140 sn (ask.ts askTimeouts); istemci aynı sürede vazgeçer. */
const timeoutMs = 140_000;

const storedStatuses = ['answered', 'no_source', 'rejected', 'routed', 'failed'];
const isStored = (v: unknown): v is StoredAskResponse => storedStatuses.includes((v as { status?: unknown } | null)?.status as string);
const isResponse = (v: unknown): v is AskResponse =>
  isStored(v) || ['invalid', 'limit'].includes((v as { status?: unknown } | null)?.status as string);

export async function askCoach(question: string, localDate: string, snapshot: CoachSnapshot | null): Promise<Result<AskReply>> {
  const demo = demoStore();
  if (demo) return demo.askCoach(question, localDate);
  if (!supabase) return { ok: false, message: coachOffline };
  // Geçersiz anlık değer gönderilmez; soru genel gider (sunucu da reddederdi).
  const usable = snapshot && checkCoachSnapshot(snapshot).ok ? snapshot : null;
  const { data, error } = await supabase.functions.invoke<unknown>('coach-ask', {
    body: { date: localDate, question, snapshot: usable },
    timeout: timeoutMs,
  });
  if (!error) return isResponse(data) ? { ok: true, value: { response: data, demo: false } } : { ok: false, message: coachOffline };
  // 2xx dışı yanıt: sunucunun gövdesi (sınır, geçersiz, başarısız) ya da `{ error }` kodu.
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    let body: unknown = null;
    try {
      body = await context.clone().json();
    } catch {
      body = null;
    }
    if (isResponse(body)) return { ok: true, value: { response: body, demo: false } };
    if (context.status === 503) return { ok: false, message: coachNotConfigured };
  }
  return { ok: false, message: coachOffline };
}

/** Son sorular, en yeni önce. Bugünkü soru sayısı da buradan (kalan hak bilgisi). */
export async function fetchAskHistory(): Promise<Result<AskEntry[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchAskHistory();
  if (!supabase) return { ok: false, message: coachOffline };
  const { data, error } = await supabase
    .from('coach_messages')
    .select('id, created_at, local_date, question, answer')
    .order('created_at', { ascending: false })
    .limit(askDailyLimit * 3);
  if (error) return { ok: false, message: 'Önceki sorular yüklenemedi.' };
  return {
    ok: true,
    value: (data ?? []).flatMap((r) =>
      isStored(r.answer)
        ? [{ id: r.id as string, createdAt: r.created_at as string, localDate: r.local_date as string, question: r.question as string, answer: r.answer, demo: false }]
        : [],
    ),
  };
}
