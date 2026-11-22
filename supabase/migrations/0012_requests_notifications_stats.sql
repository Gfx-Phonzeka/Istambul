-- =====================================================================
-- Stage 6 · Service requests, notifications, favourites, statistics
-- =====================================================================

-- ---------- Generic helpers ----------
create or replace function private.queue_raw_email(p_to text, p_lang text, p_template text, p_subject text, p_body text)
returns void language sql security definer set search_path = '' as $$
  insert into public.email_outbox (to_email, lang, template, subject, body_text)
  values (p_to, case when p_lang = 'tr' then 'tr' else 'en' end, p_template, p_subject, p_body)
$$;

-- Can a given user (not necessarily the caller) see content with this visibility?
create or replace function private.user_can_view(p_role public.app_role, v public.content_visibility)
returns boolean language sql immutable set search_path = '' as $$
  select case v when 'all' then p_role is not null
                when 'partners' then p_role in ('partner', 'editor', 'admin')
                else p_role in ('editor', 'admin') end
$$;

-- Bell notification + optional email (in the user's language), for one user.
create or replace function private.notify_user(p_user uuid, p_kind text, p_title_en text, p_title_tr text, p_body_en text, p_body_tr text, p_link text)
returns void language plpgsql security definer set search_path = '' as $$
declare u record;
begin
  select id, email, preferred_language, notify_email into u from public.profiles where id = p_user and status = 'approved';
  if u.id is null then return; end if;
  insert into public.notifications (user_id, kind, title_en, title_tr, body_en, body_tr, link)
  values (u.id, p_kind, p_title_en, p_title_tr, p_body_en, p_body_tr, p_link);
  if u.notify_email then
    perform private.queue_raw_email(u.email, u.preferred_language, 'notification',
      case when u.preferred_language = 'tr' then coalesce(p_title_tr, p_title_en) else p_title_en end,
      case when u.preferred_language = 'tr' then coalesce(p_body_tr, p_body_en, '') else coalesce(p_body_en, '') end
        || E'\n\n' || private.site_url() || coalesce(p_link, '/')
        || case when u.preferred_language = 'tr' then E'\n\nBildirim tercihlerinizi profilinizden değiştirebilirsiniz.'
                else E'\n\nYou can change your notification preferences in your profile.' end);
  end if;
end $$;

-- ---------- Favourites ----------
create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('venue', 'sport', 'media_asset')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, kind, target_id)
);
create index favorites_target_idx on public.favorites (kind, target_id);
alter table public.favorites enable row level security;
create policy "favorites: own" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved());

-- Notifies every follower of any of the given targets once (excluding the person who made the change).
create or replace function private.notify_followers(p_targets jsonb, p_kind text, p_title_en text, p_title_tr text, p_body_en text, p_body_tr text,
                                                    p_link text, p_visibility public.content_visibility)
returns void language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
  for u in
    select distinct f.user_id from public.favorites f
      join jsonb_to_recordset(p_targets) as t(kind text, id uuid) on t.kind = f.kind and t.id = f.target_id
      join public.profiles p on p.id = f.user_id
     where p.status = 'approved' and private.user_can_view(p.role, p_visibility)
       and f.user_id is distinct from auth.uid()
  loop
    perform private.notify_user(u, p_kind, p_title_en, p_title_tr, p_body_en, p_body_tr, p_link);
  end loop;
end $$;

-- ---------- Notification triggers ----------
-- 1. Urgent notice published → every approved user allowed to see it.
create or replace function private.on_announcement_published()
returns trigger language plpgsql security definer set search_path = '' as $$
declare u record;
begin
  if new.priority = 'urgent' and new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published' or old.content_updated_at is distinct from new.content_updated_at) then
    for u in select id from public.profiles where status = 'approved' and private.user_can_view(role, new.visibility) loop
      perform private.notify_user(u.id, 'urgent_notice', 'Urgent: ' || new.title_en, 'Acil: ' || coalesce(new.title_tr, new.title_en),
        left(public.html_to_text(new.body_en), 400), left(public.html_to_text(coalesce(new.body_tr, new.body_en)), 400), '/news/' || new.id);
    end loop;
  end if;
  return new;
end $$;
create trigger announcements_notify after insert or update on public.announcements
  for each row execute function private.on_announcement_published();

-- 2. Camera map updated (publish, cameras saved, new drawing) → followers of the venue or the sport.
create or replace function private.on_camera_plan_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v record; s record;
begin
  if new.status = 'published' and (old.status is distinct from 'published' or old.content_updated_at is distinct from new.content_updated_at) then
    select title_en, title_tr from public.venues where id = new.venue_id into v;
    select title_en, title_tr from public.sports where id = new.sport_id into s;
    perform private.notify_followers(
      jsonb_build_array(jsonb_build_object('kind', 'venue', 'id', new.venue_id), jsonb_build_object('kind', 'sport', 'id', new.sport_id)),
      'camera_map_updated',
      'Camera map updated: ' || v.title_en || ' · ' || s.title_en,
      'Kamera planı güncellendi: ' || coalesce(v.title_tr, v.title_en) || ' · ' || coalesce(s.title_tr, s.title_en),
      new.title_en, coalesce(new.title_tr, new.title_en), '/camera-maps/' || new.id, new.visibility);
  end if;
  return new;
end $$;
create trigger camera_plans_notify after update on public.camera_plans
  for each row execute function private.on_camera_plan_changed();

-- 3. Schedule change (time or venue of a session) → followers of the sport or the venue.
create or replace function private.on_session_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  if coalesce(current_setting('app.importing', true), '') = 'on' then return new; end if; -- imports notify once per sport
  if new.status = 'published' and (old.start_at, old.end_at, old.venue_id) is distinct from (new.start_at, new.end_at, new.venue_id) then
    select title_en, title_tr from public.sports where id = new.sport_id into s;
    perform private.notify_followers(
      jsonb_build_array(jsonb_build_object('kind', 'sport', 'id', new.sport_id), jsonb_build_object('kind', 'venue', 'id', new.venue_id)),
      'schedule_changed',
      'Schedule change: ' || s.title_en || ' – ' || coalesce(new.phase_en, ''),
      'Takvim değişikliği: ' || coalesce(s.title_tr, s.title_en) || ' – ' || coalesce(new.phase_tr, new.phase_en, ''),
      'New time (Istanbul): ' || to_char(new.start_at at time zone 'Europe/Istanbul', 'DD Mon YYYY HH24:MI') || '–' || to_char(new.end_at at time zone 'Europe/Istanbul', 'HH24:MI'),
      'Yeni saat (Istanbul): ' || to_char(new.start_at at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI') || '–' || to_char(new.end_at at time zone 'Europe/Istanbul', 'HH24:MI'),
      '/schedule?session=' || new.id, new.visibility);
  end if;
  return new;
end $$;
create trigger schedule_sessions_notify after update on public.schedule_sessions
  for each row execute function private.on_session_changed();

-- 4. Followed venue sheet or Media Hub file updated.
create or replace function private.on_followed_content_changed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare k text := case tg_table_name when 'venues' then 'venue' else 'media_asset' end;
begin
  if new.status = 'published' and old.status = 'published' and old.content_updated_at is distinct from new.content_updated_at then
    perform private.notify_followers(jsonb_build_array(jsonb_build_object('kind', k, 'id', new.id)),
      k || '_updated',
      case k when 'venue' then 'Venue updated: ' else 'File updated: ' end || new.title_en,
      case k when 'venue' then 'Mekân güncellendi: ' else 'Dosya güncellendi: ' end || coalesce(new.title_tr, new.title_en),
      null, null,
      case k when 'venue' then '/venues/' || (to_jsonb(new) ->> 'slug') else '/media-hub?item=' || new.id end, new.visibility);
  end if;
  return new;
end $$;
create trigger venues_notify after update on public.venues for each row execute function private.on_followed_content_changed();
create trigger media_assets_notify after update on public.media_assets for each row execute function private.on_followed_content_changed();

-- Imports: one notification per sport whose sessions changed.
create or replace function public.notify_schedule_import(p_sports uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  for s in select id, title_en, title_tr from public.sports where id = any (p_sports) loop
    perform private.notify_followers(jsonb_build_array(jsonb_build_object('kind', 'sport', 'id', s.id)), 'schedule_changed',
      'Schedule updated: ' || s.title_en, 'Takvim güncellendi: ' || coalesce(s.title_tr, s.title_en),
      'The competition schedule of this sport has changed.', 'Bu sporun yarışma takvimi değişti.', '/schedule', 'all');
  end loop;
end $$;

-- ---------- Service requests ----------
create type public.request_status as enum ('received', 'in_review', 'confirmed', 'rejected');

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('REQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))),
  user_id uuid not null references auth.users (id) on delete cascade,
  request_type text not null check (request_type in ('unilateral', 'additional_production', 'other')),
  venue_id uuid references public.venues (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  start_date date,
  end_date date,
  description text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  status public.request_status not null default 'received',
  status_message text,                 -- message sent to the requester with the last status change
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_requests_user_idx on public.service_requests (user_id, created_at desc);

create table public.request_notes (     -- internal notes: never visible to the requester
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_email text,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.request_events (    -- status history shown to the requester
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests (id) on delete cascade,
  status public.request_status not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;
alter table public.request_notes enable row level security;
alter table public.request_events enable row level security;
create policy "requests: own or admin read" on public.service_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "request_events: own or admin read" on public.request_events for select to authenticated
  using (public.is_admin() or exists (select 1 from public.service_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy "request_notes: admin" on public.request_notes for select to authenticated using (public.is_admin());

create or replace function public.create_service_request(p jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_ref text; me record; a record;
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  if coalesce(p ->> 'request_type', '') not in ('unilateral', 'additional_production', 'other') then raise exception 'invalid_type'; end if;
  if length(trim(coalesce(p ->> 'description', ''))) < 10 then raise exception 'description_required'; end if;
  if coalesce(trim(p ->> 'contact_name'), '') = '' or coalesce(p ->> 'contact_email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'contact_required'; end if;
  select * into me from public.profiles where id = auth.uid();
  insert into public.service_requests (user_id, request_type, venue_id, sport_id, start_date, end_date, description, contact_name, contact_email, contact_phone)
  values (auth.uid(), p ->> 'request_type', nullif(p ->> 'venue_id', '')::uuid, nullif(p ->> 'sport_id', '')::uuid,
          nullif(p ->> 'start_date', '')::date, nullif(p ->> 'end_date', '')::date, left(trim(p ->> 'description'), 5000),
          left(trim(p ->> 'contact_name'), 200), left(trim(p ->> 'contact_email'), 200), left(nullif(trim(p ->> 'contact_phone'), ''), 50))
  returning id, reference into v_id, v_ref;
  insert into public.request_events (request_id, status) values (v_id, 'received');
  perform private.log_activity('request.created', 'service_requests', v_id::text, jsonb_build_object('reference', v_ref));
  for a in select id from public.profiles where role = 'admin' and status = 'approved' loop
    perform private.notify_user(a.id, 'request_new', 'New service request ' || v_ref || ' – ' || me.organization,
      'Yeni hizmet talebi ' || v_ref || ' – ' || me.organization, left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300),
      '/admin/requests/' || v_id);
  end loop;
  -- confirmation for the requester
  perform private.queue_raw_email(me.email, me.preferred_language, 'request_received',
    case when me.preferred_language = 'tr' then 'Talebiniz alındı: ' || v_ref else 'We received your request: ' || v_ref end,
    case when me.preferred_language = 'tr'
      then 'Hizmet talebiniz (' || v_ref || E') alındı. Durumu portalda takip edebilirsiniz:\n' || private.site_url() || '/requests'
      else 'Your service request (' || v_ref || E') has been received. You can follow its status in the portal:\n' || private.site_url() || '/requests' end);
  return v_ref;
end $$;

create or replace function public.admin_update_request(p_id uuid, p_status public.request_status, p_message text)
returns void language plpgsql security definer set search_path = '' as $$
declare r record; u record; labels_en jsonb := '{"received":"Received","in_review":"In review","confirmed":"Confirmed","rejected":"Declined"}';
        labels_tr jsonb := '{"received":"Alındı","in_review":"İnceleniyor","confirmed":"Onaylandı","rejected":"Reddedildi"}';
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.service_requests where id = p_id;
  if r.id is null then raise exception 'not_found'; end if;
  if r.status = p_status and coalesce(trim(p_message), '') = '' then return; end if;
  update public.service_requests set status = p_status, status_message = nullif(trim(p_message), ''), updated_at = now() where id = p_id;
  insert into public.request_events (request_id, status, message) values (p_id, p_status, nullif(trim(p_message), ''));
  perform private.log_activity('request.status_changed', 'service_requests', p_id::text, jsonb_build_object('reference', r.reference, 'status', p_status));
  insert into public.notifications (user_id, kind, title_en, title_tr, body_en, body_tr, link)
  values (r.user_id, 'request_status', 'Request ' || r.reference || ': ' || (labels_en ->> p_status::text),
          'Talep ' || r.reference || ': ' || (labels_tr ->> p_status::text), nullif(trim(p_message), ''), nullif(trim(p_message), ''), '/requests#' || r.reference);
  select email, preferred_language into u from public.profiles where id = r.user_id;
  if u.email is not null then
    perform private.queue_raw_email(u.email, u.preferred_language, 'request_status',
      case when u.preferred_language = 'tr' then 'Talebiniz ' || r.reference || ': ' || (labels_tr ->> p_status::text)
           else 'Your request ' || r.reference || ': ' || (labels_en ->> p_status::text) end,
      case when u.preferred_language = 'tr'
        then 'Hizmet talebinizin (' || r.reference || ') durumu: ' || (labels_tr ->> p_status::text) || '.'
        else 'The status of your service request (' || r.reference || ') is now: ' || (labels_en ->> p_status::text) || '.' end
      || case when coalesce(trim(p_message), '') <> '' then E'\n\n' || trim(p_message) else '' end
      || E'\n\n' || private.site_url() || '/requests');
  end if;
end $$;

create or replace function public.admin_add_request_note(p_id uuid, p_body text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if coalesce(trim(p_body), '') = '' then return; end if;
  insert into public.request_notes (request_id, author_id, author_email, body)
  values (p_id, auth.uid(), (select email from public.profiles where id = auth.uid()), left(trim(p_body), 5000));
end $$;

-- ---------- Page views (statistics) ----------
create table public.page_views (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  path text not null,
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views (created_at desc);
alter table public.page_views enable row level security;
create policy "page_views: admin read" on public.page_views for select to authenticated using (public.is_admin());

create or replace function public.record_page_view(p_path text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_approved() then return; end if;
  if p_path !~ '^/[A-Za-z0-9/_\-]{0,150}$' then return; end if;
  insert into public.page_views (user_id, path) values (auth.uid(), p_path);
end $$;

-- ---------- Statistics for administrators ----------
create or replace function public.admin_stats(p_days int default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  return jsonb_build_object(
    'users_total', (select count(*) from public.profiles where status = 'approved'),
    'users_pending', (select count(*) from public.profiles where status = 'pending'),
    'by_country', coalesce((select jsonb_agg(x order by x.n desc) from (select country as label, count(*) n from public.profiles where status = 'approved' group by country order by n desc limit 15) x), '[]'),
    'by_org', coalesce((select jsonb_agg(x order by x.n desc) from (select organization as label, count(*) n from public.profiles where status = 'approved' group by organization order by n desc limit 15) x), '[]'),
    'by_role', coalesce((select jsonb_agg(x order by x.n desc) from (select role::text as label, count(*) n from public.profiles where status = 'approved' group by role) x), '[]'),
    'logins_total', (select count(*) from public.activity_log where action = 'auth.login' and created_at >= since),
    'logins_unique', (select count(distinct actor_id) from public.activity_log where action = 'auth.login' and created_at >= since),
    'logins_by_day', coalesce((select jsonb_agg(x order by x.day) from (
        select to_char(d, 'YYYY-MM-DD') as day, (select count(*) from public.activity_log a where a.action = 'auth.login'
          and a.created_at >= d and a.created_at < d + interval '1 day') n
        from generate_series(date_trunc('day', since), date_trunc('day', now()), interval '1 day') d) x), '[]'),
    'top_downloads', coalesce((select jsonb_agg(x order by x.n desc) from (
        select coalesce(m.title_en, '—') as label, count(*) n, count(distinct d.user_id) users from public.media_downloads d
          left join public.media_assets m on m.id = d.asset_id where d.created_at >= since group by m.title_en order by n desc limit 10) x), '[]'),
    'downloads_total', (select count(*) from public.media_downloads where created_at >= since),
    'top_videos', coalesce((select jsonb_agg(x order by x.n desc) from (
        select coalesce(b.title_en, '—') as label, count(*) n, (select count(*) from public.briefing_views w where w.video_id = b.id) watched
          from public.activity_log a join public.briefing_videos b on b.id::text = a.entity_id
         where a.action = 'view.briefing' and a.created_at >= since group by b.id, b.title_en order by n desc limit 10) x), '[]'),
    'top_pages', coalesce((select jsonb_agg(x order by x.n desc) from (
        select path as label, count(*) n, count(distinct user_id) users from public.page_views where created_at >= since
         group by path order by n desc limit 15) x), '[]'),
    'requests_by_status', coalesce((select jsonb_agg(x) from (select status::text as label, count(*) n from public.service_requests group by status) x), '[]')
  );
end $$;

revoke execute on function public.create_service_request(jsonb), public.admin_update_request(uuid, public.request_status, text),
  public.admin_add_request_note(uuid, text), public.record_page_view(text), public.admin_stats(int), public.notify_schedule_import(uuid[]) from public, anon;
grant execute on function public.create_service_request(jsonb), public.admin_update_request(uuid, public.request_status, text),
  public.admin_add_request_note(uuid, text), public.record_page_view(text), public.admin_stats(int), public.notify_schedule_import(uuid[]) to authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
