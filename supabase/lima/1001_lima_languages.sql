-- HB Portal · Lima 2027 only. Runs on Lima's database after migrations 0001–0016 (never on Istanbul's).
-- 1. Spanish and Portuguese next to every English text column (Turkish columns stay, unused).
-- 2. Profile languages: es (default), en, pt.
-- 3. Database texts (emails, notifications): Lima's name and time zone instead of Istanbul's.
-- 4. Search view with es/en/pt columns.

do $$
declare r record;
begin
  for r in
    select c.table_name, c.column_name, c.is_nullable
      from information_schema.columns c
      join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
     where c.table_schema = 'public' and c.column_name like '%\_en' and c.data_type = 'text'
  loop
    execute format('alter table public.%I add column if not exists %I text', r.table_name, regexp_replace(r.column_name, '_en$', '_es'));
    execute format('alter table public.%I add column if not exists %I text', r.table_name, regexp_replace(r.column_name, '_en$', '_pt'));
    if r.is_nullable = 'NO' then
      execute format('alter table public.%I alter column %I drop not null', r.table_name, r.column_name);
    end if;
  end loop;
end $$;

alter table public.profiles drop constraint if exists profiles_preferred_language_check;
alter table public.profiles alter column preferred_language set default 'es';
alter table public.profiles add constraint profiles_preferred_language_check check (preferred_language in ('es', 'en', 'pt'));

-- Rewrites the bodies of database functions that mention Istanbul (names, time zone, language choice).
do $$
declare r record; d text;
begin
  for r in
    select p.oid from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname in ('public', 'private') and p.prokind = 'f'
       and (p.prosrc like '%Istanbul%' or p.prosrc like '%''tr'' then ''tr'' else ''en''%')
  loop
    d := pg_get_functiondef(r.oid);
    d := replace(d, 'Europe/Istanbul', 'America/Lima');
    d := replace(d, '(Istanbul)', '(Lima)');
    d := replace(d, 'Istanbul 2027 Right Holders Portal', 'Lima 2027 HB Portal');
    d := replace(d, 'Istanbul 2027 Yayın Hakkı Sahipleri Portalı', 'Lima 2027 HB Portal');
    d := replace(d, 'Istanbul 2027', 'Lima 2027');
    d := replace(d, 'Medialuso – Host Broadcaster', 'Host Broadcaster · Lima 2027');
    d := replace(d, 'case when m ->> ''lang'' = ''tr'' then ''tr'' else ''en'' end', 'case when m ->> ''lang'' in (''es'', ''en'', ''pt'') then m ->> ''lang'' else ''es'' end');
    d := replace(d, 'case when p ->> ''lang'' = ''tr'' then ''tr'' else ''en'' end', 'case when p ->> ''lang'' in (''es'', ''en'', ''pt'') then p ->> ''lang'' else ''es'' end');
    execute d;
  end loop;
end $$;

drop view if exists public.content_index;
create view public.content_index with (security_invoker = true) as
 SELECT 'handbook'::text AS kind,
    s.id,
    coalesce(s.title_es, s.title_en, s.title_pt) AS title_es,
    coalesce(s.title_en, s.title_es, s.title_pt) AS title_en,
    coalesce(s.title_pt, s.title_es, s.title_en) AS title_pt,
    html_to_text(coalesce(s.body_es, s.body_en, s.body_pt)) AS text_es,
    html_to_text(coalesce(s.body_en, s.body_es, s.body_pt)) AS text_en,
    html_to_text(coalesce(s.body_pt, s.body_es, s.body_en)) AS text_pt,
    (('/handbook/'::text || c.slug) || '/'::text) || s.slug AS href,
    s.published_at,
    s.content_updated_at
   FROM handbook_sections s
     JOIN handbook_chapters c ON c.id = s.chapter_id
  WHERE s.status = 'published'::publish_status AND c.status = 'published'::publish_status
UNION ALL
 SELECT 'guide'::text AS kind,
    g.id,
    coalesce(g.title_es, g.title_en, g.title_pt) AS title_es,
    coalesce(g.title_en, g.title_es, g.title_pt) AS title_en,
    coalesce(g.title_pt, g.title_es, g.title_en) AS title_pt,
    (((html_to_text(coalesce(g.body_es, g.body_en, g.body_pt)) || ' '::text) || COALESCE(g.title_pt, ''::text)) || ' '::text) || html_to_text(COALESCE(g.body_pt, ''::text)) AS text_es,
    (((html_to_text(coalesce(g.body_en, g.body_es, g.body_pt)) || ' '::text) || COALESCE(g.title_pt, ''::text)) || ' '::text) || html_to_text(COALESCE(g.body_pt, ''::text)) AS text_en,
    (((html_to_text(coalesce(g.body_pt, g.body_es, g.body_en)) || ' '::text) || COALESCE(g.title_pt, ''::text)) || ' '::text) || html_to_text(COALESCE(g.body_pt, ''::text)) AS text_pt,
    (('/team/guidelines/'::text || gc.slug) || '/'::text) || g.slug AS href,
    g.published_at,
    g.content_updated_at
   FROM guide_sections g
     JOIN guide_chapters gc ON gc.id = g.chapter_id
  WHERE g.status = 'published'::publish_status AND gc.status = 'published'::publish_status
UNION ALL
 SELECT 'news'::text AS kind,
    a.id,
    coalesce(a.title_es, a.title_en, a.title_pt) AS title_es,
    coalesce(a.title_en, a.title_es, a.title_pt) AS title_en,
    coalesce(a.title_pt, a.title_es, a.title_en) AS title_pt,
    html_to_text(coalesce(a.body_es, a.body_en, a.body_pt)) AS text_es,
    html_to_text(coalesce(a.body_en, a.body_es, a.body_pt)) AS text_en,
    html_to_text(coalesce(a.body_pt, a.body_es, a.body_en)) AS text_pt,
    '/news/'::text || a.id AS href,
    a.published_at,
    a.content_updated_at
   FROM announcements a
  WHERE a.status = 'published'::publish_status
UNION ALL
 SELECT 'faq'::text AS kind,
    f.id,
    coalesce(f.question_es, f.question_en, f.question_pt) AS title_es,
    coalesce(f.question_en, f.question_es, f.question_pt) AS title_en,
    coalesce(f.question_pt, f.question_es, f.question_en) AS title_pt,
    html_to_text(coalesce(f.answer_es, f.answer_en, f.answer_pt)) AS text_es,
    html_to_text(coalesce(f.answer_en, f.answer_es, f.answer_pt)) AS text_en,
    html_to_text(coalesce(f.answer_pt, f.answer_es, f.answer_en)) AS text_pt,
    '/faq#q-'::text || f.id AS href,
    f.published_at,
    f.content_updated_at
   FROM faqs f
     JOIN faq_categories fc ON fc.id = f.category_id
  WHERE f.status = 'published'::publish_status AND fc.status = 'published'::publish_status
UNION ALL
 SELECT 'glossary'::text AS kind,
    g.id,
    coalesce(g.term_es, g.term_en, g.term_pt) AS title_es,
    coalesce(g.term_en, g.term_es, g.term_pt) AS title_en,
    coalesce(g.term_pt, g.term_es, g.term_en) AS title_pt,
    coalesce(g.definition_es, g.definition_en, g.definition_pt) AS text_es,
    coalesce(g.definition_en, g.definition_es, g.definition_pt) AS text_en,
    coalesce(g.definition_pt, g.definition_es, g.definition_en) AS text_pt,
    '/glossary#t-'::text || g.id AS href,
    g.published_at,
    g.content_updated_at
   FROM glossary_terms g
  WHERE g.status = 'published'::publish_status
UNION ALL
 SELECT 'contacts'::text AS kind,
    ct.id,
    ct.name AS title_es,
    ct.name AS title_en,
    ct.name AS title_pt,
    (COALESCE(coalesce(ct.role_es, ct.role_en, ct.role_pt), ''::text) || ' '::text) || COALESCE(ct.email, ''::text) AS text_es,
    (COALESCE(coalesce(ct.role_en, ct.role_es, ct.role_pt), ''::text) || ' '::text) || COALESCE(ct.email, ''::text) AS text_en,
    (COALESCE(coalesce(ct.role_pt, ct.role_es, ct.role_en), ''::text) || ' '::text) || COALESCE(ct.email, ''::text) AS text_pt,
    '/contacts#c-'::text || ct.id AS href,
    ct.published_at,
    ct.content_updated_at
   FROM contacts ct
     JOIN contact_areas ca ON ca.id = ct.area_id
  WHERE ct.status = 'published'::publish_status AND ca.status = 'published'::publish_status
UNION ALL
 SELECT 'legal'::text AS kind,
    l.id,
    coalesce(l.title_es, l.title_en, l.title_pt) AS title_es,
    coalesce(l.title_en, l.title_es, l.title_pt) AS title_en,
    coalesce(l.title_pt, l.title_es, l.title_en) AS title_pt,
    html_to_text(coalesce(l.body_es, l.body_en, l.body_pt)) AS text_es,
    html_to_text(coalesce(l.body_en, l.body_es, l.body_pt)) AS text_en,
    html_to_text(coalesce(l.body_pt, l.body_es, l.body_en)) AS text_pt,
    '/legal/'::text || l.slug AS href,
    l.published_at,
    l.content_updated_at
   FROM legal_pages l
  WHERE l.status = 'published'::publish_status
UNION ALL
 SELECT 'briefing'::text AS kind,
    b.id,
    coalesce(b.title_es, b.title_en, b.title_pt) AS title_es,
    coalesce(b.title_en, b.title_es, b.title_pt) AS title_en,
    coalesce(b.title_pt, b.title_es, b.title_en) AS title_pt,
    coalesce(b.description_es, b.description_en, b.description_pt) AS text_es,
    coalesce(b.description_en, b.description_es, b.description_pt) AS text_en,
    coalesce(b.description_pt, b.description_es, b.description_en) AS text_pt,
    '/briefings/'::text || b.id AS href,
    b.published_at,
    b.content_updated_at
   FROM briefing_videos b
  WHERE b.status = 'published'::publish_status
UNION ALL
 SELECT 'media'::text AS kind,
    m.id,
    coalesce(m.title_es, m.title_en, m.title_pt) AS title_es,
    coalesce(m.title_en, m.title_es, m.title_pt) AS title_en,
    coalesce(m.title_pt, m.title_es, m.title_en) AS title_pt,
    (((COALESCE(coalesce(m.description_es, m.description_en, m.description_pt), ''::text) || ' '::text) || COALESCE(m.subtype, ''::text)) || ' '::text) || m.category AS text_es,
    (((COALESCE(coalesce(m.description_en, m.description_es, m.description_pt), ''::text) || ' '::text) || COALESCE(m.subtype, ''::text)) || ' '::text) || m.category AS text_en,
    (((COALESCE(coalesce(m.description_pt, m.description_es, m.description_en), ''::text) || ' '::text) || COALESCE(m.subtype, ''::text)) || ' '::text) || m.category AS text_pt,
    '/media-hub?item='::text || m.id AS href,
    m.published_at,
    m.content_updated_at
   FROM media_assets m
  WHERE m.status = 'published'::publish_status
UNION ALL
 SELECT 'venue'::text AS kind,
    v.id,
    coalesce(v.title_es, v.title_en, v.title_pt) AS title_es,
    coalesce(v.title_en, v.title_es, v.title_pt) AS title_en,
    coalesce(v.title_pt, v.title_es, v.title_en) AS title_pt,
    (((COALESCE(v.address, ''::text) || ' '::text) || coalesce(cl.title_es, cl.title_en, cl.title_pt)) || ' '::text) || html_to_text(coalesce(v.access_es, v.access_en, v.access_pt)) AS text_es,
    (((COALESCE(v.address, ''::text) || ' '::text) || coalesce(cl.title_en, cl.title_es, cl.title_pt)) || ' '::text) || html_to_text(coalesce(v.access_en, v.access_es, v.access_pt)) AS text_en,
    (((COALESCE(v.address, ''::text) || ' '::text) || coalesce(cl.title_pt, cl.title_es, cl.title_en)) || ' '::text) || html_to_text(coalesce(v.access_pt, v.access_es, v.access_en)) AS text_pt,
    '/venues/'::text || v.slug AS href,
    v.published_at,
    v.content_updated_at
   FROM venues v
     JOIN clusters cl ON cl.id = v.cluster_id
  WHERE v.status = 'published'::publish_status
UNION ALL
 SELECT 'camera_map'::text AS kind,
    cp.id,
    (((coalesce(v.title_es, v.title_en, v.title_pt) || ' · '::text) || coalesce(sp.title_es, sp.title_en, sp.title_pt)) || ' · '::text) || coalesce(cp.title_es, cp.title_en, cp.title_pt) AS title_es,
    (((coalesce(v.title_en, v.title_es, v.title_pt) || ' · '::text) || coalesce(sp.title_en, sp.title_es, sp.title_pt)) || ' · '::text) || coalesce(cp.title_en, cp.title_es, cp.title_pt) AS title_en,
    (((coalesce(v.title_pt, v.title_es, v.title_en) || ' · '::text) || coalesce(sp.title_pt, sp.title_es, sp.title_en)) || ' · '::text) || coalesce(cp.title_pt, cp.title_es, cp.title_en) AS title_pt,
    coalesce(sp.title_es, sp.title_en, sp.title_pt) AS text_es,
    coalesce(sp.title_en, sp.title_es, sp.title_pt) AS text_en,
    coalesce(sp.title_pt, sp.title_es, sp.title_en) AS text_pt,
    '/camera-maps/'::text || cp.id AS href,
    cp.published_at,
    cp.content_updated_at
   FROM camera_plans cp
     JOIN venues v ON v.id = cp.venue_id
     JOIN sports sp ON sp.id = cp.sport_id
  WHERE cp.status = 'published'::publish_status AND v.status = 'published'::publish_status
UNION ALL
 SELECT 'session'::text AS kind,
    ss.id,
    (coalesce(sp.title_es, sp.title_en, sp.title_pt) || ' – '::text) || COALESCE(coalesce(ss.phase_es, ss.phase_en, ss.phase_pt), ''::text) AS title_es,
    (coalesce(sp.title_en, sp.title_es, sp.title_pt) || ' – '::text) || COALESCE(coalesce(ss.phase_en, ss.phase_es, ss.phase_pt), ''::text) AS title_en,
    (coalesce(sp.title_pt, sp.title_es, sp.title_en) || ' – '::text) || COALESCE(coalesce(ss.phase_pt, ss.phase_es, ss.phase_en), ''::text) AS title_pt,
    (((((COALESCE(coalesce(ss.discipline_es, ss.discipline_en, ss.discipline_pt), ''::text) || ' '::text) || COALESCE(coalesce(ss.medal_events_es, ss.medal_events_en, ss.medal_events_pt), ''::text)) || ' '::text) || coalesce(v.title_es, v.title_en, v.title_pt)) || ' '::text) || ss.code AS text_es,
    (((((COALESCE(coalesce(ss.discipline_en, ss.discipline_es, ss.discipline_pt), ''::text) || ' '::text) || COALESCE(coalesce(ss.medal_events_en, ss.medal_events_es, ss.medal_events_pt), ''::text)) || ' '::text) || coalesce(v.title_en, v.title_es, v.title_pt)) || ' '::text) || ss.code AS text_en,
    (((((COALESCE(coalesce(ss.discipline_pt, ss.discipline_es, ss.discipline_en), ''::text) || ' '::text) || COALESCE(coalesce(ss.medal_events_pt, ss.medal_events_es, ss.medal_events_en), ''::text)) || ' '::text) || coalesce(v.title_pt, v.title_es, v.title_en)) || ' '::text) || ss.code AS text_pt,
    '/schedule?session='::text || ss.id AS href,
    ss.published_at,
    ss.content_updated_at
   FROM schedule_sessions ss
     JOIN sports sp ON sp.id = ss.sport_id
     JOIN venues v ON v.id = ss.venue_id
  WHERE ss.status = 'published'::publish_status;
grant select on public.content_index to authenticated;
