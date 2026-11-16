-- Yalnız yerel geliştirme: `npm run db:reset` sonrası web önizlemesinin giriş yapacağı sentetik demo kullanıcısı.
-- Bulut projesine gitmez (db push seed çalıştırmaz). Gerçek kişi, gerçek e-posta veya gerçek şifre değildir.
-- Giriş: demo@hooplab.test / hooplab-yerel-demo (npm run web:local, tools/dev/web-local.mjs).
do $$
declare
  v_id uuid := 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'demo@hooplab.test',
    extensions.crypt('hooplab-yerel-demo', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'demo@hooplab.test', 'email_verified', true),
          'email', now(), now(), now());
  -- Sahibinin hesabı gibi: profil soruları sorulmuş, rıza verilmiş sayılır (karar 0061 sıra 4c ve 6). Apple
  -- kullanıcısına ikisi de sorulur.
  update public.profiles set answered_at = now(), consented_at = now(), consent_version = 'sahip' where user_id = v_id;
end;
$$;

-- İkinci sentetik kullanıcı (karar 0061): Apple Health · fitness profili. Giriş: apple@hooplab.test / hooplab-yerel-apple.
-- Davetli gibi açılır (sıra 6): rıza boş, geçici şifre bayrağı açık; ilk girişte rıza → şifre → profil soruları.
-- Şifre ekranında değiştirilen şifre `npm run db:reset` ile eski haline döner.
-- 35 gecelik uydurma SDNN, uyku nabzı ve uyku; son 7 gecede SDNN düşük, uyku nabzı aralığında (Apple'da HRV tek başına
-- not olur, durum "Hazır" kalır). Değerler gerçek bir kişiden değildir.
do $$
declare
  v_id uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  d date;
  i int;
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', 'apple@hooplab.test',
    extensions.crypt('hooplab-yerel-apple', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{"must_change_password": true}', now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (v_id::text, v_id, jsonb_build_object('sub', v_id::text, 'email', 'apple@hooplab.test', 'email_verified', true),
          'email', now(), now(), now());
  update public.profiles set data_source = 'apple_health', sport = 'fitness' where user_id = v_id;

  for i in 0..34 loop
    d := current_date - i;
    insert into public.health_daily (user_id, local_date, source, hrv_sleep_sdnn_ms, sleep_hr_bpm, respiratory_rate_bpm, resting_hr_bpm, steps, calories_kcal)
    values (
      v_id, d, 'apple_health',
      case when i < 7 then 38 + (i % 3) else 52 + 6 * sin(i) end,
      58 + 1.5 * cos(i),
      15 + 0.4 * sin(i / 2.0),
      60 + (i % 3),
      7000 + 400 * (i % 5),
      2300 + 50 * (i % 4)
    );
    insert into public.sleep_sessions (user_id, source_id, local_date, start_time, end_time, is_main, is_nap, minutes_in_period, minutes_asleep, minutes_awake, minutes_light, minutes_deep, minutes_rem, source)
    values (
      v_id, 'yerel-apple-uyku-' || d, d, (d - 1) + time '23:15', d + time '07:05', true, false,
      470, 440 - 10 * (i % 4), 30, 240, 80, 120 - 10 * (i % 4), 'apple_health'
    );
  end loop;
end;
$$;
