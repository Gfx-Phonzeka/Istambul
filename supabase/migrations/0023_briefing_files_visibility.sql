-- Briefing files follow the visibility of their video (production-team-only briefings stay with the team).
drop policy if exists "briefings: approved read" on storage.objects;
create policy "briefings: visible read" on storage.objects for select to authenticated using (
  bucket_id = 'briefings' and (
    public.is_staff()
    or exists (select 1 from public.briefing_videos b
               where name in (b.video_path, b.poster_path, b.subtitles_en_path, b.subtitles_tr_path)
                 and b.status = 'published' and public.can_view(b.visibility))
  )
);
