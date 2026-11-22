-- Users may delete their own previous exports (the export route keeps only the latest one per map).
create policy "camera-exports: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'camera-exports' and (storage.foldername(name))[1] = auth.uid()::text);
