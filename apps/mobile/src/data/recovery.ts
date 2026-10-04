// Toparlanma verisi: Google Health senkronunun yazdığı günlük özetler ve uyku oturumları (karar 0019, 0021).
// Erişimi RLS korur (karar 0015): sahibi yalnız okur.

import type { Result } from '@/data/daily-log';
import { buildRecoveryView, recoveryFrom, type HealthDailyRow, type RecoveryView, type SleepRow } from '@/data/recovery-view';
import { supabase } from '@/lib/supabase';

const offline = 'Gece verisi alınamadı. İnternetini kontrol edip yeniden dene.';

export async function fetchRecovery(today: string): Promise<Result<RecoveryView>> {
  if (!supabase) return { ok: false, message: offline };
  const from = recoveryFrom(today);
  const [daily, sleep] = await Promise.all([
    supabase
      .from('health_daily')
      .select('local_date, hrv_deep_rmssd_ms, resting_hr_bpm, respiratory_rate_bpm')
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
  return { ok: true, value: buildRecoveryView(daily.data as HealthDailyRow[], sleep.data as SleepRow[], today) };
}
