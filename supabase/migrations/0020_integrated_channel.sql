-- Integrated Channel: the Host Broadcaster's 24/7 ready-to-air channel. Editors build the daily grid;
-- right holders (and the production team) read the published grid of each day.
-- Times are the Games' local time (HH:MM); an end time earlier than the start time ends the next day.
create table if not exists public.channel_slots (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  start_time text not null check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  end_time text check (end_time is null or end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  kind text not null default 'live' check (kind in ('live', 'delayed', 'highlights', 'summary', 'feature', 'ceremony', 'continuity')),
  sport_id uuid references public.sports(id) on delete set null,
  venue_id uuid references public.venues(id) on delete set null,
  title_en text, title_tr text, title_es text, title_pt text,
  notes_en text, notes_tr text, notes_es text, notes_pt text,
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create index if not exists channel_slots_day_idx on public.channel_slots (day, start_time);
alter table public.channel_slots enable row level security;

create policy "channel_slots: read published" on public.channel_slots for select to authenticated
  using ((status = 'published' and public.is_approved()) or public.is_staff());
create policy "channel_slots: staff insert" on public.channel_slots for insert to authenticated with check (public.is_staff());
create policy "channel_slots: staff update" on public.channel_slots for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "channel_slots: staff delete" on public.channel_slots for delete to authenticated using (public.is_staff());

create or replace function private.channel_slots_touch() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then new.published_at := now(); end if;
  return new;
end $$;
drop trigger if exists channel_slots_touch on public.channel_slots;
create trigger channel_slots_touch before insert or update on public.channel_slots for each row execute function private.channel_slots_touch();
