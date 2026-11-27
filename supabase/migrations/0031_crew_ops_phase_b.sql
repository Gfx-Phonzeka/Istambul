-- HB Portal · Crew Ops, phase B: production units with a daily plan, teams assigned to units by dates,
-- and each person's days (generated from the assignments, plus manual exceptions such as travel or days off).

-- ---------- Production units (PU / LPU) ----------
create table if not exists public.crew_units (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- e.g. "PU 2", "LPU 1"
  name text,
  size text check (size in ('XL', 'L', 'M', 'S')),
  mode text check (mode in ('OB', 'REMI', 'REMOTE', 'FLYPACK')),
  cameras int,
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.crew_units enable row level security;
drop policy if exists "crew_units: read" on public.crew_units;
create policy "crew_units: read" on public.crew_units for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_units: write" on public.crew_units;
create policy "crew_units: write" on public.crew_units for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- Day types used in the plans and in each person's days
-- travel (FLY) · setup (SET UP) · rehearsal (REH) · check (CHECK/test) · live (MD, match day) · off (OFF) · dismantle · office (IBC / office work)

-- ---------- Daily plan of each unit ----------
create table if not exists public.crew_unit_days (
  unit_id uuid not null references public.crew_units (id) on delete cascade,
  day date not null,
  day_type text not null check (day_type in ('travel', 'setup', 'rehearsal', 'check', 'live', 'off', 'dismantle', 'office')),
  venue_id uuid references public.venues (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  call_time text,                            -- e.g. "07:30"
  notes text,
  primary key (unit_id, day)
);
create index if not exists crew_unit_days_day_idx on public.crew_unit_days (day);
alter table public.crew_unit_days enable row level security;
drop policy if exists "crew_unit_days: read" on public.crew_unit_days;
create policy "crew_unit_days: read" on public.crew_unit_days for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_unit_days: write" on public.crew_unit_days;
create policy "crew_unit_days: write" on public.crew_unit_days for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- ---------- Teams assigned to units, by dates ----------
create table if not exists public.crew_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.crew_teams (id) on delete cascade,
  unit_id uuid not null references public.crew_units (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists crew_assignments_team_idx on public.crew_assignments (team_id);
alter table public.crew_assignments enable row level security;
drop policy if exists "crew_assignments: read" on public.crew_assignments;
create policy "crew_assignments: read" on public.crew_assignments for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_assignments: write" on public.crew_assignments;
create policy "crew_assignments: write" on public.crew_assignments for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- ---------- Manual exceptions per person (travel days, days off, a day on another unit…) ----------
create table if not exists public.crew_person_days (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  day_type text check (day_type in ('travel', 'setup', 'rehearsal', 'check', 'live', 'off', 'dismantle', 'office', 'none')), -- 'none' removes a generated day
  unit_id uuid references public.crew_units (id) on delete set null,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  primary key (profile_id, day)
);
alter table public.crew_person_days enable row level security;
drop policy if exists "crew_person_days: read" on public.crew_person_days;
create policy "crew_person_days: read" on public.crew_person_days for select to authenticated using (profile_id = auth.uid() or public.is_team() or public.is_crew_coord());
drop policy if exists "crew_person_days: write" on public.crew_person_days;
create policy "crew_person_days: write" on public.crew_person_days for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());
drop trigger if exists crew_person_days_touch on public.crew_person_days;
create trigger crew_person_days_touch before insert or update on public.crew_person_days for each row execute function public.crew_touch();

-- "Mediagest" mark: the person is already entered in the billing system (Mediagest/SAP).
alter table public.crew_participation add column if not exists in_mediagest boolean not null default false;
