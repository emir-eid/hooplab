-- Apple Watch yolu (karar 0061, uygulama sırası 3b). Sahibinin satırları ve davranışı değişmez.
--
--   * health_daily'ye Apple'ın iki gecelik değeri ayrı sütunlarda: uyku penceresindeki SDNN örneklerinin ortalaması
--     (hrv_sleep_sdnn_ms) ve uyku sırasındaki nabız örneklerinin ortalaması (sleep_hr_bpm). Telefon hesaplar; ham
--     örnek buluta çıkmaz. Yazan yalnız healthkit-ingest (service_role); kullanıcı yetkileri değişmez.
--   * SDNN ile RMSSD aynı ölçü değildir (task-force-1996): Apple satırında Fitbit'in HRV / NREM nabzı sütunları,
--     Google satırında Apple sütunları boş olmak zorunda. Böylece iki ölçü şemada karışamaz (karar 0061 seçenek 2).
--     Var olan bütün satırlar google_health ve yeni sütunları boş: kısıt onlarda zaten sağlanır.

alter table public.health_daily
  add column hrv_sleep_sdnn_ms double precision check (hrv_sleep_sdnn_ms > 0),
  add column sleep_hr_bpm double precision check (sleep_hr_bpm > 0);

comment on column public.health_daily.hrv_sleep_sdnn_ms is
  'Apple Watch: uyku penceresindeki SDNN örneklerinin gecelik ortalaması (ms). Fitbit RMSSD''siyle kıyaslanmaz.';
comment on column public.health_daily.sleep_hr_bpm is
  'Apple Watch: uyku sırasındaki nabız örneklerinin ortalaması (atım/dk). NREM''e özgü değil.';

alter table public.health_daily
  add constraint health_daily_columns_by_source check (
    case source
      when 'apple_health' then
        hrv_rmssd_ms is null and hrv_deep_rmssd_ms is null and hrv_entropy is null and nrem_hr_bpm is null
      else
        hrv_sleep_sdnn_ms is null and sleep_hr_bpm is null
    end
  );

comment on table public.health_daily is
  'Günlük cihaz metrikleri: Google Health (ghealth-sync) ya da Apple Health (healthkit-ingest) yazar, sahibi okur. Ham gün içi nabız saklanmaz.';
