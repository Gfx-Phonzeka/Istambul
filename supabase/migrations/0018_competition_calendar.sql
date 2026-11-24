-- Competition calendar by day, without session times: one row per discipline and venue, one code per competition day.
-- Used before session times are public, as the visual reference and operational calendar.
-- days: {"2027-07-24": "X"} · X competition · F women · M men · P competition with medal ceremonies (Parapan)
--       T classification / training · C ceremony
create table if not exists public.calendar_rows (
  id uuid primary key default gen_random_uuid(),
  games text not null default 'main',          -- Lima: 'pan' | 'para' · Istanbul: 'main'
  position int not null default 0,
  sport_id uuid references public.sports(id) on delete cascade,
  venue_id uuid references public.venues(id) on delete set null,
  label_en text, label_tr text,                 -- discipline label when it differs from the sport name
  days jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists calendar_rows_games_idx on public.calendar_rows (games, position);
alter table public.calendar_rows enable row level security;
drop policy if exists "calendar_rows: read" on public.calendar_rows;
create policy "calendar_rows: read" on public.calendar_rows for select to authenticated using (public.is_approved());
drop policy if exists "calendar_rows: staff write" on public.calendar_rows;
create policy "calendar_rows: staff write" on public.calendar_rows for all to authenticated using (public.is_staff()) with check (public.is_staff());
