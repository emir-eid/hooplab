// Maç takvimi verisi (karar 0046): match_days satırları. "Bugün maç var" işareti (0036) aynı tablodur; tarih
// değişmez, yalnız saat ve yer güncellenir. Erişimi RLS korur (karar 0015). Demo modu açıksa bellekteki depoya gider.

import type { Match } from '@hooplab/engine';

import type { Result } from '@/data/daily-log';
import { toMatches, type MatchRow } from '@/data/match-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Maç takvimi alınamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';
const columns = 'local_date, start_time, venue';

/** [from, to] aralığındaki maçlar, eskiden yeniye. */
export async function fetchMatches(from: string, to: string): Promise<Result<Match[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchMatches(from, to);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.from('match_days').select(columns).gte('local_date', from).lte('local_date', to);
  if (error) return { ok: false, message: offline };
  return { ok: true, value: toMatches((data ?? []) as MatchRow[]) };
}

/** Yeni maç; o gün zaten maç varsa saat ve yeri güncellenir. */
export async function saveMatch(match: Match): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.saveMatch(match);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase
    .from('match_days')
    .insert({ local_date: match.date, start_time: match.startTime, venue: match.venue });
  if (!error) return { ok: true, value: null };
  if (error.code !== '23505') return { ok: false, message: failed };
  const updated = await supabase
    .from('match_days')
    .update({ start_time: match.startTime, venue: match.venue })
    .eq('local_date', match.date);
  return updated.error ? { ok: false, message: failed } : { ok: true, value: null };
}

export async function deleteMatch(localDate: string): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.deleteMatch(localDate);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase.from('match_days').delete().eq('local_date', localDate);
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}
