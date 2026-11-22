-- =====================================================================
-- Stage 3 · Media: Briefings (videos) and Media Hub (downloads)
-- =====================================================================

-- ---------- Briefing videos ----------
create table public.briefing_videos (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('welcome', 'ibc', 'signal', 'graphics', 'operations', 'venues')),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  description_en text,
  description_tr text,
  recorded_on date,
  duration_seconds int,
  video_path text,
  video_mime text,
  poster_path text,
  subtitles_en_path text,
  subtitles_tr_path text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.briefing_views (
  user_id uuid not null references auth.users (id) on delete cascade,
  video_id uuid not null references public.briefing_videos (id) on delete cascade,
  watched_at timestamptz not null default now(),
  primary key (user_id, video_id)
);

-- ---------- Media Hub ----------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('graphics', 'bumpers', 'curtains', 'promos', 'music')),
  subtype text,
  position int not null default 0,
  title_en text not null,
  title_tr text,
  description_en text,
  description_tr text,
  preview_path text,
  preview_kind text check (preview_kind in ('image', 'video')),
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.media_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.media_assets (id) on delete cascade,
  version_number int not null,
  is_current boolean not null default true,
  file_path text not null unique,
  file_name text not null,
  file_size bigint,
  mime text,
  format text,          -- e.g. "MOV · ProRes 422 HQ"
  codec text,
  resolution text,      -- e.g. "1920×1080"
  frame_rate text,      -- e.g. "25 fps"
  duration_seconds numeric,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  unique (asset_id, version_number)
);
create unique index media_versions_one_current on public.media_versions (asset_id) where is_current;

create table public.media_downloads (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  asset_id uuid references public.media_assets (id) on delete set null,
  version_id uuid references public.media_versions (id) on delete set null,
  via text not null default 'single' check (via in ('single', 'zip')),
  created_at timestamptz not null default now()
);
create index media_downloads_user_idx on public.media_downloads (user_id, created_at desc);
create index media_downloads_asset_idx on public.media_downloads (asset_id);

create table public.material_terms_acceptances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  terms_updated_at timestamptz
);

-- ---------- Triggers (updated_at, activity log) and RLS ----------
do $$
declare t text;
begin
  foreach t in array array['briefing_videos', 'media_assets'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.touch_content()', t || '_touch', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.log_content_change()', t || '_log', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: read published" on public.%I for select to authenticated using ((status = ''published'' and public.can_view(visibility)) or public.is_staff())', t, t);
    execute format('create policy "%s: staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t, t);
  end loop;
end $$;

alter table public.briefing_views enable row level security;
create policy "briefing_views: own" on public.briefing_views for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved());
create policy "briefing_views: admin read" on public.briefing_views for select to authenticated using (public.is_admin());

-- Versions: users see the current version of assets they can see; archived versions are admin only.
alter table public.media_versions enable row level security;
create policy "media_versions: read" on public.media_versions for select to authenticated using (
  public.is_admin()
  or (is_current and public.is_staff())
  or (is_current and exists (select 1 from public.media_assets a
                             where a.id = asset_id and a.status = 'published' and public.can_view(a.visibility)))
);
create policy "media_versions: staff insert" on public.media_versions for insert to authenticated with check (public.is_staff());
create policy "media_versions: staff update" on public.media_versions for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "media_versions: admin delete" on public.media_versions for delete to authenticated using (public.is_admin());

alter table public.media_downloads enable row level security;
create policy "media_downloads: own or admin read" on public.media_downloads for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

alter table public.material_terms_acceptances enable row level security;
create policy "terms: own or admin read" on public.material_terms_acceptances for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------- RPCs ----------
create or replace function public.accept_material_terms()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  insert into public.material_terms_acceptances (user_id, accepted_at, terms_updated_at)
  values (auth.uid(), now(), (select content_updated_at from public.legal_pages where slug = 'material'))
  on conflict (user_id) do update set accepted_at = now(), terms_updated_at = excluded.terms_updated_at;
  perform private.log_activity('media.terms_accepted', 'profile', auth.uid()::text, '{}'::jsonb);
end $$;

-- Records a download after checking the user may see the asset; returns the file path to sign.
create or replace function public.register_download(p_asset uuid, p_via text default 'single')
returns table (version_id uuid, file_path text, file_name text) language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.material_terms_acceptances where user_id = auth.uid()) then
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

-- Adds a new version: the previous one is archived (visible to admins only).
create or replace function public.add_media_version(p_asset uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_num int; v_status public.publish_status;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select status into v_status from public.media_assets where id = p_asset;
  if v_status is null then raise exception 'not_found'; end if;
  select coalesce(max(version_number), 0) + 1 into v_num from public.media_versions where asset_id = p_asset;
  update public.media_versions set is_current = false, archived_at = now() where asset_id = p_asset and is_current;
  insert into public.media_versions (asset_id, version_number, file_path, file_name, file_size, mime, format, codec,
                                     resolution, frame_rate, duration_seconds, notes, created_by)
  values (p_asset, v_num, p ->> 'file_path', left(p ->> 'file_name', 255), nullif(p ->> 'file_size', '')::bigint,
          left(p ->> 'mime', 120), left(p ->> 'format', 120), left(p ->> 'codec', 120), left(p ->> 'resolution', 60),
          left(p ->> 'frame_rate', 60), nullif(p ->> 'duration_seconds', '')::numeric, left(p ->> 'notes', 1000), auth.uid())
  returning id into v_id;
  if v_status = 'published' then
    update public.media_assets set content_updated_at = now() where id = p_asset;
  end if;
  perform private.log_activity('media.version_added', 'media_assets', p_asset::text,
                               jsonb_build_object('version', v_num, 'file', p ->> 'file_name'));
  return v_id;
end $$;

revoke execute on function public.accept_material_terms(), public.register_download(uuid, text),
  public.add_media_version(uuid, jsonb) from public, anon;
grant execute on function public.accept_material_terms(), public.register_download(uuid, text),
  public.add_media_version(uuid, jsonb) to authenticated;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values
  ('media-files', 'media-files', false),
  ('media-previews', 'media-previews', false),
  ('briefings', 'briefings', false)
on conflict (id) do nothing;

-- Media files: only staff, or the current version of an asset the user may see.
create policy "media-files: read" on storage.objects for select to authenticated using (
  bucket_id = 'media-files' and (
    public.is_staff()
    or exists (select 1 from public.media_versions v join public.media_assets a on a.id = v.asset_id
               where v.file_path = name and v.is_current and a.status = 'published' and public.can_view(a.visibility))
  )
);
create policy "media-previews: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'media-previews' and public.is_approved());
create policy "briefings: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'briefings' and public.is_approved());

do $$
declare b text;
begin
  foreach b in array array['media-files', 'media-previews', 'briefings'] loop
    execute format('create policy "%s: staff insert" on storage.objects for insert to authenticated with check (bucket_id = %L and public.is_staff())', b, b);
    execute format('create policy "%s: staff update" on storage.objects for update to authenticated using (bucket_id = %L and public.is_staff())', b, b);
    execute format('create policy "%s: staff delete" on storage.objects for delete to authenticated using (bucket_id = %L and public.is_staff())', b, b);
  end loop;
end $$;

-- ---------- Search index / "what changed" now includes media ----------
create or replace view public.content_index with (security_invoker = true) as
  select 'handbook'::text as kind, s.id, s.title_en, s.title_tr,
         public.html_to_text(s.body_en) as text_en, public.html_to_text(s.body_tr) as text_tr,
         '/handbook/' || c.slug || '/' || s.slug as href, s.published_at, s.content_updated_at
    from public.handbook_sections s join public.handbook_chapters c on c.id = s.chapter_id
   where s.status = 'published' and c.status = 'published'
  union all
  select 'news', a.id, a.title_en, a.title_tr, public.html_to_text(a.body_en), public.html_to_text(a.body_tr),
         '/news/' || a.id, a.published_at, a.content_updated_at
    from public.announcements a where a.status = 'published'
  union all
  select 'faq', f.id, f.question_en, f.question_tr, public.html_to_text(f.answer_en), public.html_to_text(f.answer_tr),
         '/faq#q-' || f.id, f.published_at, f.content_updated_at
    from public.faqs f join public.faq_categories fc on fc.id = f.category_id
   where f.status = 'published' and fc.status = 'published'
  union all
  select 'glossary', g.id, g.term_en, g.term_tr, g.definition_en, g.definition_tr,
         '/glossary#t-' || g.id, g.published_at, g.content_updated_at
    from public.glossary_terms g where g.status = 'published'
  union all
  select 'contacts', ct.id, ct.name, ct.name, coalesce(ct.role_en, '') || ' ' || coalesce(ct.email, ''),
         coalesce(ct.role_tr, ct.role_en, '') || ' ' || coalesce(ct.email, ''),
         '/contacts#c-' || ct.id, ct.published_at, ct.content_updated_at
    from public.contacts ct join public.contact_areas ca on ca.id = ct.area_id
   where ct.status = 'published' and ca.status = 'published'
  union all
  select 'legal', l.id, l.title_en, l.title_tr, public.html_to_text(l.body_en), public.html_to_text(l.body_tr),
         '/legal/' || l.slug, l.published_at, l.content_updated_at
    from public.legal_pages l where l.status = 'published'
  union all
  select 'briefing', b.id, b.title_en, b.title_tr, b.description_en, b.description_tr,
         '/briefings/' || b.id, b.published_at, b.content_updated_at
    from public.briefing_videos b where b.status = 'published'
  union all
  select 'media', m.id, m.title_en, m.title_tr,
         coalesce(m.description_en, '') || ' ' || coalesce(m.subtype, '') || ' ' || m.category,
         coalesce(m.description_tr, m.description_en, '') || ' ' || coalesce(m.subtype, '') || ' ' || m.category,
         '/media-hub?item=' || m.id, m.published_at, m.content_updated_at
    from public.media_assets m where m.status = 'published';
