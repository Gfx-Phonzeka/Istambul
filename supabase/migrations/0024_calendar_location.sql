-- Competition calendar: "location" column of the official calendar (district / area), per row.
alter table public.calendar_rows add column if not exists location text;
