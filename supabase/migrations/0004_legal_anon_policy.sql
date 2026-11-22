-- Anonymous visitors cannot call is_staff(), so they get a separate, simpler policy.
drop policy "legal_pages: read published" on public.legal_pages;
create policy "legal_pages: anon read published" on public.legal_pages for select to anon using (status = 'published');
create policy "legal_pages: read published" on public.legal_pages for select to authenticated using (status = 'published' or public.is_staff());
