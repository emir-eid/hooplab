// Kas ve tendon bölge yükü verisi (karar 0027): son 31 günün seansları ve bugün / dünün ağrı haritası.
// Erişimi RLS korur (karar 0015): sahibi yalnız kendi satırlarını okur.

import { addIsoDays } from '@hooplab/engine';

import { fetchPainHistory, type Result } from '@/data/daily-log';
import { painEntries } from '@/data/pain-map';
import type { PainHistory } from '@/data/pain-history';
import { buildRegionLoadView, regionFrom, type RegionLoadView, type RegionSessionRow } from '@/data/region-load-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Seans kayıtları alınamadı. İnternetini kontrol edip yeniden dene.';

/** O günün ağrı haritası motorun biçiminde; check-in yoksa null. */
export function painReadings(history: PainHistory, date: string) {
  const map = history.byDate[date];
  return map ? painEntries(map) : null;
}

export async function fetchRegionLoad(today: string, now: Date): Promise<Result<RegionLoadView>> {
  const demo = demoStore();
  if (demo) return demo.fetchRegionLoad(today, now);
  if (!supabase) return { ok: false, message: offline };
  const yesterday = addIsoDays(today, -1);
  const [rows, first, pain] = await Promise.all([
    supabase
      .from('training_sessions')
      .select('local_date, rpe, duration_min, kind, content_tags, started_at')
      .gte('local_date', regionFrom(today))
      .lte('local_date', today),
    supabase.from('training_sessions').select('local_date').order('local_date', { ascending: true }).limit(1).maybeSingle(),
    fetchPainHistory([yesterday, today]),
  ]);
  if (rows.error || first.error || !pain.ok) return { ok: false, message: offline };
  const earliest = (first.data as { local_date: string } | null)?.local_date ?? null;
  return {
    ok: true,
    value: buildRegionLoadView(rows.data as RegionSessionRow[], today, {
      earliest,
      now,
      painToday: painReadings(pain.value, today),
      painYesterday: painReadings(pain.value, yesterday),
    }),
  };
}
