-- =====================================================================
-- Stage 2 · Content: handbook, announcements, deadlines, FAQ, glossary,
-- contacts, legal pages. Draft/publish workflow, search index, storage.
--
-- Publishing model (same for every content table):
--   status = 'draft'      → never published (or unpublished); only staff see it
--   status = 'published'  → visible to users allowed by `visibility`
--   draft (jsonb)         → pending edits of a published item (not yet live)
--   content_updated_at    → last time the live content changed (publish)
-- =====================================================================

-- ---------- Common columns on the two stage-1 tables ----------
alter table public.announcements
  add column if not exists draft jsonb,
  add column if not exists updated_by uuid references auth.users (id) on delete set null,
  add column if not exists content_updated_at timestamptz;
update public.announcements set content_updated_at = coalesce(published_at, created_at);

alter table public.deadlines
  add column if not exists status public.publish_status not null default 'published',
  add column if not exists draft jsonb,
  add column if not exists published_at timestamptz,
  add column if not exists content_updated_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists updated_by uuid references auth.users (id) on delete set null;
update public.deadlines set published_at = created_at, content_updated_at = created_at;
alter table public.deadlines alter column status set default 'draft';

-- ---------- Handbook ----------
create table public.handbook_chapters (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  summary_en text,
  summary_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.handbook_sections (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.handbook_chapters (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  body_en text not null default '',
  body_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  unique (chapter_id, slug)
);
create index handbook_sections_chapter_idx on public.handbook_sections (chapter_id, position);

-- ---------- FAQ ----------
create table public.faq_categories (
  id uuid primary key default gen_random_uuid(),
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

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.faq_categories (id) on delete cascade,
  position int not null default 0,
  question_en text not null,
  question_tr text,
  answer_en text not null default '',
  answer_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------- Glossary ----------
create table public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  term_en text not null,
  term_tr text,
  definition_en text not null default '',
  definition_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------- Contacts ----------
create table public.contact_areas (
  id uuid primary key default gen_random_uuid(),
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

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.contact_areas (id) on delete cascade,
  position int not null default 0,
  name text not null,
  role_en text not null default '',
  role_tr text,
  email text,
  phone text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------- Legal pages (readable without signing in: needed at registration) ----------
create table public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null default 0,
  title_en text not null,
  title_tr text,
  body_en text not null default '',
  body_tr text,
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  draft jsonb,
  published_at timestamptz,
  content_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- ---------- Generic triggers: updated_at + activity log ----------
create or replace function private.touch_content()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

create or replace function private.log_content_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r jsonb := to_jsonb(coalesce(new, old));
  o jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  v_title text := coalesce(r ->> 'title_en', r ->> 'question_en', r ->> 'term_en', r ->> 'name', '');
  v_action text;
begin
  if tg_op = 'INSERT' then v_action := 'content.created';
  elsif tg_op = 'DELETE' then v_action := 'content.deleted';
  elsif (o ->> 'status') = 'draft' and (r ->> 'status') = 'published' then v_action := 'content.published';
  elsif (o ->> 'status') = 'published' and (r ->> 'status') = 'draft' then v_action := 'content.unpublished';
  elsif (o ->> 'content_updated_at') is distinct from (r ->> 'content_updated_at') then v_action := 'content.republished';
  else v_action := 'content.updated';
  end if;
  if auth.uid() is not null then
    perform private.log_activity(v_action, tg_table_name, r ->> 'id', jsonb_build_object('title', v_title));
  end if;
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array['announcements', 'deadlines', 'handbook_chapters', 'handbook_sections', 'faq_categories',
                           'faqs', 'glossary_terms', 'contact_areas', 'contacts', 'legal_pages'] loop
    execute format('create trigger %I before update on public.%I for each row execute function private.touch_content()', t || '_touch', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function private.log_content_change()', t || '_log', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
  foreach t in array array['handbook_chapters', 'handbook_sections', 'faq_categories', 'faqs', 'glossary_terms',
                           'contact_areas', 'contacts'] loop
    execute format('create policy "%s: read published" on public.%I for select to authenticated using ((status = ''published'' and public.can_view(visibility)) or public.is_staff())', t, t);
    execute format('create policy "%s: staff write" on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t, t);
  end loop;
end $$;

-- deadlines: replace stage-1 read policy so drafts stay hidden
drop policy if exists "deadlines: read visible" on public.deadlines;
create policy "deadlines: read published" on public.deadlines for select to authenticated
  using ((status = 'published' and public.can_view(visibility)) or public.is_staff());

-- legal pages: published ones are public (registration links to them)
create policy "legal_pages: read published" on public.legal_pages for select to anon, authenticated
  using (status = 'published' or public.is_staff());
create policy "legal_pages: staff write" on public.legal_pages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());
grant select on public.legal_pages to anon;

-- ---------- Search index & "what changed" feed (respects RLS of the caller) ----------
create or replace function public.html_to_text(h text)
returns text language sql immutable set search_path = '' as $$
  select trim(regexp_replace(regexp_replace(coalesce(h, ''), '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g'))
$$;

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
    from public.legal_pages l where l.status = 'published';

grant select on public.content_index to authenticated;
revoke select on public.content_index from anon;

-- ---------- Storage: images for rich text, generated handbook PDFs ----------
insert into storage.buckets (id, name, public) values
  ('content-media', 'content-media', false),
  ('handbook-pdf', 'handbook-pdf', false)
on conflict (id) do nothing;

create policy "content-media: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'content-media' and public.is_approved());
create policy "content-media: staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'content-media' and public.is_staff());
create policy "content-media: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'content-media' and public.is_staff());
create policy "content-media: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'content-media' and public.is_staff());

create policy "handbook-pdf: approved read" on storage.objects for select to authenticated
  using (bucket_id = 'handbook-pdf' and public.is_approved());
create policy "handbook-pdf: staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'handbook-pdf' and public.is_staff());
create policy "handbook-pdf: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'handbook-pdf' and public.is_staff());
create policy "handbook-pdf: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'handbook-pdf' and public.is_staff());
