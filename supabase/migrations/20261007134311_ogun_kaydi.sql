-- Öğün kaydı (karar 0030, research/rules/beslenme.json → ogun-besin-listesi, alim-hedef-kiyasi).
-- Tek sahip deseni karar 0015'teki gibi. Gramlar packages/engine'de besin listesinden (research/foods/foods.json,
-- USDA FDC) hesaplanır, saklanmaz; liste güncellenirse eski öğünler yeni değerle okunur.
-- CHECK'ler veri girişi doğrulamasıdır, bilimsel eşik değildir.
--
--   * meals: bir öğün = bir satır. items bir dizi; her kalem ya listeden bir besin ve porsiyon çarpanı
--     ({"food": "<id>", "portions": 0.5|1|1.5|2|3}) ya da etiketten elle girilen gram
--     ({"label": "<ad>" | null, "carbs_g": n, "protein_g": n}; 0-300 g, ad en çok 40 karakter).
--     Besin kimliği veritabanında denetlenmez (liste uygulamada); bilinmeyen kalem hesaba girmez.

create function private.valid_meal_items(items jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) between 1 and 30
    and not exists (
      select 1
      from jsonb_array_elements(items) as e(item)
      -- Eksik alan NULL üretir; coalesce olmadan NOT NULL satırı süzgeçten kaçırır.
      where not coalesce(
        (
          jsonb_typeof(e.item -> 'food') = 'string'
          and length(e.item ->> 'food') between 1 and 40
          and jsonb_typeof(e.item -> 'portions') = 'number'
          and (e.item ->> 'portions')::numeric in (0.5, 1, 1.5, 2, 3)
          and (select count(*) from jsonb_object_keys(e.item)) = 2
        )
        or (
          jsonb_typeof(e.item -> 'carbs_g') = 'number'
          and jsonb_typeof(e.item -> 'protein_g') = 'number'
          and (e.item ->> 'carbs_g')::numeric between 0 and 300
          and (e.item ->> 'protein_g')::numeric between 0 and 300
          and (e.item ->> 'carbs_g')::numeric + (e.item ->> 'protein_g')::numeric > 0
          and coalesce(jsonb_typeof(e.item -> 'label'), 'null') in ('string', 'null')
          and coalesce(length(e.item ->> 'label'), 0) <= 40
          and (select count(*) from jsonb_object_keys(e.item)) = 3
        ),
        false
      )
    )
$$;

comment on function private.valid_meal_items(jsonb) is
  'meals.items biçim denetimi: listeden besin ve çarpan ya da etiketten gram (karar 0030).';

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  items jsonb not null check (private.valid_meal_items(items)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.meals is
  'Öğün kaydı: besin listesinden porsiyon ya da etiketten gram. Karbonhidrat ve protein packages/engine içinde hesaplanır.';

-- Günlük sorgu (user_id, local_date) ve RLS süzgeci için.
create index meals_user_date_idx on public.meals (user_id, local_date);

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function private.set_updated_at();

alter table public.meals enable row level security;

revoke all on table public.meals from anon;
grant select, insert, update, delete on table public.meals to authenticated;

create policy "sahibi okur" on public.meals
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "sahibi ekler" on public.meals
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "sahibi günceller" on public.meals
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "sahibi siler" on public.meals
  for delete to authenticated
  using ((select auth.uid()) = user_id);
