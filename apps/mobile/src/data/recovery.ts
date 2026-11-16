// Toparlanma verisi: Google Health senkronunun (Apple profilinde healthkit-ingest'in, karar 0061) yazdığı günlük
// özetler ve uyku oturumları (karar 0019, 0021). Erişimi RLS korur (karar 0015): sahibi yalnız okur.

import type { Result } from '@/data/daily-log';
import { fetchProfile } from '@/data/profile';
import {
  autonomicColumns,
  buildRecoveryView,
  recoveryFrom,
  type CycleInput,
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
  const profile = await fetchProfile();
  const source = profile.dataSource;
  // Döngü (karar 0061 sıra 5): yalnız Apple · kadın · döngü takibi açık profilde bugünün satırı okunur.
  const cycleOn = source === 'apple_health' && profile.sex === 'kadin' && profile.cycleTracking;
  // Sütunlar kaynağa göre (karar 0061); string olarak tutulur, sorgu tipi satır tipinden gelir.
  const dailyColumns: string = `local_date, ${autonomicColumns(source)}, respiratory_rate_bpm, spo2_avg_pct, skin_temp_nightly_c, skin_temp_baseline_c`;
  const [daily, sleep, cycleRow] = await Promise.all([
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
    cycleOn ? supabase.from('cycle_days').select('phase, irregular').eq('local_date', today).maybeSingle() : null,
  ]);
  if (daily.error || sleep.error) return { ok: false, message: offline };
  // Döngü satırı okunamazsa not gösterilmez; ekranın geri kalanı etkilenmez.
  const cycle: CycleInput | undefined = cycleOn
    ? { today: cycleRow && !cycleRow.error ? (cycleRow.data as CycleInput['today']) : null, contraception: profile.contraception }
    : undefined;
  return {
    ok: true,
    value: buildRecoveryView(daily.data as unknown as HealthDailyRow[], sleep.data as SleepRow[], today, source, cycle),
  };
}
