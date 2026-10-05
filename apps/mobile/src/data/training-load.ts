// Antrenman yükü verisi: seans kayıtları ve etiket bekleyen saat oturumları (karar 0020, 0025).
// Erişimi RLS korur (karar 0015): sahibi yalnız kendi satırlarını okur.

import { addIsoDays } from '@hooplab/engine';

import { fetchPendingExercises, type Result } from '@/data/daily-log';
import { buildTrainingLoadView, loadChartDays, loadFrom, type LoadSessionRow, type TrainingLoadView } from '@/data/training-load-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Seans kayıtları alınamadı. İnternetini kontrol edip yeniden dene.';

export async function fetchTrainingLoad(today: string): Promise<Result<TrainingLoadView>> {
  const demo = demoStore();
  if (demo) return demo.fetchTrainingLoad(today);
  if (!supabase) return { ok: false, message: offline };
  const [rows, first, pending] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('local_date, rpe, duration_min')
      .gte('local_date', loadFrom(today))
      .lte('local_date', today),
    supabase.from('training_sessions').select('local_date').order('local_date', { ascending: true }).limit(1).maybeSingle(),
    fetchPendingExercises(addIsoDays(today, -(loadChartDays - 1)), today),
  ]);
  if (rows.error || first.error || !pending.ok) return { ok: false, message: offline };
  const earliest = (first.data as { local_date: string } | null)?.local_date ?? null;
  return {
    ok: true,
    value: buildTrainingLoadView(rows.data as LoadSessionRow[], today, { earliest, untagged: pending.value }),
  };
}
