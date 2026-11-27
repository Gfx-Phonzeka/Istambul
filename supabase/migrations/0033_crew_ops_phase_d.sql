-- HB Portal · Crew Ops, phase D: rates, per diem and costs. Finance only (admins and people with Crew Ops "finance" access).
-- Amounts live only in the database, never in the repository.

-- Per person: how they are paid.
create table if not exists public.crew_finance (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  basis text not null default 'daily' check (basis in ('daily', 'forfait', 'per_diem_only', 'company')),
  daily_rate numeric(10, 2),                 -- cachet per day (daily basis, or company)
  monthly_rate numeric(10, 2),               -- forfait for 30 days (always divided by 30)
  off_half boolean not null default false,   -- short productions paid by the day: days off at half cachet
  per_diem_zone text not null default 'intl' check (per_diem_zone in ('intl', 'es', 'pt', 'none', 'custom')),
  per_diem_custom numeric(10, 2),            -- per day, when the zone is "custom" (e.g. employees, rules to confirm)
  breakfast boolean not null default true,   -- per diem includes breakfast
  extra_meals int not null default 0,        -- number of "extra" (more than 16 hours) allowances
  adjustment numeric(10, 2) not null default 0,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.crew_finance enable row level security;
drop policy if exists "crew_finance: finance" on public.crew_finance;
create policy "crew_finance: finance" on public.crew_finance for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());
drop trigger if exists crew_finance_touch on public.crew_finance;
create trigger crew_finance_touch before insert or update on public.crew_finance for each row execute function public.crew_touch();

-- Settings: per diem amounts per zone {"intl":{"meal":..,"breakfast":..,"extra":..}, "es":{..}, "pt":{..}}.
create table if not exists public.crew_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb
);
alter table public.crew_settings enable row level security;
drop policy if exists "crew_settings: finance" on public.crew_settings;
create policy "crew_settings: finance" on public.crew_settings for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());
insert into public.crew_settings (key, value) values
  ('per_diem', '{"intl": {"meal": 32.5, "breakfast": 7.5, "extra": 7.5}, "es": {"meal": 20, "breakfast": 7.5, "extra": 7.5}, "pt": {"meal": null, "breakfast": null, "extra": null}}')
on conflict (key) do nothing;

-- Closed services paid to companies (e.g. special cameras, RF): one amount each.
create table if not exists public.crew_services (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  description text,
  amount numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.crew_services enable row level security;
drop policy if exists "crew_services: finance" on public.crew_services;
create policy "crew_services: finance" on public.crew_services for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());

-- Costs of travel (per trip) and hotel rates (per hotel and room type).
create table if not exists public.crew_travel_costs (
  travel_id uuid primary key references public.crew_travels (id) on delete cascade,
  amount numeric(10, 2) not null default 0
);
alter table public.crew_travel_costs enable row level security;
drop policy if exists "crew_travel_costs: finance" on public.crew_travel_costs;
create policy "crew_travel_costs: finance" on public.crew_travel_costs for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());

create table if not exists public.crew_hotel_rates (
  hotel_id uuid not null references public.crew_hotels (id) on delete cascade,
  room_type text not null check (room_type in ('single', 'double', 'twin', 'triple', 'other')),
  night_rate numeric(10, 2) not null default 0,
  primary key (hotel_id, room_type)
);
alter table public.crew_hotel_rates enable row level security;
drop policy if exists "crew_hotel_rates: finance" on public.crew_hotel_rates;
create policy "crew_hotel_rates: finance" on public.crew_hotel_rates for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());

-- Other costs (transfers, rental cars, equipment shipping…), optionally per person.
create table if not exists public.crew_other_costs (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'other' check (category in ('transfer', 'car', 'shipping', 'other')),
  profile_id uuid references public.profiles (id) on delete set null,
  description text,
  amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
alter table public.crew_other_costs enable row level security;
drop policy if exists "crew_other_costs: finance" on public.crew_other_costs;
create policy "crew_other_costs: finance" on public.crew_other_costs for all to authenticated using (public.is_crew_finance()) with check (public.is_crew_finance());
