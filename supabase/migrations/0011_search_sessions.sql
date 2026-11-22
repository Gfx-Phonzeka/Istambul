-- Search and "what changed" also cover competition sessions.
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
   where cp.status = 'published' and v.status = 'published'
  union all
  select 'session', ss.id, sp.title_en || ' – ' || coalesce(ss.phase_en, ''), coalesce(sp.title_tr, sp.title_en) || ' – ' || coalesce(ss.phase_tr, ss.phase_en, ''),
         coalesce(ss.discipline_en, '') || ' ' || coalesce(ss.medal_events_en, '') || ' ' || v.title_en || ' ' || ss.code,
         coalesce(ss.discipline_tr, ss.discipline_en, '') || ' ' || coalesce(ss.medal_events_tr, ss.medal_events_en, '') || ' ' || coalesce(v.title_tr, v.title_en) || ' ' || ss.code,
         '/schedule?session=' || ss.id, ss.published_at, ss.content_updated_at
    from public.schedule_sessions ss join public.sports sp on sp.id = ss.sport_id join public.venues v on v.id = ss.venue_id
   where ss.status = 'published';
