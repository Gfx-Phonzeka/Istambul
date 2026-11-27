-- HB Portal · Briefing subtitles in Spanish and Portuguese (Lima). Istanbul keeps EN/TR.
alter table public.briefing_videos add column if not exists subtitles_es_path text;
alter table public.briefing_videos add column if not exists subtitles_pt_path text;
