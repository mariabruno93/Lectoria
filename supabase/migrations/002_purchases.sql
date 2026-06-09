-- ─────────────────────────────────────────────────────────────────────────
-- 002_purchases.sql — Sistema de compra de obras de autores + split Mercado Pago
--
-- Modelo: cada obra de pago tiene su precio (lo pone el autor, editable).
-- El autor también puede poner un precio a su "biblioteca completa".
-- Mercado Pago divide cada pago 70% autor / 30% Epovox (marketplace_fee).
--
-- Correr este script en el editor SQL de Supabase (Dashboard → SQL Editor).
-- Es idempotente: se puede correr más de una vez sin romper nada.
-- ─────────────────────────────────────────────────────────────────────────

-- 1) profiles: conexión a Mercado Pago (OAuth) + precio de la biblioteca del autor
alter table public.profiles add column if not exists mp_user_id        text;
alter table public.profiles add column if not exists mp_access_token   text;
alter table public.profiles add column if not exists mp_refresh_token  text;
alter table public.profiles add column if not exists mp_token_expires  timestamptz;
alter table public.profiles add column if not exists mp_connected      boolean not null default false;
alter table public.profiles add column if not exists library_price_ars integer;

-- 2) user_works: precio de la obra (solo aplica a obras de pago, is_public = false)
alter table public.user_works add column if not exists price_ars integer;

-- 3) purchases: cada compra aprobada habilita el acceso (entitlement)
create table if not exists public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  buyer_id            uuid not null references auth.users(id) on delete cascade,
  author_id           uuid not null references auth.users(id) on delete cascade,
  tier                text not null check (tier in ('single','library')),
  work_id             uuid references public.user_works(id) on delete set null,
  amount_ars          integer not null,
  marketplace_fee_ars integer,
  status              text not null default 'pending' check (status in ('pending','approved','refunded')),
  mp_preference_id    text,
  mp_payment_id       text,
  consented_immediate boolean not null default false,
  created_at          timestamptz not null default now(),
  approved_at         timestamptz
);

create index if not exists purchases_buyer_idx  on public.purchases (buyer_id);
create index if not exists purchases_author_idx on public.purchases (author_id);
create index if not exists purchases_work_idx   on public.purchases (work_id);

-- RLS: el comprador puede leer sus propias compras. La escritura es solo del
-- backend con service-role (que ignora RLS), nunca desde el navegador.
alter table public.purchases enable row level security;

drop policy if exists "buyer reads own purchases" on public.purchases;
create policy "buyer reads own purchases"
  on public.purchases for select
  using (auth.uid() = buyer_id);
