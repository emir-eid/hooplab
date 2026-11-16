// Toparlanma verisi: Google Health senkronunun (Apple profilinde healthkit-ingest'in, karar 0061) yazdığı günlük
// özetler ve uyku oturumları (karar 0019, 0021). Erişimi RLS korur (karar 0015): sahibi yalnız okur.

import type { Result } from '@/data/daily-log';
import { fetchDataSource } from '@/data/profile';
import {
  autonomicColumns,
  buildRecoveryView,
  recoveryFrom,
  type HealthDailyRow,
  type RecoveryView,
  type SleepRow,
} from '@/data/recovery-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Gece verisi alınamadı. İnternetini kontrol edip yeniden dene.';

export async function fetchRecovery(today: string): Promise<Result<RecoveryView>> {
  const demo = demoStore();
  if (demo) return demo.fetchRecovery(today);
  if (!supabase) return { ok: false, message: offline };
  const from = recoveryFrom(today);
  const source = await fetchDataSource();
  // Sütunlar kaynağa göre (karar 0061); string olarak tutulur, sorgu tipi satır tipinden gelir.
  const dailyColumns: string = `local_date, ${autonomicColumns(source)}, respiratory_rate_bpm, spo2_avg_pct, skin_temp_nightly_c, skin_temp_baseline_c`;
  const [daily, sleep] = await Promise.all([
    supabase
      .from('health_daily')
      .select(dailyColumns)
      .gte('local_date', from)
      .lte('local_date', today)
      .order('local_date', { ascending: true }),
    supabase
      .from('sleep_sessions')
      .select('local_date, minutes_asleep, is_nap')
      .gte('local_date', from)
      .lte('local_date', today),
  ]);
  if (daily.error || sleep.error) return { ok: false, message: offline };
  return { ok: true, value: buildRecoveryView(daily.data as unknown as HealthDailyRow[], sleep.data as SleepRow[], today, source) };
}
