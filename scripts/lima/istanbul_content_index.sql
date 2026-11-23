 SELECT 'handbook'::text AS kind,
    s.id,
    s.title_en,
    s.title_tr,
    html_to_text(s.body_en) AS text_en,
    html_to_text(s.body_tr) AS text_tr,
    (('/handbook/'::text || c.slug) || '/'::text) || s.slug AS href,
    s.published_at,
    s.content_updated_at
   FROM handbook_sections s
     JOIN handbook_chapters c ON c.id = s.chapter_id
  WHERE s.status = 'published'::publish_status AND c.status = 'published'::publish_status
UNION ALL
 SELECT 'guide'::text AS kind,
    g.id,
    g.title_en,
    g.title_tr,
    (((html_to_text(g.body_en) || ' '::text) || COALESCE(g.title_pt, ''::text)) || ' '::text) || html_to_text(COALESCE(g.body_pt, ''::text)) AS text_en,
    html_to_text(COALESCE(g.body_tr, g.body_en)) AS text_tr,
    (('/team/guidelines/'::text || gc.slug) || '/'::text) || g.slug AS href,
    g.published_at,
    g.content_updated_at
   FROM guide_sections g
     JOIN guide_chapters gc ON gc.id = g.chapter_id
  WHERE g.status = 'published'::publish_status AND gc.status = 'published'::publish_status
UNION ALL
 SELECT 'news'::text AS kind,
    a.id,
    a.title_en,
    a.title_tr,
    html_to_text(a.body_en) AS text_en,
    html_to_text(a.body_tr) AS text_tr,
    '/news/'::text || a.id AS href,
    a.published_at,
    a.content_updated_at
   FROM announcements a
  WHERE a.status = 'published'::publish_status
UNION ALL
 SELECT 'faq'::text AS kind,
    f.id,
    f.question_en AS title_en,
    f.question_tr AS title_tr,
    html_to_text(f.answer_en) AS text_en,
    html_to_text(f.answer_tr) AS text_tr,
    '/faq#q-'::text || f.id AS href,
    f.published_at,
    f.content_updated_at
   FROM faqs f
     JOIN faq_categories fc ON fc.id = f.category_id
  WHERE f.status = 'published'::publish_status AND fc.status = 'published'::publish_status
UNION ALL
 SELECT 'glossary'::text AS kind,
    g.id,
    g.term_en AS title_en,
    g.term_tr AS title_tr,
    g.definition_en AS text_en,
    g.definition_tr AS text_tr,
    '/glossary#t-'::text || g.id AS href,
    g.published_at,
    g.content_updated_at
   FROM glossary_terms g
  WHERE g.status = 'published'::publish_status
UNION ALL
 SELECT 'contacts'::text AS kind,
    ct.id,
    ct.name AS title_en,
    ct.name AS title_tr,
    (COALESCE(ct.role_en, ''::text) || ' '::text) || COALESCE(ct.email, ''::text) AS text_en,
    (COALESCE(ct.role_tr, ct.role_en, ''::text) || ' '::text) || COALESCE(ct.email, ''::text) AS text_tr,
    '/contacts#c-'::text || ct.id AS href,
    ct.published_at,
    ct.content_updated_at
   FROM contacts ct
     JOIN contact_areas ca ON ca.id = ct.area_id
  WHERE ct.status = 'published'::publish_status AND ca.status = 'published'::publish_status
UNION ALL
 SELECT 'legal'::text AS kind,
    l.id,
    l.title_en,
    l.title_tr,
    html_to_text(l.body_en) AS text_en,
    html_to_text(l.body_tr) AS text_tr,
    '/legal/'::text || l.slug AS href,
    l.published_at,
    l.content_updated_at
   FROM legal_pages l
  WHERE l.status = 'published'::publish_status
UNION ALL
 SELECT 'briefing'::text AS kind,
    b.id,
    b.title_en,
    b.title_tr,
    b.description_en AS text_en,
    b.description_tr AS text_tr,
    '/briefings/'::text || b.id AS href,
    b.published_at,
    b.content_updated_at
   FROM briefing_videos b
  WHERE b.status = 'published'::publish_status
UNION ALL
 SELECT 'media'::text AS kind,
    m.id,
    m.title_en,
    m.title_tr,
    (((COALESCE(m.description_en, ''::text) || ' '::text) || COALESCE(m.subtype, ''::text)) || ' '::text) || m.category AS text_en,
    (((COALESCE(m.description_tr, m.description_en, ''::text) || ' '::text) || COALESCE(m.subtype, ''::text)) || ' '::text) || m.category AS text_tr,
    '/media-hub?item='::text || m.id AS href,
    m.published_at,
    m.content_updated_at
   FROM media_assets m
  WHERE m.status = 'published'::publish_status
UNION ALL
 SELECT 'venue'::text AS kind,
    v.id,
    v.title_en,
    v.title_tr,
    (((COALESCE(v.address, ''::text) || ' '::text) || cl.title_en) || ' '::text) || html_to_text(v.access_en) AS text_en,
    (((COALESCE(v.address, ''::text) || ' '::text) || COALESCE(cl.title_tr, cl.title_en)) || ' '::text) || html_to_text(COALESCE(v.access_tr, v.access_en)) AS text_tr,
    '/venues/'::text || v.slug AS href,
    v.published_at,
    v.content_updated_at
   FROM venues v
     JOIN clusters cl ON cl.id = v.cluster_id
  WHERE v.status = 'published'::publish_status
UNION ALL
 SELECT 'camera_map'::text AS kind,
    cp.id,
    (((v.title_en || ' · '::text) || sp.title_en) || ' · '::text) || cp.title_en AS title_en,
    (((COALESCE(v.title_tr, v.title_en) || ' · '::text) || COALESCE(sp.title_tr, sp.title_en)) || ' · '::text) || COALESCE(cp.title_tr, cp.title_en) AS title_tr,
    sp.title_en AS text_en,
    COALESCE(sp.title_tr, sp.title_en) AS text_tr,
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
    (sp.title_en || ' – '::text) || COALESCE(ss.phase_en, ''::text) AS title_en,
    (COALESCE(sp.title_tr, sp.title_en) || ' – '::text) || COALESCE(ss.phase_tr, ss.phase_en, ''::text) AS title_tr,
    (((((COALESCE(ss.discipline_en, ''::text) || ' '::text) || COALESCE(ss.medal_events_en, ''::text)) || ' '::text) || v.title_en) || ' '::text) || ss.code AS text_en,
    (((((COALESCE(ss.discipline_tr, ss.discipline_en, ''::text) || ' '::text) || COALESCE(ss.medal_events_tr, ss.medal_events_en, ''::text)) || ' '::text) || COALESCE(v.title_tr, v.title_en)) || ' '::text) || ss.code AS text_tr,
    '/schedule?session='::text || ss.id AS href,
    ss.published_at,
    ss.content_updated_at
   FROM schedule_sessions ss
     JOIN sports sp ON sp.id = ss.sport_id
     JOIN venues v ON v.id = ss.venue_id
  WHERE ss.status = 'published'::publish_status;
