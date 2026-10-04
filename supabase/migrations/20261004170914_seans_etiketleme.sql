-- Seans etiketleme (karar 0020): saatin egzersiz oturumu ile elle girilen seans kaydı eşleşir.
-- Saat oturumun zamanını ve nabzını verir; türü (maç / antrenman / şut...) ve RPE'yi kullanıcı verir.
--
--   * training_sessions.exercise_session_id: seans kaydının bağlı olduğu saat oturumu (en fazla bir).
--     Bileşik dış anahtar (id, user_id) iki satırın aynı sahibe ait olmasını şart koşar; RLS'e
--     ek olarak başkasının oturumuna bağlanmayı veritabanı düzeyinde engeller.
--   * exercise_sessions.dismissed_at: "Seans değil" (ör. yürüyüş). Senkron bu sütunu yazmaz
--     (upsert yalnız gönderdiği sütunları günceller), sahibi yalnız bu sütunu güncelleyebilir.
--   * Yeni seans türü 'mobility' (mobilite / yoga).

alter table public.training_sessions
  drop constraint training_sessions_kind_check,
  add constraint training_sessions_kind_check
    check (kind in ('team_practice', 'game', 'strength', 'conditioning', 'shooting', 'rehab', 'mobility'));

alter table public.exercise_sessions
  add column dismissed_at timestamptz,
  add constraint exercise_sessions_id_owner unique (id, user_id);

comment on column public.exercise_sessions.dismissed_at is
  'Sahibi "Seans değil" dedi; etiketlenecekler listesinde görünmez. Senkron yazmaz.';

alter table public.training_sessions
  add column exercise_session_id uuid,
  add constraint training_sessions_exercise_owner
    foreign key (exercise_session_id, user_id)
    references public.exercise_sessions (id, user_id)
    on delete set null (exercise_session_id),
  -- Bir saat oturumu en fazla bir seans kaydına bağlanır. Benzersizlik dizini dış anahtar
  -- aramalarını da karşılar (silmede training_sessions taraması olmaz).
  add constraint training_sessions_one_per_exercise unique (exercise_session_id);

comment on column public.training_sessions.exercise_session_id is
  'Eşleşen saat oturumu (exercise_sessions). Yoksa seans yalnız elle girilmiştir.';

-- Sahibi yalnız "Seans değil" işaretini değiştirebilir; senkronun yazdığı diğer sütunlar kapalı.
grant update (dismissed_at) on table public.exercise_sessions to authenticated;

create policy "sahibi seans değil işaretler" on public.exercise_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
