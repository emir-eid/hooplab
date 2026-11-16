// Günlük adım verisi (karar 0061 sıra 6): telefonun Apple Sağlık'tan ya da senkronun Google Health'ten yazdığı günlük
// toplam. Erişimi RLS korur: kullanıcı yalnız kendi satırlarını okur. Kart yalnız fitness profilinde gösterilir;
// demo modu sahibinin profilidir, bu yüzden demoda sorgu yapılmaz.

import type { Result } from '@/data/daily-log';
import { buildStepsView, stepsFrom, type StepsDayRow, type StepsView } from '@/data/steps-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Adım alınamadı.';

export async function fetchSteps(today: string): Promise<Result<StepsView>> {
  if (demoStore() || !supabase) return { ok: false, message: offline };
  const { data, error } = await supabase
    .from('health_daily')
    .select('local_date, steps, updated_at')
    .gte('local_date', stepsFrom(today))
    .lte('local_date', today);
  if (error) return { ok: false, message: offline };
  return { ok: true, value: buildStepsView(data as StepsDayRow[], today) };
}
