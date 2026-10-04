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
end;
$$;
