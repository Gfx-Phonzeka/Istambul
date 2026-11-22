-- Stage 4 example data: clusters, sports, venues, camera maps. Everything marked [EXEMPLO] is a placeholder.
-- Drawings, photos and documents were uploaded to the buckets under seed/.

insert into public.clusters (slug, position, title_en, title_tr, status, published_at, content_updated_at) values
  ('europe-north', 1, 'Europe North', 'Avrupa Kuzey', 'published', now(), now()),
  ('europe-south', 2, 'Europe South', 'Avrupa Güney', 'published', now(), now()),
  ('anatolian', 3, 'Anatolian', 'Anadolu', 'published', now(), now());

insert into public.sports (slug, position, title_en, title_tr, field_shape, status, published_at, content_updated_at) values
  ('athletics', 1, 'Athletics [EXEMPLO]', 'Atletizm [EXEMPLO]', 'track', 'published', now(), now()),
  ('swimming', 2, 'Swimming [EXEMPLO]', 'Yüzme [EXEMPLO]', 'pool', 'published', now(), now()),
  ('boxing', 3, 'Boxing [EXEMPLO]', 'Boks [EXEMPLO]', 'ring', 'published', now(), now()),
  ('judo', 4, 'Judo [EXEMPLO]', 'Judo [EXEMPLO]', 'mat', 'published', now(), now()),
  ('basketball-3x3', 5, 'Basketball 3x3 [EXEMPLO]', '3x3 Basketbol [EXEMPLO]', 'court', 'published', now(), now()),
  ('beach-volleyball', 6, 'Beach volleyball [EXEMPLO]', 'Plaj voleybolu [EXEMPLO]', 'court', 'published', now(), now()),
  ('table-tennis', 7, 'Table tennis [EXEMPLO]', 'Masa tenisi [EXEMPLO]', 'court', 'published', now(), now()),
  ('fencing', 8, 'Fencing [EXEMPLO]', 'Eskrim [EXEMPLO]', 'piste', 'published', now(), now());

insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'olympic-stadium', id, '[EXEMPLO] Olympic Stadium', '[EXEMPLO] Olimpiyat Stadyumu', 'Example address 1, Istanbul', '1', 70000, 30, 28, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'europe-north';
insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'aquatics-centre', id, '[EXEMPLO] Aquatics Centre', '[EXEMPLO] Su Sporları Merkezi', 'Example address 2, Istanbul', '1', 8000, 40, 42, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'europe-north';
insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'sports-arena', id, '[EXEMPLO] Sports Arena', '[EXEMPLO] Spor Arenası', 'Example address 3, Istanbul', '2', 12000, 22, 72, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'europe-south';
insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'exhibition-halls', id, '[EXEMPLO] Exhibition Halls', '[EXEMPLO] Fuar Salonları', 'Example address 4, Istanbul', '2', 5000, 36, 82, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'europe-south';
insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'coastal-park', id, '[EXEMPLO] Coastal Park', '[EXEMPLO] Sahil Parkı', 'Example address 5, Istanbul', '3', 4000, 72, 62, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'anatolian';
insert into public.venues (slug, cluster_id, title_en, title_tr, address, production_level, capacity, map_x, map_y,
  commentary_en, commentary_tr, unilaterals_en, unilaterals_tr, access_en, access_tr, contacts_en, contacts_tr, status, published_at, content_updated_at)
select 'anatolian-hall', id, '[EXEMPLO] Anatolian Hall', '[EXEMPLO] Anadolu Salonu', 'Example address 6, Istanbul', '3', 3000, 82, 40, '<p>[EXEMPLO] 40 commentary positions on the main stand, each with 3 seats, monitor and CIS.</p>', '<p>[EXEMPLO] Ana tribünde her biri 3 koltuk, monitör ve CIS içeren 40 yorumcu pozisyonu.</p>', '<p>[EXEMPLO] Unilateral camera platforms and flash interview positions available on request.</p>', '<p>[EXEMPLO] Talep üzerine tek taraflı kamera platformları ve flaş röportaj pozisyonları.</p>', '<p>[EXEMPLO] Broadcast entrance via Gate B. OB van compound next to the north car park, with power and fibre.</p>', '<p>[EXEMPLO] Yayın girişi B Kapısından. Yayın araçları alanı kuzey otoparkının yanında, elektrik ve fiber mevcut.</p>', '<p>[EXEMPLO] Venue Broadcast Manager: vbm@example.com · +90 212 000 0000</p>', '<p>[EXEMPLO] Mekân Yayın Müdürü: vbm@example.com · +90 212 000 0000</p>', 'published', now(), now()
  from public.clusters where slug = 'anatolian';

insert into public.venue_sports (venue_id, sport_id, start_date, end_date, status, published_at, content_updated_at)
select v.id, s.id, x.sd::date, x.ed::date, 'published', now(), now() from (values
  ('olympic-stadium', 'athletics', '2027-06-27', '2027-07-03'),
  ('aquatics-centre', 'swimming', '2027-06-26', '2027-07-01'),
  ('sports-arena', 'boxing', '2027-06-26', '2027-07-04'),
  ('sports-arena', 'basketball-3x3', '2027-06-27', '2027-06-30'),
  ('exhibition-halls', 'judo', '2027-06-28', '2027-07-01'),
  ('exhibition-halls', 'fencing', '2027-07-01', '2027-07-04'),
  ('coastal-park', 'beach-volleyball', '2027-06-26', '2027-07-03'),
  ('anatolian-hall', 'table-tennis', '2027-06-27', '2027-07-02')
) as x(v, s, sd, ed) join public.venues v on v.slug = x.v join public.sports s on s.slug = x.s;

insert into public.venue_files (venue_id, kind, position, title_en, title_tr, file_path, file_name, file_size, mime)
select id, 'photo', 1, '[EXEMPLO] Main view', '[EXEMPLO] Genel görünüm', 'seed/stadium.jpg', 'stadium.jpg', null, 'image/jpeg' from public.venues where slug = 'olympic-stadium'
union all select id, 'document', 1, '[EXEMPLO] Venue access plan', '[EXEMPLO] Mekân erişim planı', 'seed/stadium-access.pdf', 'stadium-access-plan.pdf', 471992, 'application/pdf' from public.venues where slug = 'olympic-stadium'
union all select id, 'photo', 1, '[EXEMPLO] Main view', '[EXEMPLO] Genel görünüm', 'seed/aquatics.jpg', 'aquatics.jpg', null, 'image/jpeg' from public.venues where slug = 'aquatics-centre';

with p as (
  insert into public.camera_plans (venue_id, sport_id, title_en, title_tr, status, published_at, content_updated_at)
  select v.id, s.id, '[EXEMPLO] Finals', '[EXEMPLO] Finaller', 'published', now(), now() from public.venues v, public.sports s where v.slug = 'olympic-stadium' and s.slug = 'athletics'
  returning id
), c as (
  insert into public.cameras (plan_id, position, number, type, lens, function_en, function_tr, level, is_special, x, y, angle)
  select p.id, x.n, x.n::text, x.t, x.l, x.fe, x.ft, x.lv, x.sp, x.x, x.y, x.a from p, (values
  (1, 'hard', '[EXEMPLO] 86x', 'Main wide', 'Ana geniş plan', '1', false, 0.5, 0.82, 270),
  (2, 'hard', '[EXEMPLO] 86x', 'Tight', 'Yakın plan', '1', false, 0.42, 0.82, 270),
  (3, 'hard', '[EXEMPLO] 86x', 'Finish line', 'Bitiş çizgisi', '1', false, 0.58, 0.82, 270),
  (4, 'hard', '[EXEMPLO] 22x', 'Reverse 100 m', '100 m ters açı', '1', false, 0.12, 0.5, 0),
  (5, 'hard', '[EXEMPLO] 22x', 'Field events', 'Saha yarışmaları', '1', false, 0.88, 0.5, 180),
  (6, 'crane', '[EXEMPLO] 22x', 'Crane – stadium overview', 'Vinç – stadyum genel', '2', true, 0.5, 0.12, 90),
  (7, 'rf', '[EXEMPLO] 22x', 'Steadicam – field', 'Steadicam – saha', '2', false, 0.3, 0.2, null),
  (8, 'rf', '[EXEMPLO] 22x', 'RF – athletes'' entrance', 'RF – sporcu girişi', '2', false, 0.7, 0.2, null),
  (9, 'rail', '[EXEMPLO] 22x', 'Rail – 100 m straight', 'Ray – 100 m düzlüğü', '2', true, 0.5, 0.6, 270),
  (10, 'handheld', '[EXEMPLO] 22x', 'Mixed zone', 'Karma bölge', '3', false, 0.25, 0.75, 0),
  (11, 'handheld', '[EXEMPLO] 22x', 'Podium', 'Kürsü', '3', false, 0.75, 0.75, null),
  (12, 'aerial', '[EXEMPLO] 22x', 'Cablecam – overhead', 'Tel kamera – üstten', '3', true, 0.5, 0.35, 90)
  ) as x(n, t, l, fe, ft, lv, sp, x, y, a)
  returning plan_id
)
insert into public.camera_drawings (plan_id, version_number, file_path, file_name, file_size, numbering_checked)
select id, 1, 'seed/stadium-athletics-v1.pdf', 'stadium-athletics-v1.pdf', 470000, true from p;

with p as (
  insert into public.camera_plans (venue_id, sport_id, title_en, title_tr, status, published_at, content_updated_at)
  select v.id, s.id, '[EXEMPLO] All sessions', '[EXEMPLO] Tüm seanslar', 'published', now(), now() from public.venues v, public.sports s where v.slug = 'aquatics-centre' and s.slug = 'swimming'
  returning id
), c as (
  insert into public.cameras (plan_id, position, number, type, lens, function_en, function_tr, level, is_special, x, y, angle)
  select p.id, x.n, x.n::text, x.t, x.l, x.fe, x.ft, x.lv, x.sp, x.x, x.y, x.a from p, (values
  (1, 'hard', '[EXEMPLO] 86x', 'Main wide', 'Ana geniş plan', '1', false, 0.5, 0.85, 270),
  (2, 'hard', '[EXEMPLO] 86x', 'Tight', 'Yakın plan', '1', false, 0.38, 0.85, 270),
  (3, 'hard', '[EXEMPLO] 86x', 'Reverse', 'Ters açı', '1', false, 0.62, 0.85, 270),
  (4, 'hard', '[EXEMPLO] 22x', 'Start blocks', 'Çıkış blokları', '1', false, 0.12, 0.5, 0),
  (5, 'hard', '[EXEMPLO] 22x', 'Turn end', 'Dönüş duvarı', '1', false, 0.88, 0.5, 180),
  (6, 'crane', '[EXEMPLO] 22x', 'Crane – pool overview', 'Vinç – havuz genel', '2', true, 0.5, 0.15, 90),
  (7, 'polecam', '[EXEMPLO] 22x', 'Polecam – start', 'Polecam – çıkış', '2', true, 0.3, 0.5, null),
  (8, 'polecam', '[EXEMPLO] 22x', 'Polecam – finish', 'Polecam – bitiş', '2', true, 0.7, 0.5, null),
  (9, 'underwater', '[EXEMPLO] 22x', 'Underwater – lane 4', 'Su altı – 4. kulvar', '2', true, 0.5, 0.5, 270),
  (10, 'rail', '[EXEMPLO] 22x', 'Rail – side', 'Ray – yan', '3', true, 0.2, 0.2, 0),
  (11, 'handheld', '[EXEMPLO] 22x', 'Pool deck', 'Havuz kenarı', '3', false, 0.8, 0.2, null),
  (12, 'beauty', '[EXEMPLO] 22x', 'Beauty – city', 'Şehir manzarası', '3', true, 0.5, 0.68, 90)
  ) as x(n, t, l, fe, ft, lv, sp, x, y, a)
  returning plan_id
)
insert into public.camera_drawings (plan_id, version_number, file_path, file_name, file_size, numbering_checked)
select id, 1, 'seed/aquatics-swimming-v1.pdf', 'aquatics-swimming-v1.pdf', 470000, true from p;

