-- HB Portal · Crew Ops, phase C: travel, hotels (rooming list) and transfers.
-- Logistics data: written by Crew Ops coordination; each person sees only their own.

create table if not exists public.crew_travels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  direction text not null default 'outbound' check (direction in ('outbound', 'return', 'internal')),
  mode text not null default 'flight' check (mode in ('flight', 'train', 'car', 'bus', 'other')),
  carrier text, number text,
  from_place text, to_place text,
  depart_date date not null, depart_time text,
  arrive_date date, arrive_time text,
  booking_ref text,
  transfer_needed boolean not null default true,
  extras text,                              -- extra baggage, rental car…
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists crew_travels_person_idx on public.crew_travels (profile_id);
create index if not exists crew_travels_dates_idx on public.crew_travels (depart_date, arrive_date);
alter table public.crew_travels enable row level security;
drop policy if exists "crew_travels: read" on public.crew_travels;
create policy "crew_travels: read" on public.crew_travels for select to authenticated using (profile_id = auth.uid() or public.is_crew_coord());
drop policy if exists "crew_travels: write" on public.crew_travels;
create policy "crew_travels: write" on public.crew_travels for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

create table if not exists public.crew_hotels (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text, city text, phone text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.crew_hotels enable row level security;
drop policy if exists "crew_hotels: read" on public.crew_hotels;
create policy "crew_hotels: read" on public.crew_hotels for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_hotels: write" on public.crew_hotels;
create policy "crew_hotels: write" on public.crew_hotels for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

create table if not exists public.crew_stays (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  hotel_id uuid not null references public.crew_hotels (id) on delete cascade,
  check_in date not null,
  check_out date not null,
  room_type text not null default 'single' check (room_type in ('single', 'double', 'twin', 'triple', 'other')),
  room_code text,                           -- same code = same room (shared)
  notes text,
  created_at timestamptz not null default now(),
  check (check_out > check_in)
);
create index if not exists crew_stays_person_idx on public.crew_stays (profile_id);
alter table public.crew_stays enable row level security;
drop policy if exists "crew_stays: read" on public.crew_stays;
create policy "crew_stays: read" on public.crew_stays for select to authenticated using (profile_id = auth.uid() or public.is_crew_coord());
drop policy if exists "crew_stays: write" on public.crew_stays;
create policy "crew_stays: write" on public.crew_stays for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- New exception type for phase D: day off between the Pan and Parapan Games without going home (only per diem).
alter table public.crew_person_days drop constraint if exists crew_person_days_day_type_check;
alter table public.crew_person_days add constraint crew_person_days_day_type_check
  check (day_type in ('travel', 'setup', 'rehearsal', 'check', 'live', 'off', 'dismantle', 'office', 'standby', 'none'));
