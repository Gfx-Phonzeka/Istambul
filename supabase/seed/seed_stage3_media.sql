-- Stage 3 example media. Files were uploaded to the buckets under the "seed/" folder.
insert into public.briefing_videos (category, position, title_en, title_tr, description_en, description_tr, recorded_on, duration_seconds,
  video_path, video_mime, poster_path, subtitles_en_path, subtitles_tr_path, status, published_at, content_updated_at) values
 ('welcome', 1, '[EXEMPLO] Welcome to the Games broadcast', '[EXEMPLO] Oyunlar yayınına hoş geldiniz',
  'Example briefing video with English and Turkish subtitles.', 'İngilizce ve Türkçe altyazılı örnek bilgilendirme videosu.',
  '2026-11-15', 24, 'seed/welcome/video.mp4', 'video/mp4', 'seed/welcome/poster.jpg', 'seed/welcome/subtitles.en.vtt', 'seed/welcome/subtitles.tr.vtt',
  'published', now(), now()),
 ('ibc', 1, '[EXEMPLO] The International Broadcast Centre', '[EXEMPLO] Uluslararası Yayın Merkezi',
  'Example presentation of the IBC.', 'IBC''nin örnek tanıtımı.',
  '2026-11-18', 20, 'seed/ibc/video.mp4', 'video/mp4', 'seed/ibc/poster.jpg', 'seed/ibc/subtitles.en.vtt', 'seed/ibc/subtitles.tr.vtt',
  'published', now(), now());

with a as (insert into public.media_assets (category, subtype, position, title_en, title_tr, description_en, description_tr, preview_path, preview_kind, status, published_at, content_updated_at)
  values ('graphics', 'Logo', 1, '[EXEMPLO] Games logo (PNG)', '[EXEMPLO] Oyunlar logosu (PNG)', 'Example transparent logo for on-screen use.', 'Ekranda kullanım için örnek şeffaf logo.',
          'seed/logo.jpg', 'image', 'published', now() - interval '20 days', now() - interval '20 days') returning id)
insert into public.media_versions (asset_id, version_number, file_path, file_name, file_size, mime, format, resolution)
select id, 1, 'seed/logo/v1/IST27-logo-EXEMPLO.png', 'IST27-logo-EXEMPLO.png', 18133, 'image/png', 'PNG · alpha', '1200×600' from a;

with a as (insert into public.media_assets (category, position, title_en, title_tr, description_en, description_tr, preview_path, preview_kind, status, published_at, content_updated_at)
  values ('bumpers', 1, '[EXEMPLO] Bumper A', '[EXEMPLO] Bumper A', 'Example bumper. Broadcast versions will be provided in high quality.', 'Örnek bumper. Yayın sürümleri yüksek kalitede sağlanacaktır.',
          'seed/bumper-a.mp4', 'video', 'published', now(), now()) returning id)
insert into public.media_versions (asset_id, version_number, file_path, file_name, file_size, mime, format, codec, resolution, frame_rate, duration_seconds)
select id, 1, 'seed/bumper-a/v1/Bumper-A-EXEMPLO.mp4', 'Bumper-A-EXEMPLO.mp4', 75440, 'video/mp4', 'MP4', 'H.264 / AAC', '1280×720', '25 fps', 6 from a;

with a as (insert into public.media_assets (category, position, title_en, title_tr, description_en, description_tr, preview_path, preview_kind, status, published_at, content_updated_at)
  values ('curtains', 1, '[EXEMPLO] Sport curtain', '[EXEMPLO] Spor perdesi', 'Example curtain for transitions.', 'Geçişler için örnek perde.',
          'seed/curtain-a.jpg', 'image', 'published', now() - interval '30 days', now() - interval '2 days') returning id)
insert into public.media_versions (asset_id, version_number, file_path, file_name, file_size, mime, format, codec, resolution, frame_rate, duration_seconds)
select id, 1, 'seed/curtain-a/v1/Curtain-Sport-EXEMPLO.mp4', 'Curtain-Sport-EXEMPLO.mp4', 99060, 'video/mp4', 'MP4', 'H.264 / AAC', '1280×720', '25 fps', 8 from a;

with a as (insert into public.media_assets (category, subtype, position, title_en, title_tr, description_en, description_tr, preview_path, preview_kind, status, published_at, content_updated_at)
  values ('music', 'Stinger', 1, '[EXEMPLO] Stinger A', '[EXEMPLO] Stinger A', 'Example audio stinger.', 'Örnek ses stinger''ı.',
          'seed/stinger-a.jpg', 'image', 'published', now() - interval '40 days', now() - interval '40 days') returning id)
insert into public.media_versions (asset_id, version_number, file_path, file_name, file_size, mime, format, codec, duration_seconds)
select id, 1, 'seed/stinger-a/v1/Stinger-A-EXEMPLO.mp3', 'Stinger-A-EXEMPLO.mp3', 65245, 'audio/mpeg', 'MP3', 'MP3 128 kbps', 4 from a;
