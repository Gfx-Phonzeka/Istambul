-- HB Portal · Daily reports (producers and directors) and PQC reports (PDF from the PQC app).
-- Both are team-only. Readers: coordination (team function "Production coordinator") and admins/editors.

-- ---------- Who can do what ----------
create or replace function public.my_team_function()
returns text language sql stable security definer set search_path = '' as $$
  select lower(coalesce(team_function, '')) from public.profiles
  where id = auth.uid() and status = 'approved' and role = 'production'
$$;

-- Producers and directors write daily reports (admins too, for corrections).
create or replace function public.can_write_daily_report()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.is_admin() or public.my_team_function() in ('producer', 'director'), false)
$$;

-- Coordination and administration read every report.
create or replace function public.can_read_reports()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.is_staff() or public.my_team_function() = 'production coordinator', false)
$$;

-- PQC staff upload PQC reports (coordination and admins too).
create or replace function public.can_upload_pqc()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.can_read_reports() or public.my_team_function() like 'production quality control%', false)
$$;

grant execute on function public.my_team_function(), public.can_write_daily_report(), public.can_read_reports(), public.can_upload_pqc() to authenticated;

-- ---------- Daily reports: one per person per day ----------
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  report_date date not null,
  venue_id uuid references public.venues (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  sessions text not null default '',
  summary text not null default '',
  technical_issues text not null default '',
  editorial_issues text not null default '',
  attachments jsonb not null default '[]'::jsonb, -- [{path,name,size}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, report_date),
  constraint daily_reports_lengths check (length(summary) <= 10000 and length(technical_issues) <= 10000
    and length(editorial_issues) <= 10000 and length(sessions) <= 500)
);
create index if not exists daily_reports_date_idx on public.daily_reports (report_date desc);
create index if not exists daily_reports_venue_idx on public.daily_reports (venue_id);
create index if not exists daily_reports_sport_idx on public.daily_reports (sport_id);

alter table public.daily_reports enable row level security;
drop policy if exists "daily_reports: read" on public.daily_reports;
drop policy if exists "daily_reports: insert own" on public.daily_reports;
drop policy if exists "daily_reports: update own" on public.daily_reports;
drop policy if exists "daily_reports: delete" on public.daily_reports;
create policy "daily_reports: read" on public.daily_reports for select to authenticated
  using (author_id = (select auth.uid()) or (select public.can_read_reports()));
create policy "daily_reports: insert own" on public.daily_reports for insert to authenticated
  with check (author_id = (select auth.uid()) and (select public.can_write_daily_report()));
create policy "daily_reports: update own" on public.daily_reports for update to authenticated
  using (author_id = (select auth.uid()) and (select public.can_write_daily_report()))
  with check (author_id = (select auth.uid()));
create policy "daily_reports: delete" on public.daily_reports for delete to authenticated
  using ((author_id = (select auth.uid()) and (select public.can_write_daily_report())) or (select public.is_admin()));

create or replace function private.touch_daily_report()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); new.author_id := old.author_id; new.report_date := old.report_date; return new; end $$;
drop trigger if exists daily_reports_touch on public.daily_reports;
create trigger daily_reports_touch before update on public.daily_reports for each row execute function private.touch_daily_report();

-- ---------- PQC reports: PDF produced in the PQC app, linked per day and venue ----------
create table if not exists public.pqc_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  venue_id uuid references public.venues (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  title text not null default '',
  file_path text,
  file_name text,
  file_size bigint,
  url text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint pqc_reports_source check (file_path is not null or url is not null),
  constraint pqc_reports_url check (url is null or url ~ '^https?://')
);
create index if not exists pqc_reports_date_idx on public.pqc_reports (report_date desc);
create index if not exists pqc_reports_venue_idx on public.pqc_reports (venue_id);
create index if not exists pqc_reports_sport_idx on public.pqc_reports (sport_id);
create index if not exists pqc_reports_uploader_idx on public.pqc_reports (uploaded_by);

alter table public.pqc_reports enable row level security;
drop policy if exists "pqc_reports: read" on public.pqc_reports;
drop policy if exists "pqc_reports: insert" on public.pqc_reports;
drop policy if exists "pqc_reports: delete" on public.pqc_reports;
create policy "pqc_reports: read" on public.pqc_reports for select to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.can_read_reports()));
create policy "pqc_reports: insert" on public.pqc_reports for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and (select public.can_upload_pqc()));
create policy "pqc_reports: delete" on public.pqc_reports for delete to authenticated
  using ((uploaded_by = (select auth.uid()) and (select public.can_upload_pqc())) or (select public.is_admin()));

-- ---------- Private storage: <user id>/<file> ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('reports', 'reports', false, 52428800) on conflict (id) do nothing;
drop policy if exists "reports: read" on storage.objects;
drop policy if exists "reports: insert own" on storage.objects;
drop policy if exists "reports: delete own" on storage.objects;
create policy "reports: read" on storage.objects for select to authenticated
  using (bucket_id = 'reports' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.can_read_reports())));
create policy "reports: insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = (select auth.uid())::text
    and ((select public.can_write_daily_report()) or (select public.can_upload_pqc())));
create policy "reports: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'reports' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));

-- ---------- Istanbul: service requests are run by the EBU, not by us ----------
-- Right holders can no longer create service requests here; team requests stay.
create or replace function private.block_rhb_requests()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.request_type not like 'team\_%' then raise exception 'invalid_type'; end if;
  return new;
end $$;
drop trigger if exists service_requests_team_only on public.service_requests;
create trigger service_requests_team_only before insert on public.service_requests for each row execute function private.block_rhb_requests();

-- ---------- Author name kept on the report (readers cannot see other people's profiles) ----------
alter table public.daily_reports add column if not exists author_name text not null default '';
alter table public.daily_reports add column if not exists author_function text not null default '';
create or replace function private.stamp_daily_report_author()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  select first_name, last_name, team_function, role into p from public.profiles where id = new.author_id;
  new.author_name := trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''));
  new.author_function := coalesce(p.team_function, case when p.role = 'admin' then 'Admin' else '' end);
  return new;
end $$;
drop trigger if exists daily_reports_author on public.daily_reports;
create trigger daily_reports_author before insert on public.daily_reports for each row execute function private.stamp_daily_report_author();
