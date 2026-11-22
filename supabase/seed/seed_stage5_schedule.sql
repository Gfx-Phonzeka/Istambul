-- Stage 5 example data ([EXEMPLO]): sessions on 3 days, broadcast feeds, EBU channels, technical parameters.
-- Times are Istanbul time (+03:00).
insert into public.schedule_sessions (code, sport_id, venue_id, discipline_en, discipline_tr, phase_en, phase_tr, start_at, end_at,
  is_medal, medal_events_en, medal_events_tr, is_oq)
select x.code, s.id, v.id, x.d_en, x.d_tr, x.p_en, x.p_tr, (x.day || ' ' || x.st || ':00+03')::timestamptz, (x.day || ' ' || x.et || ':00+03')::timestamptz,
       x.medal, x.m_en, x.m_tr, x.oq
from (values
  ('ATH-0627-M', 'athletics', 'olympic-stadium', '2027-06-27', '10:00', '13:00', 'Track & field', 'Atletizm', '[EXEMPLO] Morning session – heats', '[EXEMPLO] Sabah seansı – elemeler', false, null, null, true),
  ('ATH-0627-E', 'athletics', 'olympic-stadium', '2027-06-27', '18:00', '21:30', 'Track & field', 'Atletizm', '[EXEMPLO] Evening session – finals', '[EXEMPLO] Akşam seansı – finaller', true, '[EXEMPLO] 100 m men, 100 m women', '[EXEMPLO] 100 m erkekler, 100 m kadınlar', true),
  ('ATH-0628-E', 'athletics', 'olympic-stadium', '2027-06-28', '18:00', '21:00', 'Track & field', 'Atletizm', '[EXEMPLO] Evening session – finals', '[EXEMPLO] Akşam seansı – finaller', true, '[EXEMPLO] Long jump women', '[EXEMPLO] Uzun atlama kadınlar', true),
  ('ATH-0629-E', 'athletics', 'olympic-stadium', '2027-06-29', '18:00', '21:00', 'Track & field', 'Atletizm', '[EXEMPLO] Evening session – finals', '[EXEMPLO] Akşam seansı – finaller', true, '[EXEMPLO] 400 m men', '[EXEMPLO] 400 m erkekler', false),
  ('SWM-0627-H', 'swimming', 'aquatics-centre', '2027-06-27', '09:30', '12:00', 'Swimming', 'Yüzme', '[EXEMPLO] Heats', '[EXEMPLO] Elemeler', false, null, null, false),
  ('SWM-0627-F', 'swimming', 'aquatics-centre', '2027-06-27', '18:30', '20:30', 'Swimming', 'Yüzme', '[EXEMPLO] Finals', '[EXEMPLO] Finaller', true, '[EXEMPLO] 200 m freestyle men', '[EXEMPLO] 200 m serbest erkekler', false),
  ('SWM-0628-H', 'swimming', 'aquatics-centre', '2027-06-28', '09:30', '12:00', 'Swimming', 'Yüzme', '[EXEMPLO] Heats', '[EXEMPLO] Elemeler', false, null, null, false),
  ('SWM-0628-F', 'swimming', 'aquatics-centre', '2027-06-28', '18:30', '20:30', 'Swimming', 'Yüzme', '[EXEMPLO] Finals', '[EXEMPLO] Finaller', true, '[EXEMPLO] 100 m butterfly women', '[EXEMPLO] 100 m kelebek kadınlar', false),
  ('BOX-0627-1', 'boxing', 'sports-arena', '2027-06-27', '12:00', '15:00', 'Boxing', 'Boks', '[EXEMPLO] Preliminaries', '[EXEMPLO] Ön elemeler', false, null, null, true),
  ('BOX-0628-1', 'boxing', 'sports-arena', '2027-06-28', '12:00', '15:00', 'Boxing', 'Boks', '[EXEMPLO] Quarterfinals', '[EXEMPLO] Çeyrek finaller', false, null, null, true),
  ('BOX-0629-F', 'boxing', 'sports-arena', '2027-06-29', '19:00', '22:00', 'Boxing', 'Boks', '[EXEMPLO] Finals', '[EXEMPLO] Finaller', true, '[EXEMPLO] -57 kg women, -71 kg men', '[EXEMPLO] -57 kg kadınlar, -71 kg erkekler', true),
  ('B3X-0627-1', 'basketball-3x3', 'sports-arena', '2027-06-27', '17:00', '21:00', '3x3', '3x3', '[EXEMPLO] Pool round', '[EXEMPLO] Grup turu', false, null, null, false),
  ('B3X-0629-F', 'basketball-3x3', 'sports-arena', '2027-06-29', '15:00', '18:00', '3x3', '3x3', '[EXEMPLO] Finals', '[EXEMPLO] Finaller', true, '[EXEMPLO] Men, women', '[EXEMPLO] Erkekler, kadınlar', false),
  ('JUD-0628-P', 'judo', 'exhibition-halls', '2027-06-28', '10:00', '14:00', 'Judo', 'Judo', '[EXEMPLO] Preliminaries', '[EXEMPLO] Ön elemeler', false, null, null, false),
  ('JUD-0628-F', 'judo', 'exhibition-halls', '2027-06-28', '17:00', '19:30', 'Judo', 'Judo', '[EXEMPLO] Final block', '[EXEMPLO] Final bloğu', true, '[EXEMPLO] -60 kg men, -48 kg women', '[EXEMPLO] -60 kg erkekler, -48 kg kadınlar', false),
  ('JUD-0629-F', 'judo', 'exhibition-halls', '2027-06-29', '17:00', '19:30', 'Judo', 'Judo', '[EXEMPLO] Final block', '[EXEMPLO] Final bloğu', true, '[EXEMPLO] -73 kg men, -57 kg women', '[EXEMPLO] -73 kg erkekler, -57 kg kadınlar', false),
  ('BVB-0627-1', 'beach-volleyball', 'coastal-park', '2027-06-27', '10:00', '18:00', 'Beach volleyball', 'Plaj voleybolu', '[EXEMPLO] Pool play', '[EXEMPLO] Grup maçları', false, null, null, false),
  ('BVB-0628-1', 'beach-volleyball', 'coastal-park', '2027-06-28', '10:00', '18:00', 'Beach volleyball', 'Plaj voleybolu', '[EXEMPLO] Round of 16', '[EXEMPLO] Son 16', false, null, null, false),
  ('BVB-0629-F', 'beach-volleyball', 'coastal-park', '2027-06-29', '16:00', '20:00', 'Beach volleyball', 'Plaj voleybolu', '[EXEMPLO] Medal matches', '[EXEMPLO] Madalya maçları', true, '[EXEMPLO] Women', '[EXEMPLO] Kadınlar', true),
  ('TTE-0627-1', 'table-tennis', 'anatolian-hall', '2027-06-27', '10:00', '14:00', 'Table tennis', 'Masa tenisi', '[EXEMPLO] Singles – round 1', '[EXEMPLO] Tekler – 1. tur', false, null, null, true),
  ('TTE-0628-1', 'table-tennis', 'anatolian-hall', '2027-06-28', '10:00', '14:00', 'Table tennis', 'Masa tenisi', '[EXEMPLO] Singles – round 2', '[EXEMPLO] Tekler – 2. tur', false, null, null, true),
  ('TTE-0629-F', 'table-tennis', 'anatolian-hall', '2027-06-29', '17:00', '20:00', 'Table tennis', 'Masa tenisi', '[EXEMPLO] Singles – finals', '[EXEMPLO] Tekler – finaller', true, '[EXEMPLO] Men''s singles', '[EXEMPLO] Erkekler tekler', true),
  ('FEN-0627-1', 'fencing', 'exhibition-halls', '2027-06-27', '09:00', '13:00', 'Fencing', 'Eskrim', '[EXEMPLO] Épée – table of 64', '[EXEMPLO] Epe – son 64', false, null, null, false),
  ('FEN-0627-F', 'fencing', 'exhibition-halls', '2027-06-27', '18:00', '20:00', 'Fencing', 'Eskrim', '[EXEMPLO] Épée – finals', '[EXEMPLO] Epe – finaller', true, '[EXEMPLO] Épée individual men', '[EXEMPLO] Bireysel epe erkekler', false)
) as x(code, sport, venue, day, st, et, d_en, d_tr, p_en, p_tr, medal, m_en, m_tr, oq)
join public.sports s on s.slug = x.sport join public.venues v on v.slug = x.venue;

-- Multilateral feed for every session, on the venue's channel; plus ISO feeds, daily highlights and the opening ceremony.
insert into public.broadcast_feeds (code, feed_type, title_en, title_tr, venue_id, sport_id, start_at, end_at, channel)
select 'MUL-' || ss.code, 'multilateral', '[EXEMPLO] ' || sp.title_en || ' – ' || coalesce(ss.phase_en, ''), '[EXEMPLO] ' || sp.title_tr || ' – ' || coalesce(ss.phase_tr, ''),
       ss.venue_id, ss.sport_id, ss.start_at - interval '15 minutes', ss.end_at + interval '10 minutes',
       case v.slug when 'olympic-stadium' then '[EXEMPLO] EBU SAT-1' when 'aquatics-centre' then '[EXEMPLO] EBU SAT-2'
                   when 'sports-arena' then '[EXEMPLO] EBU FIBRE-3' when 'exhibition-halls' then '[EXEMPLO] EBU FIBRE-4'
                   else '[EXEMPLO] EBU STREAM-5' end
  from public.schedule_sessions ss join public.sports sp on sp.id = ss.sport_id join public.venues v on v.id = ss.venue_id;

insert into public.broadcast_feeds (code, feed_type, title_en, title_tr, venue_id, sport_id, start_at, end_at, channel)
select x.code, x.t, x.en, x.tr, v.id, s.id, (x.day || ' ' || x.st || ':00+03')::timestamptz, (x.day || ' ' || x.et || ':00+03')::timestamptz, x.ch
from (values
  ('ISO-ATH-0627', 'iso', '[EXEMPLO] Athletics ISO – finish line camera', '[EXEMPLO] Atletizm ISO – bitiş çizgisi kamerası', 'olympic-stadium', 'athletics', '2027-06-27', '18:00', '21:30', '[EXEMPLO] EBU FIBRE-6'),
  ('ISO-SWM-0627', 'iso', '[EXEMPLO] Swimming ISO – underwater camera', '[EXEMPLO] Yüzme ISO – su altı kamerası', 'aquatics-centre', 'swimming', '2027-06-27', '18:30', '20:30', '[EXEMPLO] EBU FIBRE-7'),
  ('CER-OPEN', 'ceremony', '[EXEMPLO] Opening Ceremony', '[EXEMPLO] Açılış Töreni', 'olympic-stadium', null, '2027-06-25', '20:00', '23:00', '[EXEMPLO] EBU SAT-1'),
  ('HL-0627-1', 'highlights', '[EXEMPLO] Daily highlights 1 (30 min)', '[EXEMPLO] Günlük özetler 1 (30 dk)', null, null, '2027-06-27', '15:00', '15:30', '[EXEMPLO] EBU SAT-2'),
  ('HL-0627-2', 'highlights', '[EXEMPLO] Daily highlights 2 (30 min)', '[EXEMPLO] Günlük özetler 2 (30 dk)', null, null, '2027-06-27', '23:30', '23:59', '[EXEMPLO] EBU SAT-2'),
  ('HL-0628-1', 'highlights', '[EXEMPLO] Daily highlights 1 (30 min)', '[EXEMPLO] Günlük özetler 1 (30 dk)', null, null, '2027-06-28', '15:00', '15:30', '[EXEMPLO] EBU SAT-2'),
  ('HL-0628-2', 'highlights', '[EXEMPLO] Daily highlights 2 (30 min)', '[EXEMPLO] Günlük özetler 2 (30 dk)', null, null, '2027-06-28', '23:30', '23:59', '[EXEMPLO] EBU SAT-2'),
  ('HL-0629-1', 'highlights', '[EXEMPLO] Daily highlights 1 (30 min)', '[EXEMPLO] Günlük özetler 1 (30 dk)', null, null, '2027-06-29', '15:00', '15:30', '[EXEMPLO] EBU SAT-2'),
  ('HL-0629-2', 'highlights', '[EXEMPLO] Daily highlights 2 (30 min)', '[EXEMPLO] Günlük özetler 2 (30 dk)', null, null, '2027-06-29', '23:30', '23:59', '[EXEMPLO] EBU SAT-2')
) as x(code, t, en, tr, venue, sport, day, st, et, ch)
left join public.venues v on v.slug = x.venue left join public.sports s on s.slug = x.sport;

insert into public.distribution_channels (kind, position, title_en, title_tr, body_en, body_tr, contact_en, contact_tr, status, published_at, content_updated_at) values
 ('satellite', 1, '[EXEMPLO] Satellite', '[EXEMPLO] Uydu',
  '<p>[EXEMPLO] The EBU distributes the multilateral feeds by satellite. Right Holders receive the feeds with a professional receiver and the decryption details provided by the EBU.</p>',
  '<p>[EXEMPLO] EBU çok taraflı yayın akışlarını uydu ile dağıtır. Yayın Hakkı Sahipleri yayınları profesyonel bir alıcı ve EBU tarafından sağlanan şifre çözme bilgileriyle alır.</p>',
  '<p>[EXEMPLO] EBU booking office · booking@example.com</p>', '<p>[EXEMPLO] EBU rezervasyon ofisi · booking@example.com</p>', 'published', now(), now()),
 ('fibre', 2, '[EXEMPLO] Fibre', '[EXEMPLO] Fiber',
  '<p>[EXEMPLO] Feeds are also available on the EBU fibre network for broadcasters connected to it.</p>',
  '<p>[EXEMPLO] Yayın akışları, EBU fiber ağına bağlı yayıncılar için bu ağ üzerinden de sunulur.</p>',
  '<p>[EXEMPLO] EBU network operations · noc@example.com</p>', '<p>[EXEMPLO] EBU ağ operasyonları · noc@example.com</p>', 'published', now(), now()),
 ('streaming', 3, '[EXEMPLO] Streaming', '[EXEMPLO] İnternet yayını',
  '<p>[EXEMPLO] Secure streams (SRT) can be ordered for broadcasters without satellite or fibre reception.</p>',
  '<p>[EXEMPLO] Uydu veya fiber alımı olmayan yayıncılar için güvenli yayın akışları (SRT) sipariş edilebilir.</p>',
  '<p>[EXEMPLO] EBU streaming support · streaming@example.com</p>', '<p>[EXEMPLO] EBU yayın desteği · streaming@example.com</p>', 'published', now(), now());

insert into public.tech_parameters (grp, position, title_en, title_tr, value_en, value_tr, status, published_at, content_updated_at) values
 ('video', 1, 'Video format', 'Video formatı', '1080i50 [EXEMPLO]', '1080i50 [EXEMPLO]', 'published', now(), now()),
 ('video', 2, 'Aspect ratio', 'En boy oranı', '16:9 [EXEMPLO]', '16:9 [EXEMPLO]', 'published', now(), now()),
 ('video', 3, 'Colour space', 'Renk uzayı', 'BT.709 [EXEMPLO]', 'BT.709 [EXEMPLO]', 'published', now(), now()),
 ('audio', 1, 'Audio channels', 'Ses kanalları', '[EXEMPLO] Ch 1-2 stereo international sound, ch 3-8 example configuration', '[EXEMPLO] Kanal 1-2 stereo uluslararası ses, kanal 3-8 örnek yapılandırma', 'published', now(), now()),
 ('audio', 2, 'Audio level', 'Ses seviyesi', '[EXEMPLO] -23 LUFS (EBU R128)', '[EXEMPLO] -23 LUFS (EBU R128)', 'published', now(), now()),
 ('graphics', 1, 'Graphics', 'Grafikler', '[EXEMPLO] Dirty feed with Games graphics; clean feed on request', '[EXEMPLO] Oyunlar grafikli kirli yayın; talep üzerine temiz yayın', 'published', now(), now()),
 ('timecode', 1, 'Timecode', 'Zaman kodu', '[EXEMPLO] VITC / LTC, Istanbul time of day', '[EXEMPLO] VITC / LTC, Istanbul yerel saati', 'published', now(), now());

insert into public.info_blocks (slug, title_en, title_tr, body_en, body_tr, status, published_at, content_updated_at) values
 ('additional-production', '[EXEMPLO] Additional production on request', '[EXEMPLO] Talep üzerine ek prodüksiyon',
  '<p>[EXEMPLO] Right Holders can request additional production for areas not covered by the multilateral coverage (e.g. warm-up areas, team arrivals, extra cameras). Requests are reviewed by the Host Broadcaster and confirmed depending on availability.</p>',
  '<p>[EXEMPLO] Yayın Hakkı Sahipleri, çok taraflı yayının kapsamadığı alanlar için (örn. ısınma alanları, takım gelişleri, ek kameralar) ek prodüksiyon talep edebilir. Talepler Ev Sahibi Yayıncı tarafından incelenir ve uygunluğa göre onaylanır.</p>',
  'published', now(), now());
