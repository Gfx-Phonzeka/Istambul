-- HB Portal · Crew Ops, phase A: personal sheet, functions, teams, participation, access levels.
-- Personal data is visible only to the person and to Crew Ops coordination (admins included).

-- ---------- Access levels ----------
create table if not exists public.crew_staff (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  level text not null check (level in ('coordination', 'finance')),
  created_at timestamptz not null default now()
);
alter table public.crew_staff enable row level security;

create or replace function public.is_crew_coord()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (select 1 from public.crew_staff s where s.profile_id = auth.uid())
$$;
create or replace function public.is_crew_finance()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_admin() or exists (select 1 from public.crew_staff s where s.profile_id = auth.uid() and s.level = 'finance')
$$;

drop policy if exists "crew_staff: read" on public.crew_staff;
create policy "crew_staff: read" on public.crew_staff for select to authenticated using (profile_id = auth.uid() or public.is_crew_coord());
drop policy if exists "crew_staff: admin write" on public.crew_staff;
create policy "crew_staff: admin write" on public.crew_staff for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Functions (job roles) ----------
create table if not exists public.crew_functions (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  name_en text not null,
  name_es text, name_pt text, name_tr text,
  position int not null default 0,
  active boolean not null default true,
  unique (name_en)
);
alter table public.crew_functions enable row level security;
drop policy if exists "crew_functions: read" on public.crew_functions;
create policy "crew_functions: read" on public.crew_functions for select to authenticated using (public.is_team());
drop policy if exists "crew_functions: write" on public.crew_functions;
create policy "crew_functions: write" on public.crew_functions for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- ---------- Teams (technical, operational/artistic, IBC, BVM, management) ----------
create table if not exists public.crew_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null default 'operational' check (kind in ('technical', 'operational', 'ibc', 'bvm', 'management', 'other')),
  notes text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.crew_teams enable row level security;
drop policy if exists "crew_teams: read" on public.crew_teams;
create policy "crew_teams: read" on public.crew_teams for select to authenticated using (public.is_team());
drop policy if exists "crew_teams: write" on public.crew_teams;
create policy "crew_teams: write" on public.crew_teams for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

create table if not exists public.crew_team_members (
  team_id uuid not null references public.crew_teams (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  primary key (team_id, profile_id)
);
alter table public.crew_team_members enable row level security;
drop policy if exists "crew_team_members: read" on public.crew_team_members;
create policy "crew_team_members: read" on public.crew_team_members for select to authenticated using (public.is_team());
drop policy if exists "crew_team_members: write" on public.crew_team_members;
create policy "crew_team_members: write" on public.crew_team_members for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- ---------- Participation in the event (set by coordination) ----------
create table if not exists public.crew_participation (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  function_id uuid references public.crew_functions (id) on delete set null,
  position_label text,
  collaborator_type text check (collaborator_type in ('freelancer', 'employee', 'group_company')),
  company text,
  notes text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.crew_participation enable row level security;
drop policy if exists "crew_participation: read" on public.crew_participation;
create policy "crew_participation: read" on public.crew_participation for select to authenticated using (public.is_team());
drop policy if exists "crew_participation: write" on public.crew_participation;
create policy "crew_participation: write" on public.crew_participation for all to authenticated using (public.is_crew_coord()) with check (public.is_crew_coord());

-- ---------- Personal sheet (filled in by the person) ----------
create table if not exists public.crew_records (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  nationality text,
  date_of_birth date,
  gender text,
  id_type text,
  id_number text,
  id_expiry date,
  emergency_name text,
  emergency_phone text,
  polo_size text,
  hoodie_size text,
  languages text,
  extra jsonb not null default '{}'::jsonb,   -- fields added later (Organising Committee data matrix)
  photo_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.crew_records enable row level security;
drop policy if exists "crew_records: read" on public.crew_records;
create policy "crew_records: read" on public.crew_records for select to authenticated using (profile_id = auth.uid() or public.is_crew_coord());
drop policy if exists "crew_records: insert" on public.crew_records;
create policy "crew_records: insert" on public.crew_records for insert to authenticated with check ((profile_id = auth.uid() and public.is_team()) or public.is_crew_coord());
drop policy if exists "crew_records: update" on public.crew_records;
create policy "crew_records: update" on public.crew_records for update to authenticated using (profile_id = auth.uid() or public.is_crew_coord()) with check (profile_id = auth.uid() or public.is_crew_coord());

create or replace function public.crew_touch() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); new.updated_by := auth.uid(); return new; end $$;
drop trigger if exists crew_records_touch on public.crew_records;
create trigger crew_records_touch before insert or update on public.crew_records for each row execute function public.crew_touch();
drop trigger if exists crew_participation_touch on public.crew_participation;
create trigger crew_participation_touch before insert or update on public.crew_participation for each row execute function public.crew_touch();

-- ---------- Accreditation photos (private; one folder per person) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crew-photos', 'crew-photos', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;
drop policy if exists "crew-photos: read" on storage.objects;
create policy "crew-photos: read" on storage.objects for select to authenticated
  using (bucket_id = 'crew-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_crew_coord()));
drop policy if exists "crew-photos: write" on storage.objects;
create policy "crew-photos: write" on storage.objects for insert to authenticated
  with check (bucket_id = 'crew-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_crew_coord()));
drop policy if exists "crew-photos: update" on storage.objects;
create policy "crew-photos: update" on storage.objects for update to authenticated
  using (bucket_id = 'crew-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_crew_coord()));
drop policy if exists "crew-photos: delete" on storage.objects;
create policy "crew-photos: delete" on storage.objects for delete to authenticated
  using (bucket_id = 'crew-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_crew_coord()));

-- ---------- Draft list of functions (to be validated) ----------
insert into public.crew_functions (area, name_en, position) values
 ('Management', 'Project Leader', 1), ('Management', 'Project Manager', 2), ('Management', 'Head of Production / Content', 3),
 ('Management', 'Production Coordinator', 4), ('Management', 'Logistics Manager', 5), ('Management', 'BMS General Manager', 6),
 ('Management', 'BMS Commercial Manager', 7),
 ('Engineering management', 'IBC Engineering Manager', 10), ('Engineering management', 'Deputy Engineering Manager', 11),
 ('Engineering management', 'Venues Tech Manager', 12), ('Engineering management', 'RF & LiveU Coordinator', 13),
 ('Venues', 'Broadcast Venue Manager (BVM)', 20),
 ('Unit production', 'Producer', 30), ('Unit production', 'TV Director', 31), ('Unit production', 'TV Director Assistant', 32),
 ('Unit production', 'Floor Manager', 33),
 ('Cameras', 'Camera Operator', 40), ('Cameras', 'PTZ Camera Operator', 41), ('Cameras', 'Camera Assistant', 42),
 ('Cameras', 'Special Cameras Technician', 43),
 ('Replays', 'EVS Operator', 50),
 ('Unit technical', 'OB Van Video Engineer', 60), ('Unit technical', 'OB Van Audio Engineer', 61),
 ('Unit technical', 'OB Van Material Video Supervisor', 62), ('Unit technical', 'OB Van Material Audio Supervisor / Tech Assistant', 63),
 ('Unit technical', 'CCU Operator', 64), ('Unit technical', 'Audio Assistant', 65), ('Unit technical', 'RF Technician', 66),
 ('Unit technical', 'Setup Engineer / Technician', 67),
 ('Commentary', 'Commentary Mixer Tech (VoIP)', 70),
 ('IBC / MCR', 'CDT Coordinator', 80), ('IBC / MCR', 'CDT Operator', 81), ('IBC / MCR', 'Contribution Network Manager', 82),
 ('IBC / MCR', 'Contribution Network Operator', 83), ('IBC / MCR', 'EVS Engineer', 84), ('IBC / MCR', 'Ingest Coordinator', 85),
 ('IBC / MCR', 'Ingest Operator', 86), ('IBC / MCR', 'Media Manager Supervisor', 87), ('IBC / MCR', 'Logger', 88),
 ('IBC / MCR', 'Editor Supervisor', 89), ('IBC / MCR', 'Editor', 90), ('IBC / MCR', 'Making Of Operator', 91),
 ('IBC / MCR', 'Audio Tech Coordinator', 92), ('IBC / MCR', 'Electricity Technician', 93), ('IBC / MCR', 'Installer', 94),
 ('Quality', 'PQC (Production Quality Control)', 100), ('Quality', 'Tech PQC', 101),
 ('Production logistics', 'Producer / Logistic Producer', 110)
on conflict (name_en) do nothing;
