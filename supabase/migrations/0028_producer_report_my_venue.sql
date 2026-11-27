-- HB Portal · Producer's daily venue report (checks per area, like the "Daily Venue Report") and "My venue" team list.
-- Directors keep the existing report; producers fill in the venue report. Same table, column "kind".

alter table public.daily_reports add column if not exists kind text not null default 'director';
alter table public.daily_reports drop constraint if exists daily_reports_kind;
alter table public.daily_reports add constraint daily_reports_kind check (kind in ('director', 'producer'));
alter table public.daily_reports add column if not exists start_time text not null default '';
alter table public.daily_reports add column if not exists end_time text not null default '';
-- {"camera_plan":"ok"|"incident"|"na", ...} for production, technical operations and support services / logistics
alter table public.daily_reports add column if not exists checks jsonb not null default '{}'::jsonb;
alter table public.daily_reports add column if not exists logistics_issues text not null default '';
alter table public.daily_reports drop constraint if exists daily_reports_more_lengths;
alter table public.daily_reports add constraint daily_reports_more_lengths
  check (length(logistics_issues) <= 10000 and length(start_time) <= 20 and length(end_time) <= 20);

-- "My venue": the people who work with me — same Crew Ops team, or same venue in their team profile.
-- Production team only; returns work contacts (no personal data from the crew sheet).
create or replace function public.my_venue_team(p_venue uuid)
returns table (id uuid, first_name text, last_name text, email text, phone text, team_function text,
               function_en text, function_es text, function_pt text, position_label text, teams text, same_team boolean)
language sql stable security definer set search_path = '' as $$
  with mine as (select team_id from public.crew_team_members where profile_id = auth.uid())
  select p.id, p.first_name, p.last_name, p.email, p.phone, p.team_function,
         f.name_en, f.name_es, f.name_pt, cp.position_label,
         (select string_agg(t.name, ', ' order by t.name) from public.crew_team_members m join public.crew_teams t on t.id = m.team_id
           where m.profile_id = p.id and m.team_id in (select team_id from mine)),
         exists (select 1 from public.crew_team_members m where m.profile_id = p.id and m.team_id in (select team_id from mine))
  from public.profiles p
  left join public.crew_participation cp on cp.profile_id = p.id
  left join public.crew_functions f on f.id = cp.function_id
  where public.is_team() and p.status = 'approved'
    and (exists (select 1 from public.crew_team_members m where m.profile_id = p.id and m.team_id in (select team_id from mine))
         or (p_venue is not null and p.team_venue_id = p_venue and p.role = 'production'))
  order by coalesce(f.position, 999), p.last_name
$$;
grant execute on function public.my_venue_team(uuid) to authenticated;
