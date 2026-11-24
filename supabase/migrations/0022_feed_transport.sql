-- Feed grid: how each signal is delivered (satellite, SRT or both) and the data a right holder needs to receive it.
alter table public.broadcast_feeds add column if not exists transport text check (transport is null or transport in ('satellite', 'srt', 'satellite_srt'));
alter table public.broadcast_feeds add column if not exists reception text;
alter table public.distribution_channels drop constraint if exists distribution_channels_kind_check;
alter table public.distribution_channels add constraint distribution_channels_kind_check check (kind in ('satellite', 'srt', 'fibre', 'streaming', 'other'));
