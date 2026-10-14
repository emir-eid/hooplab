// Yakılan enerji verisi (karar 0043): Google Health senkronunun yazdığı günlük toplam kalori (bileklik, karar 0019).
// Erişimi RLS korur (karar 0015): sahibi yalnız okur. Demo modu bellekteki depoya gider (karar 0022).

import type { Result } from '@/data/daily-log';
import { buildEnergyView, energyFrom, type EnergyDayRow, type EnergyView } from '@/data/energy-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Yakılan enerji alınamadı.';

export async function fetchEnergy(today: string): Promise<Result<EnergyView>> {
  const demo = demoStore();
  if (demo) return demo.fetchEnergy(today);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('health_daily')
    .select('local_date, calories_kcal, updated_at')
    .gte('local_date', energyFrom(today))
    .lte('local_date', today);
  if (error) return { ok: false, message: offline };
  return { ok: true, value: buildEnergyView(data as EnergyDayRow[], today) };
}
