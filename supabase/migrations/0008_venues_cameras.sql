-- =====================================================================
-- Stage 4 · Venues and camera maps
-- =====================================================================

create table public.clusters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  field_shape text not null default 'generic',
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  cluster_id uuid not null references public.clusters (id) on delete restrict,
  position int not null default 0,
  title_en text not null,
  title_tr text,
  address text,
  production_level text check (production_level in ('1', '2', '3')),
  capacity int,
  map_x numeric not null default 50,
  map_y numeric not null default 50,
  commentary_en text, commentary_tr text,
  unilaterals_en text, unilaterals_tr text,
  access_en text, access_tr text,
  contacts_en text, contacts_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.venue_sports (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete cascade,
  position int not null default 0,
  start_date date,
  end_date date,
  notes_en text, notes_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.venue_files (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  kind text not null check (kind in ('photo', 'document')),
  position int not null default 0,
  title_en text, title_tr text,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime text,
  created_at timestamptz not null default now()
);

create table public.camera_plans (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete cascade,
  position int not null default 0,
  title_en text not null,               -- configuration, e.g. "Finals"
  title_tr text,
  field_shape text,                     -- overrides the sport's field drawing
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.cameras (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.camera_plans (id) on delete cascade,
  position int not null default 0,
  number text not null,
  type text not null default 'hard',
  lens text,
  function_en text,
  function_tr text,
  level text not null default '1' check (level in ('1', '2', '3')),
  is_special boolean not null default false,
  x numeric not null default 0.5 check (x between 0 and 1),
  y numeric not null default 0.5 check (y between 0 and 1),
  angle numeric,                        -- direction the camera points to, in degrees (0 = right)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cameras_plan_idx on public.cameras (plan_id, position);

create table public.camera_drawings (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.camera_plans (id) on delete cascade,
  version_number int not null,
  is_current boolean not null default true,
  file_path text not null unique,
  file_name text not null,
  file_size bigint,
  numbering_checked boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  unique (plan_id, version_number)
);
create unique index camera_drawings_one_current on public.camera_drawings (plan_id) where is_current;

-- ---------- Generic triggers + RLS for CMS-managed tables ----------
do $$
declare t text;
begin
  foreach t in array array['clusters', 'sports', 'venues', 'venue_sports', 'camera_plans'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.touch_content()', t || '_touch', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.log_content_change()', t || '_log', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s: read published" on public.%I for select to authenticated using ((status = ''published'' and public.can_view(visibility)) or public.is_staff())', t, t);
    execute format('create policy "%s: staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t, t);
  end loop;
end $$;

-- Visibility helper: can the current user see this plan?
create or replace function public.can_view_plan(p uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_staff() or exists (
    select 1 from public.camera_plans cp join public.venues v on v.id = cp.venue_id
     where cp.id = p and cp.status = 'published' and public.can_view(cp.visibility)
       and v.status = 'published' and public.can_view(v.visibility))
$$;
revoke execute on function public.can_view_plan(uuid) from public, anon;
grant execute on function public.can_view_plan(uuid) to authenticated;

alter table public.cameras enable row level security;
create policy "cameras: read" on public.cameras for select to authenticated using (public.can_view_plan(plan_id));
create policy "cameras: staff write" on public.cameras for all to authenticated using (public.is_staff()) with check (public.is_staff());

create or replace function private.touch_camera()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger cameras_touch before update on public.cameras for each row execute function private.touch_camera();

alter table public.camera_drawings enable row level security;
create policy "camera_drawings: read" on public.camera_drawings for select to authenticated
  using (public.is_admin() or (is_current and public.can_view_plan(plan_id)));
create policy "camera_drawings: staff insert" on public.camera_drawings for insert to authenticated with check (public.is_staff());
create policy "camera_drawings: staff update" on public.camera_drawings for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "camera_drawings: admin delete" on public.camera_drawings for delete to authenticated using (public.is_admin());

alter table public.venue_files enable row level security;
create policy "venue_files: read" on public.venue_files for select to authenticated using (
  public.is_staff() or exists (select 1 from public.venues v where v.id = venue_id and v.status = 'published' and public.can_view(v.visibility))
);
create policy "venue_files: staff write" on public.venue_files for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- New architecture drawing: previous version archived; plan marked as updated.
create or replace function public.add_camera_drawing(p_plan uuid, p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_num int; v_status public.publish_status;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  if coalesce((p ->> 'numbering_checked')::boolean, false) is not true then raise exception 'numbering_not_checked'; end if;
  select status into v_status from public.camera_plans where id = p_plan;
  if v_status is null then raise exception 'not_found'; end if;
  select coalesce(max(version_number), 0) + 1 into v_num from public.camera_drawings where plan_id = p_plan;
  update public.camera_drawings set is_current = false, archived_at = now() where plan_id = p_plan and is_current;
  insert into public.camera_drawings (plan_id, version_number, file_path, file_name, file_size, numbering_checked, notes, created_by)
  values (p_plan, v_num, p ->> 'file_path', left(p ->> 'file_name', 255), nullif(p ->> 'file_size', '')::bigint, true,
          left(p ->> 'notes', 1000), auth.uid())
  returning id into v_id;
  if v_status = 'published' then
    update public.camera_plans set content_updated_at = now() where id = p_plan;
  end if;
  perform private.log_activity('camera.drawing_added', 'camera_plans', p_plan::text,
                               jsonb_build_object('version', v_num, 'file', p ->> 'file_name'));
  return v_id;
end $$;

-- Saves the whole camera list of a plan at once (from the drag & drop editor).
create or replace function public.save_cameras(p_plan uuid, p_cameras jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare c jsonb; i int := 0; keep uuid[] := '{}'; v_id uuid; v_status public.publish_status;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select status into v_status from public.camera_plans where id = p_plan;
  if v_status is null then raise exception 'not_found'; end if;
  for c in select * from jsonb_array_elements(coalesce(p_cameras, '[]'::jsonb)) loop
    i := i + 1;
    v_id := nullif(c ->> 'id', '')::uuid;
    if v_id is not null and exists (select 1 from public.cameras where id = v_id and plan_id = p_plan) then
      update public.cameras set position = i, number = left(coalesce(c ->> 'number', ''), 20), type = left(coalesce(c ->> 'type', 'hard'), 40),
             lens = left(c ->> 'lens', 80), function_en = left(c ->> 'function_en', 200), function_tr = nullif(left(c ->> 'function_tr', 200), ''),
             level = coalesce(nullif(c ->> 'level', ''), '1'), is_special = coalesce((c ->> 'is_special')::boolean, false),
             x = least(1, greatest(0, coalesce((c ->> 'x')::numeric, 0.5))), y = least(1, greatest(0, coalesce((c ->> 'y')::numeric, 0.5))),
             angle = nullif(c ->> 'angle', '')::numeric
       where id = v_id;
    else
      insert into public.cameras (plan_id, position, number, type, lens, function_en, function_tr, level, is_special, x, y, angle)
      values (p_plan, i, left(coalesce(c ->> 'number', ''), 20), left(coalesce(c ->> 'type', 'hard'), 40), left(c ->> 'lens', 80),
              left(c ->> 'function_en', 200), nullif(left(c ->> 'function_tr', 200), ''), coalesce(nullif(c ->> 'level', ''), '1'),
              coalesce((c ->> 'is_special')::boolean, false),
              least(1, greatest(0, coalesce((c ->> 'x')::numeric, 0.5))), least(1, greatest(0, coalesce((c ->> 'y')::numeric, 0.5))),
              nullif(c ->> 'angle', '')::numeric)
      returning id into v_id;
    end if;
    keep := keep || v_id;
  end loop;
  delete from public.cameras where plan_id = p_plan and not (id = any (keep));
  if v_status = 'published' then
    update public.camera_plans set content_updated_at = now() where id = p_plan;
  end if;
  perform private.log_activity('camera.cameras_saved', 'camera_plans', p_plan::text, jsonb_build_object('count', i));
end $$;

revoke execute on function public.add_camera_drawing(uuid, jsonb), public.save_cameras(uuid, jsonb) from public, anon;
grant execute on function public.add_camera_drawing(uuid, jsonb), public.save_cameras(uuid, jsonb) to authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values
  ('venues', 'venues', false),
  ('camera-drawings', 'camera-drawings', false),
  ('camera-exports', 'camera-exports', false)
on conflict (id) do nothing;

create policy "venues: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'venues' and public.is_approved());
create policy "camera-drawings: read" on storage.objects for select to authenticated using (
  bucket_id = 'camera-drawings' and (
    public.is_staff()
    or exists (select 1 from public.camera_drawings d where d.file_path = name and d.is_current and public.can_view_plan(d.plan_id))
  )
);
-- Generated exports: any approved user may create and read them (they only contain what they can already see).
create policy "camera-exports: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'camera-exports' and public.is_approved());
create policy "camera-exports: approved insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'camera-exports' and public.is_approved() and (storage.foldername(name))[1] = auth.uid()::text);

do $$
declare b text;
begin
  foreach b in array array['venues', 'camera-drawings'] loop
    execute format('create policy "%s: staff insert" on storage.objects for insert to authenticated with check (bucket_id = %L and public.is_staff())', b, b);
    execute format('create policy "%s: staff update" on storage.objects for update to authenticated using (bucket_id = %L and public.is_staff())', b, b);
    execute format('create policy "%s: staff delete" on storage.objects for delete to authenticated using (bucket_id = %L and public.is_staff())', b, b);
  end loop;
end $$;

-- ---------- Search / "what changed": venues and camera maps ----------
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
    from public.media_assets m where m.status = 'published'
  union all
  select 'venue', v.id, v.title_en, v.title_tr,
         coalesce(v.address, '') || ' ' || cl.title_en || ' ' || public.html_to_text(v.access_en),
         coalesce(v.address, '') || ' ' || coalesce(cl.title_tr, cl.title_en) || ' ' || public.html_to_text(coalesce(v.access_tr, v.access_en)),
         '/venues/' || v.slug, v.published_at, v.content_updated_at
    from public.venues v join public.clusters cl on cl.id = v.cluster_id
   where v.status = 'published'
  union all
  select 'camera_map', cp.id, v.title_en || ' · ' || sp.title_en || ' · ' || cp.title_en,
         coalesce(v.title_tr, v.title_en) || ' · ' || coalesce(sp.title_tr, sp.title_en) || ' · ' || coalesce(cp.title_tr, cp.title_en),
         sp.title_en, coalesce(sp.title_tr, sp.title_en),
         '/camera-maps/' || cp.id, cp.published_at, cp.content_updated_at
    from public.camera_plans cp join public.venues v on v.id = cp.venue_id join public.sports sp on sp.id = cp.sport_id
   where cp.status = 'published' and v.status = 'published';
