-- Staff can download (e.g. to check a file from the backoffice) without accepting the material terms.
create or replace function public.register_download(p_asset uuid, p_via text default 'single')
returns table (version_id uuid, file_path text, file_name text) language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  if not public.is_staff() and not exists (select 1 from public.material_terms_acceptances where user_id = auth.uid()) then
    raise exception 'terms_required';
  end if;
  select mv.id, mv.file_path, mv.file_name into v
    from public.media_versions mv join public.media_assets a on a.id = mv.asset_id
   where mv.asset_id = p_asset and mv.is_current
     and ((a.status = 'published' and public.can_view(a.visibility)) or public.is_staff());
  if v.id is null then raise exception 'not_found'; end if;
  insert into public.media_downloads (user_id, asset_id, version_id, via)
  values (auth.uid(), p_asset, v.id, case when p_via = 'zip' then 'zip' else 'single' end);
  return query select v.id, v.file_path, v.file_name;
end $$;
