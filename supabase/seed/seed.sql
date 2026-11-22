-- Example content for testing. Everything here is placeholder data marked [EXEMPLO].
-- Demo accounts are created by supabase/seed/demo-accounts.local.sql (kept out of git
-- because the repository is public).

insert into public.settings (key, value) values
  ('opening_ceremony', jsonb_build_object(
     'at', '2027-06-25T20:00:00+03:00',
     'label_en', 'Opening Ceremony [EXEMPLO]',
     'label_tr', 'Açılış Töreni [EXEMPLO]'))
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.announcements (title_en, title_tr, body_en, body_tr, priority, visibility, status, published_at) values
  ('[EXEMPLO] Unilateral booking window closes soon',
   '[EXEMPLO] Tek taraflı rezervasyon dönemi yakında kapanıyor',
   'This is an example urgent announcement. Requests for unilateral services must be submitted before the deadline shown on the dashboard.',
   'Bu örnek bir acil duyurudur. Tek taraflı hizmet talepleri, panoda gösterilen son tarihten önce gönderilmelidir.',
   'urgent', 'all', 'published', now() - interval '1 day'),
  ('[EXEMPLO] Welcome to the Right Holders Portal',
   '[EXEMPLO] Yayın Hakkı Sahipleri Portalına hoş geldiniz',
   'This portal gathers everything you need to prepare your coverage of the Games. More sections will be published over the coming weeks.',
   'Bu portal, Oyunların yayınına hazırlanmak için ihtiyacınız olan her şeyi bir araya getirir. Önümüzdeki haftalarda yeni bölümler yayınlanacaktır.',
   'normal', 'all', 'published', now() - interval '3 days'),
  ('[EXEMPLO] Partner coordination meeting',
   '[EXEMPLO] Ortak koordinasyon toplantısı',
   'Example of an announcement visible to partners only (EOC, Organising Committee, EBU).',
   'Yalnızca ortakların (EOC, Organizasyon Komitesi, EBU) görebildiği örnek duyuru.',
   'normal', 'partners', 'published', now() - interval '2 days');

insert into public.deadlines (title_en, title_tr, due_at, visibility) values
  ('[EXEMPLO] Unilateral services request deadline', '[EXEMPLO] Tek taraflı hizmet talebi son tarihi', '2027-03-31T23:59:00+03:00', 'all'),
  ('[EXEMPLO] Commentary positions allocation', '[EXEMPLO] Yorumcu pozisyonları tahsisi', '2027-04-30T23:59:00+03:00', 'all'),
  ('[EXEMPLO] Partner technical review', '[EXEMPLO] Ortak teknik incelemesi', '2027-02-15T12:00:00+03:00', 'partners');

-- Bell notifications for the admin about the two seeded pending registrations
insert into public.notifications (user_id, kind, title_en, title_tr, link)
select a.id, 'registration_pending',
       'New registration pending: ' || p.first_name || ' ' || p.last_name,
       'Onay bekleyen yeni kayıt: ' || p.first_name || ' ' || p.last_name,
       '/admin/users?status=pending'
  from public.profiles a cross join public.profiles p
 where a.role = 'admin' and p.status = 'pending';
