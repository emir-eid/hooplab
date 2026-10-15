// Yakılan enerji verisi (karar 0043): Google Health senkronunun yazdığı günlük toplam kalori (bileklik, karar 0019)
// ve saatlik toplam (karar 0044). Erişimi RLS korur (karar 0015): sahibi yalnız okur. Demo modu bellekteki depoya
// gider (karar 0022).

import type { Result } from '@/data/daily-log';
import {
  buildEnergyView,
  energyFrom,
  energyHoursFrom,
  type EnergyDayRow,
  type EnergyHourRow,
  type EnergyView,
} from '@/data/energy-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Yakılan enerji alınamadı.';

export async function fetchEnergy(today: string): Promise<Result<EnergyView>> {
  const demo = demoStore();
  if (demo) return demo.fetchEnergy(today);
  if (!supabase) return { ok: false, message: offline };
  const [daily, hourly] = await Promise.all([
    supabase
      .from('health_daily')
      .select('local_date, calories_kcal, updated_at')
      .gte('local_date', energyFrom(today))
      .lte('local_date', today),
    supabase
      .from('health_hourly_energy')
      .select('local_date, local_hour, kcal')
      .gte('local_date', energyHoursFrom(today))
      .lte('local_date', today),
  ]);
  if (daily.error) return { ok: false, message: offline };
  // Saatlik okunamazsa kart grafiksiz kalır; günlük değerler yine gösterilir.
  const hours = hourly.error ? [] : (hourly.data as EnergyHourRow[]);
  return { ok: true, value: buildEnergyView(daily.data as EnergyDayRow[], today, hours) };
}
