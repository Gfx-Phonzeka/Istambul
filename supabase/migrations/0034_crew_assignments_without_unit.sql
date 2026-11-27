-- HB Portal · Crew Ops: teams that work without a production unit (IBC/MCR, management, BVM…):
-- an assignment can have no unit, with its own day type (default IBC/office) and optional venue.
alter table public.crew_assignments alter column unit_id drop not null;
alter table public.crew_assignments add column if not exists day_type text not null default 'office'
  check (day_type in ('travel', 'setup', 'rehearsal', 'check', 'live', 'off', 'dismantle', 'office'));
alter table public.crew_assignments add column if not exists venue_id uuid references public.venues (id) on delete set null;
