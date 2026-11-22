-- =====================================================================
-- Stage 5 · Competition schedule and Broadcast & distribution
-- =====================================================================

create table public.schedule_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                      -- stable key used by the Excel/CSV import
  sport_id uuid not null references public.sports (id) on delete restrict,
  venue_id uuid not null references public.venues (id) on delete restrict,
  discipline_en text, discipline_tr text,
  phase_en text, phase_tr text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_medal boolean not null default false,
  medal_events_en text, medal_events_tr text,
  is_oq boolean not null default false,           -- LA28 Olympic qualification
  notes_en text, notes_tr text,
  position int not null default 0,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'published',
  draft jsonb,
  published_at timestamptz default now(),
  content_updated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  check (end_at >= start_at)
);
create index schedule_sessions_start_idx on public.schedule_sessions (start_at);

create table public.broadcast_feeds (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  feed_type text not null check (feed_type in ('multilateral', 'iso', 'highlights', 'ceremony', 'other')),
  title_en text not null, title_tr text,
  venue_id uuid references public.venues (id) on delete set null,
  sport_id uuid references public.sports (id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  channel text not null,
  notes_en text, notes_tr text,
  position int not null default 0,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'published',
  draft jsonb,
  published_at timestamptz default now(),
  content_updated_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  check (end_at >= start_at)
);
create index broadcast_feeds_start_idx on public.broadcast_feeds (start_at);

create table public.distribution_channels (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('satellite', 'fibre', 'streaming', 'other')),
  position int not null default 0,
  title_en text not null, title_tr text,
  body_en text not null default '', body_tr text,
  contact_en text, contact_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.tech_parameters (
  id uuid primary key default gen_random_uuid(),
  grp text not null check (grp in ('video', 'audio', 'graphics', 'timecode', 'other')),
  position int not null default 0,
  title_en text not null, title_tr text,      -- parameter name
  value_en text not null, value_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- Free text blocks shown on fixed places of the site (e.g. "Additional production on request").
create table public.info_blocks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null, title_tr text,
  body_en text not null default '', body_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

do $$
declare t text;
begin
  foreach t in array array['schedule_sessions', 'broadcast_feeds', 'distribution_channels', 'tech_parameters', 'info_blocks'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.touch_content()', t || '_touch', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: read published" on public.%I for select to authenticated using ((status = ''published'' and public.can_view(visibility)) or public.is_staff())', t, t);
    execute format('create policy "%s: staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t, t);
  end loop;
  foreach t in array array['distribution_channels', 'tech_parameters', 'info_blocks'] loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.log_content_change()', t || '_log', t);
  end loop;
end $$;

-- Applies an import in one transaction: upserts by code, optionally deletes codes missing from the file.
create or replace function public.apply_import(p_dataset text, p_rows jsonb, p_delete_missing boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r jsonb; n_ins int := 0; n_upd int := 0; n_del int := 0; codes text[] := '{}'; existed boolean;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if p_dataset not in ('sessions', 'feeds') then raise exception 'invalid_dataset'; end if;
  perform set_config('app.importing', 'on', true);
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    codes := codes || (r ->> 'code');
    if p_dataset = 'sessions' then
      select exists (select 1 from public.schedule_sessions where code = r ->> 'code') into existed;
      insert into public.schedule_sessions as s (code, sport_id, venue_id, discipline_en, discipline_tr, phase_en, phase_tr, start_at, end_at,
        is_medal, medal_events_en, medal_events_tr, is_oq, notes_en, notes_tr, status, published_at, content_updated_at)
      values (r ->> 'code', (r ->> 'sport_id')::uuid, (r ->> 'venue_id')::uuid, r ->> 'discipline_en', nullif(r ->> 'discipline_tr', ''),
        r ->> 'phase_en', nullif(r ->> 'phase_tr', ''), (r ->> 'start_at')::timestamptz, (r ->> 'end_at')::timestamptz,
        coalesce((r ->> 'is_medal')::boolean, false), nullif(r ->> 'medal_events_en', ''), nullif(r ->> 'medal_events_tr', ''),
        coalesce((r ->> 'is_oq')::boolean, false), nullif(r ->> 'notes_en', ''), nullif(r ->> 'notes_tr', ''), 'published', now(), now())
      on conflict (code) do update set sport_id = excluded.sport_id, venue_id = excluded.venue_id,
        discipline_en = excluded.discipline_en, discipline_tr = excluded.discipline_tr, phase_en = excluded.phase_en, phase_tr = excluded.phase_tr,
        start_at = excluded.start_at, end_at = excluded.end_at, is_medal = excluded.is_medal, medal_events_en = excluded.medal_events_en,
        medal_events_tr = excluded.medal_events_tr, is_oq = excluded.is_oq, notes_en = excluded.notes_en, notes_tr = excluded.notes_tr,
        content_updated_at = now();
    else
      select exists (select 1 from public.broadcast_feeds where code = r ->> 'code') into existed;
      insert into public.broadcast_feeds (code, feed_type, title_en, title_tr, venue_id, sport_id, start_at, end_at, channel, notes_en, notes_tr,
        status, published_at, content_updated_at)
      values (r ->> 'code', r ->> 'feed_type', r ->> 'title_en', nullif(r ->> 'title_tr', ''), nullif(r ->> 'venue_id', '')::uuid,
        nullif(r ->> 'sport_id', '')::uuid, (r ->> 'start_at')::timestamptz, (r ->> 'end_at')::timestamptz, r ->> 'channel',
        nullif(r ->> 'notes_en', ''), nullif(r ->> 'notes_tr', ''), 'published', now(), now())
      on conflict (code) do update set feed_type = excluded.feed_type, title_en = excluded.title_en, title_tr = excluded.title_tr,
        venue_id = excluded.venue_id, sport_id = excluded.sport_id, start_at = excluded.start_at, end_at = excluded.end_at,
        channel = excluded.channel, notes_en = excluded.notes_en, notes_tr = excluded.notes_tr, content_updated_at = now();
    end if;
    if existed then n_upd := n_upd + 1; else n_ins := n_ins + 1; end if;
  end loop;
  if p_delete_missing then
    if p_dataset = 'sessions' then
      delete from public.schedule_sessions where not (code = any (codes));
    else
      delete from public.broadcast_feeds where not (code = any (codes));
    end if;
    get diagnostics n_del = row_count;
  end if;
  perform set_config('app.importing', 'off', true);
  perform private.log_activity('import.' || p_dataset, p_dataset, null,
    jsonb_build_object('inserted', n_ins, 'updated', n_upd, 'deleted', n_del));
  return jsonb_build_object('inserted', n_ins, 'updated', n_upd, 'deleted', n_del);
end $$;
revoke execute on function public.apply_import(text, jsonb, boolean) from public, anon;
grant execute on function public.apply_import(text, jsonb, boolean) to authenticated;

-- Activity log for single-row edits of sessions and feeds; an import is logged once (see apply_import).
create or replace function private.log_content_change()
returns trigger language plpgsql security definer set search_path = '' as $fn$
declare
  r jsonb := to_jsonb(coalesce(new, old));
  o jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  v_title text := coalesce(r ->> 'title_en', r ->> 'question_en', r ->> 'term_en', r ->> 'name', r ->> 'code', '');
  v_action text;
begin
  if coalesce(current_setting('app.importing', true), '') = 'on' then return coalesce(new, old); end if;
  if tg_op = 'INSERT' then v_action := 'content.created';
  elsif tg_op = 'DELETE' then v_action := 'content.deleted';
  elsif (o ->> 'status') = 'draft' and (r ->> 'status') = 'published' then v_action := 'content.published';
  elsif (o ->> 'status') = 'published' and (r ->> 'status') = 'draft' then v_action := 'content.unpublished';
  elsif (o ->> 'content_updated_at') is distinct from (r ->> 'content_updated_at') then v_action := 'content.republished';
  else v_action := 'content.updated';
  end if;
  if auth.uid() is not null then
    perform private.log_activity(v_action, tg_table_name, r ->> 'id', jsonb_build_object('title', v_title));
  end if;
  return coalesce(new, old);
end $fn$;

create trigger schedule_sessions_log after insert or update or delete on public.schedule_sessions
  for each row execute function private.log_content_change();
create trigger broadcast_feeds_log after insert or update or delete on public.broadcast_feeds
  for each row execute function private.log_content_change();
