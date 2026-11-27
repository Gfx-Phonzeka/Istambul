-- HB Portal · Media Hub items can be linked to a venue and a sport (e.g. the DCAS of a venue), so they show on "My venue".
alter table public.media_assets add column if not exists venue_id uuid references public.venues (id) on delete set null;
alter table public.media_assets add column if not exists sport_id uuid references public.sports (id) on delete set null;
create index if not exists media_assets_venue_idx on public.media_assets (venue_id);
