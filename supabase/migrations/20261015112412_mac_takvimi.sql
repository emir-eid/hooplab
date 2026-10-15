-- Maç takvimi ve maç çevresi (karar 0046, research/rules/mac.json). Tek sahip deseni karar 0015'teki gibi.
--
--   * match_days: "Bugün maç var" işaretinin tablosu (0036) maç takvimine genişler. İleri tarihli satır eklenebilir;
--     başlama saati (maçın oynandığı yerin saati) ve iç saha / deplasman isteğe bağlı. Tarih değişmez (silinip yeniden
--     eklenir); yalnız saat ve yer güncellenir (sütun düzeyinde yetki).
--   * day_types: yeni gün tipi 'match' (maç çevresi, 6-8 g/kg; karbonhidrat-gun-tipi). Maçtan önceki gün, maç günü ve
--     maçtan sonraki gün kayıtlardan çıkar; kullanıcı elle de seçebilir.

alter table public.match_days
  add column start_time time,
  add column venue text check (venue in ('home', 'away'));

comment on table public.match_days is
  'Maç takvimi (karar 0036, 0046): kullanıcının maç kaydettiği günler. Satır varsa o gün maç var; saat ve yer isteğe bağlı.';
comment on column public.match_days.start_time is 'Başlama saati, maçın oynandığı yerin saatiyle; bilinmiyorsa null.';
comment on column public.match_days.venue is 'home: iç saha, away: deplasman; bilinmiyorsa null.';

grant update (start_time, venue) on table public.match_days to authenticated;

create policy "sahibi günceller" on public.match_days
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

alter table public.day_types drop constraint day_types_day_type_check;
alter table public.day_types
  add constraint day_types_day_type_check check (day_type in ('rest', 'training', 'match', 'high'));
