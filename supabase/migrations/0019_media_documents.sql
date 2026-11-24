-- Media Hub documents (PDF and other files) and a "right holders only" audience.
-- Audiences: 'all' (right holders and production team) · 'rhb' (right holders only) · 'production' (production team only).
-- Part 1 must be committed before part 2 (a new enum value cannot be used in the transaction that adds it).

-- Part 1
alter type public.content_visibility add value if not exists 'rhb';

-- Part 2
create or replace function public.can_view(v public.content_visibility)
returns boolean language sql stable security definer set search_path = '' as $$
  select case v
    when 'all' then public.is_approved()
    when 'rhb' then coalesce(public.my_role() in ('right_holder', 'partner', 'editor', 'admin'), false) and public.is_approved()
    when 'partners' then coalesce(public.my_role() in ('partner', 'editor', 'admin'), false)
    when 'production' then public.is_team()
    when 'internal' then public.is_staff()
  end
$$;

create or replace function private.user_can_view(p_role public.app_role, v public.content_visibility)
returns boolean language sql immutable set search_path = '' as $$
  select case v when 'all' then p_role is not null
                when 'rhb' then p_role in ('right_holder', 'partner', 'editor', 'admin')
                when 'partners' then p_role in ('partner', 'editor', 'admin')
                when 'production' then p_role in ('production', 'editor', 'admin')
                else p_role in ('editor', 'admin') end
$$;

alter table public.media_assets drop constraint if exists media_assets_category_check;
alter table public.media_assets add constraint media_assets_category_check
  check (category in ('graphics', 'bumpers', 'curtains', 'promos', 'music', 'documents'));

-- Documents are information, not broadcast material: no material terms needed to download them.
create or replace function public.register_download(p_asset uuid, p_via text default 'single')
returns table (version_id uuid, file_path text, file_name text) language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  select mv.id, mv.file_path, mv.file_name, a.category into v
    from public.media_versions mv join public.media_assets a on a.id = mv.asset_id
   where mv.asset_id = p_asset and mv.is_current
     and ((a.status = 'published' and public.can_view(a.visibility)) or public.is_staff());
  if v.id is null then raise exception 'not_found'; end if;
  if v.category <> 'documents' and not public.is_staff()
     and not exists (select 1 from public.material_terms_acceptances where user_id = auth.uid()) then
    raise exception 'terms_required';
  end if;
  insert into public.media_downloads (user_id, asset_id, version_id, via)
  values (auth.uid(), p_asset, v.id, case when p_via = 'zip' then 'zip' else 'single' end);
  return query select v.id, v.file_path, v.file_name;
end $$;
