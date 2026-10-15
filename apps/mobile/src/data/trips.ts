// Seyahat verisi (karar 0047): trips satırları. Yer bilgisi yok; gidiş, dönüş ve saat farkı. Erişimi RLS korur
// (karar 0015). Demo modu açıksa bellekteki depoya gider.

import { isValidOffset, type Trip } from '@hooplab/engine';

import type { Result } from '@/data/daily-log';
import { toTrips, type TripRow } from '@/data/trip-view';
import { demoStore } from '@/demo/demo-mode';
import { supabase } from '@/lib/supabase';

const offline = 'Seyahatler alınamadı. İnternetini kontrol edip yeniden dene.';
const failed = 'Kaydedilemedi. Biraz sonra yeniden dene.';
const columns = 'id, depart_date, return_date, offset_hours';

/** Gidişi [from, to] aralığındaki seyahatler, gidişe göre sıralı. */
export async function fetchTrips(from: string, to: string): Promise<Result<Trip[]>> {
  const demo = demoStore();
  if (demo) return demo.fetchTrips(from, to);
  if (!supabase) return { ok: false, message: offline };
  const { data, error } = await supabase.from('trips').select(columns).gte('depart_date', from).lte('depart_date', to);
  if (error) return { ok: false, message: offline };
  return { ok: true, value: toTrips((data ?? []) as TripRow[]) };
}

/** Yeni seyahat (id yok) ya da güncelleme. */
export async function saveTrip(trip: Trip): Promise<Result<null>> {
  if (!isValidOffset(trip.offsetHours) || (trip.returnDate !== null && trip.returnDate < trip.departDate)) {
    return { ok: false, message: 'Dönüş günü gidişten önce olamaz.' };
  }
  const demo = demoStore();
  if (demo) return demo.saveTrip(trip);
  if (!supabase) return { ok: false, message: failed };
  const row = { depart_date: trip.departDate, return_date: trip.returnDate, offset_hours: trip.offsetHours };
  const { error } = trip.id
    ? await supabase.from('trips').update(row).eq('id', trip.id)
    : await supabase.from('trips').insert(row);
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}

export async function deleteTrip(id: string): Promise<Result<null>> {
  const demo = demoStore();
  if (demo) return demo.deleteTrip(id);
  if (!supabase) return { ok: false, message: failed };
  const { error } = await supabase.from('trips').delete().eq('id', id);
  return error ? { ok: false, message: failed } : { ok: true, value: null };
}
