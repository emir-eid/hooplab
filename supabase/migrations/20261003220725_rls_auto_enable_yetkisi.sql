-- Proje açılırken "otomatik RLS" seçeneği public şemaya SECURITY DEFINER bir event trigger
-- fonksiyonu ekliyor (public.rls_auto_enable). Event trigger fonksiyonu RPC ile çağrılamaz, ama
-- denetçi (lint 0028/0029) anon ve authenticated için EXECUTE yetkisini uyarı olarak gösteriyor.
-- Yetki açıkça kaldırılır; tetikleyici çalışmaya devam eder (event trigger'da EXECUTE denetlenmez).
-- Fonksiyon yerel Supabase'de yok, bu yüzden varlığı denetlenir.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
