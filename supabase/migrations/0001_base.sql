-- =====================================================================
-- Istanbul 2027 · Right Holders Portal — Stage 1 (Base)
-- Profiles, roles, approval workflow, login lockout, password reset,
-- notifications, activity log, email outbox, settings, announcements,
-- deadlines. Row Level Security on every table.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------- Types ----------
create type public.app_role as enum ('right_holder', 'partner', 'editor', 'admin');
create type public.account_status as enum ('pending', 'approved', 'rejected', 'suspended');
create type public.org_type as enum ('right_holder', 'partner', 'other');
create type public.content_visibility as enum ('all', 'partners', 'internal');
create type public.announcement_priority as enum ('normal', 'urgent');
create type public.publish_status as enum ('draft', 'published');

-- ---------- Private config (never exposed through the API) ----------
create table private.config (
  key text primary key,
  value text not null
);

-- ---------- Profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  organization text not null default '',
  country text not null default '',
  org_type public.org_type not null default 'other',
  job_title text not null default '',
  phone text not null default '',
  role public.app_role,
  status public.account_status not null default 'pending',
  preferred_language text not null default 'en' check (preferred_language in ('en', 'tr')),
  notify_email boolean not null default true,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  review_reason text,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  deletion_requested_at timestamptz,
  last_login_at timestamptz,
  previous_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_status_idx on public.profiles (status);
create unique index profiles_email_idx on public.profiles (lower(email));

-- ---------- Role helpers ----------
create or replace function public.my_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and status = 'approved'
$$;

create or replace function public.is_approved()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and status = 'approved' and role is not null)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() in ('editor', 'admin'), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.can_view(v public.content_visibility)
returns boolean language sql stable security definer set search_path = '' as $$
  select case v
    when 'all' then public.is_approved()
    when 'partners' then coalesce(public.my_role() in ('partner', 'editor', 'admin'), false)
    when 'internal' then public.is_staff()
  end
$$;

-- ---------- Guard: users may only change their own "safe" profile fields ----------
create or replace function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on' then
    return new;
  end if;
  if auth.uid() is null or public.is_admin() then
    -- admins (or the database itself) may change everything except the id
    new.id := old.id;
    return new;
  end if;
  new.id := old.id;
  new.email := old.email;
  new.role := old.role;
  new.status := old.status;
  new.org_type := old.org_type;
  new.review_reason := old.review_reason;
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  new.deletion_requested_at := old.deletion_requested_at;
  new.last_login_at := old.last_login_at;
  new.previous_login_at := old.previous_login_at;
  new.terms_accepted_at := old.terms_accepted_at;
  new.privacy_accepted_at := old.privacy_accepted_at;
  new.created_at := old.created_at;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_update();

-- ---------- Create a profile for every new auth user ----------
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id, email, first_name, last_name, organization, country, org_type,
    job_title, phone, preferred_language, terms_accepted_at, privacy_accepted_at
  ) values (
    new.id, new.email,
    coalesce(m ->> 'first_name', ''), coalesce(m ->> 'last_name', ''),
    coalesce(m ->> 'organization', ''), coalesce(m ->> 'country', ''),
    coalesce(nullif(m ->> 'org_type', ''), 'other')::public.org_type,
    coalesce(m ->> 'job_title', ''), coalesce(m ->> 'phone', ''),
    case when m ->> 'lang' = 'tr' then 'tr' else 'en' end,
    case when (m ->> 'terms_accepted')::boolean then now() end,
    case when (m ->> 'terms_accepted')::boolean then now() end
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------- Activity log ----------
create table public.activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index activity_log_created_idx on public.activity_log (created_at desc);

create or replace function private.log_activity(
  p_action text, p_entity_type text default null, p_entity_id text default null,
  p_details jsonb default '{}'::jsonb, p_actor uuid default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_actor uuid := coalesce(p_actor, auth.uid());
begin
  insert into public.activity_log (actor_id, actor_email, action, entity_type, entity_id, details)
  values (v_actor, (select email from public.profiles where id = v_actor),
          p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
end $$;

-- ---------- Notifications (bell) ----------
create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title_en text not null,
  title_tr text,
  body_en text,
  body_tr text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- ---------- Email outbox ----------
create table public.email_outbox (
  id bigint generated always as identity primary key,
  to_email text not null,
  lang text not null default 'en',
  template text not null,
  subject text not null,
  body_text text not null,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed', 'not_configured')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index email_outbox_status_idx on public.email_outbox (status, created_at);

create or replace function private.site_url()
returns text language sql stable security definer set search_path = '' as $$
  select coalesce((select value from private.config where key = 'site_url'), 'http://localhost:3000')
$$;

-- Builds a bilingual email from a template and queues it.
create or replace function private.queue_email(p_to text, p_lang text, p_template text, p_vars jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  tr boolean := (p_lang = 'tr');
  s text; b text;
  site text := private.site_url();
  name text := coalesce(p_vars ->> 'name', '');
begin
  if p_template = 'account_approved' then
    s := case when tr then 'Istanbul 2027 portal hesabınız onaylandı'
              else 'Your Istanbul 2027 portal account has been approved' end;
    b := case when tr then
      'Merhaba ' || name || E',\n\nIstanbul 2027 Yayın Hakkı Sahipleri Portalı erişim talebiniz onaylandı.\nGiriş yapmak için: ' || site || E'/login\n\nMedialuso – Host Broadcaster'
    else
      'Hello ' || name || E',\n\nYour request to access the Istanbul 2027 Right Holders Portal has been approved.\nSign in here: ' || site || E'/login\n\nMedialuso – Host Broadcaster' end;
  elsif p_template = 'account_rejected' then
    s := case when tr then 'Istanbul 2027 portal erişim talebiniz'
              else 'Your Istanbul 2027 portal access request' end;
    b := case when tr then
      'Merhaba ' || name || E',\n\nÜzgünüz, Istanbul 2027 Yayın Hakkı Sahipleri Portalı erişim talebiniz onaylanmadı.'
      || case when coalesce(p_vars ->> 'reason', '') <> '' then E'\nGerekçe: ' || (p_vars ->> 'reason') else '' end
      || E'\n\nSorularınız için bizimle iletişime geçebilirsiniz.\n\nMedialuso – Host Broadcaster'
    else
      'Hello ' || name || E',\n\nUnfortunately your request to access the Istanbul 2027 Right Holders Portal was not approved.'
      || case when coalesce(p_vars ->> 'reason', '') <> '' then E'\nReason: ' || (p_vars ->> 'reason') else '' end
      || E'\n\nPlease contact us if you have any questions.\n\nMedialuso – Host Broadcaster' end;
  elsif p_template = 'admin_new_registration' then
    s := case when tr then 'Yeni kayıt onay bekliyor: ' else 'New registration pending approval: ' end || name;
    b := case when tr then
      E'Portalda yeni bir kayıt onay bekliyor.\n\nAd: ' || name || E'\nKuruluş: ' || coalesce(p_vars ->> 'organization', '')
      || E'\nE-posta: ' || coalesce(p_vars ->> 'email', '') || E'\n\nİncelemek için: ' || site || '/admin/users?status=pending'
    else
      E'A new registration is waiting for approval.\n\nName: ' || name || E'\nOrganisation: ' || coalesce(p_vars ->> 'organization', '')
      || E'\nEmail: ' || coalesce(p_vars ->> 'email', '') || E'\n\nReview it here: ' || site || '/admin/users?status=pending' end;
  elsif p_template = 'password_reset' then
    s := case when tr then 'Istanbul 2027 portal – şifre sıfırlama' else 'Istanbul 2027 portal – password reset' end;
    b := case when tr then
      E'Şifre sıfırlama talebi aldık. Yeni bir şifre belirlemek için bu bağlantıyı açın (1 saat geçerlidir):\n'
      || site || '/reset-password?token=' || (p_vars ->> 'token')
      || E'\n\nBu talebi siz yapmadıysanız bu e-postayı dikkate almayın.'
    else
      E'We received a request to reset your password. Open this link to choose a new password (valid for 1 hour):\n'
      || site || '/reset-password?token=' || (p_vars ->> 'token')
      || E'\n\nIf you did not ask for this, you can ignore this email.' end;
  elsif p_template = 'admin_deletion_request' then
    s := case when tr then 'Hesap silme talebi: ' else 'Account deletion request: ' end || name;
    b := case when tr then
      name || ' (' || coalesce(p_vars ->> 'email', '') || E') hesabının silinmesini talep etti.\n\n' || site || '/admin/users'
    else
      name || ' (' || coalesce(p_vars ->> 'email', '') || E') asked for their account to be deleted.\n\n' || site || '/admin/users' end;
  else
    raise exception 'unknown email template %', p_template;
  end if;

  insert into public.email_outbox (to_email, lang, template, subject, body_text)
  values (p_to, case when tr then 'tr' else 'en' end, p_template, s, b);
end $$;

-- Server-side dispatcher: the Next.js server holds a shared secret and claims queued emails.
create or replace function public.claim_queued_emails(p_secret text)
returns setof public.email_outbox language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret <> (select value from private.config where key = 'email_dispatch_secret') then
    raise exception 'forbidden';
  end if;
  return query
    update public.email_outbox o set status = 'sending'
    where o.id in (select id from public.email_outbox
                   where status = 'queued' or (status = 'sending' and created_at < now() - interval '10 minutes')
                   order by id limit 50 for update skip locked)
    returning o.*;
end $$;

create or replace function public.mark_email_result(p_secret text, p_id bigint, p_status text, p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_secret is null or p_secret <> (select value from private.config where key = 'email_dispatch_secret') then
    raise exception 'forbidden';
  end if;
  update public.email_outbox
     set status = p_status, error = p_error, sent_at = case when p_status = 'sent' then now() end
   where id = p_id;
end $$;

-- ---------- Notify every admin ----------
create or replace function private.notify_admins(
  p_kind text, p_title_en text, p_title_tr text, p_link text, p_email_template text, p_vars jsonb
) returns void language plpgsql security definer set search_path = '' as $$
declare a record;
begin
  for a in select id, email, preferred_language, notify_email from public.profiles
           where role = 'admin' and status = 'approved' loop
    insert into public.notifications (user_id, kind, title_en, title_tr, link)
    values (a.id, p_kind, p_title_en, p_title_tr, p_link);
    if a.notify_email and p_email_template is not null then
      perform private.queue_email(a.email, a.preferred_language, p_email_template, p_vars);
    end if;
  end loop;
end $$;

-- ---------- Password policy ----------
create or replace function private.password_ok(p text)
returns boolean language sql immutable as $$
  select length(p) >= 10 and p ~ '[a-z]' and p ~ '[A-Z]' and p ~ '[0-9]'
$$;

-- ---------- Create an auth user directly (used by registration and seed) ----------
create or replace function private.create_auth_user(p_email text, p_password text, p_meta jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    lower(p_email), extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, p_meta, now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true),
          'email', now(), now(), now());
  return v_id;
end $$;

-- ---------- Public registration ----------
create or replace function public.register_user(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_id uuid;
  v_name text;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'invalid_email'); end if;
  if not private.password_ok(coalesce(p ->> 'password', '')) then return jsonb_build_object('ok', false, 'error', 'weak_password'); end if;
  if coalesce(trim(p ->> 'first_name'), '') = '' or coalesce(trim(p ->> 'last_name'), '') = ''
     or coalesce(trim(p ->> 'organization'), '') = '' or coalesce(trim(p ->> 'country'), '') = ''
     or coalesce(trim(p ->> 'job_title'), '') = '' or coalesce(trim(p ->> 'phone'), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if coalesce(p ->> 'org_type', '') not in ('right_holder', 'partner', 'other') then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if coalesce((p ->> 'terms_accepted')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'terms_required');
  end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then
    return jsonb_build_object('ok', false, 'error', 'email_exists');
  end if;

  v_id := private.create_auth_user(v_email, p ->> 'password', jsonb_build_object(
    'first_name', left(trim(p ->> 'first_name'), 100), 'last_name', left(trim(p ->> 'last_name'), 100),
    'organization', left(trim(p ->> 'organization'), 200), 'country', left(trim(p ->> 'country'), 100),
    'org_type', p ->> 'org_type', 'job_title', left(trim(p ->> 'job_title'), 150),
    'phone', left(trim(p ->> 'phone'), 50), 'lang', case when p ->> 'lang' = 'tr' then 'tr' else 'en' end,
    'terms_accepted', true));

  v_name := trim(p ->> 'first_name') || ' ' || trim(p ->> 'last_name');
  perform private.log_activity('user.registered', 'profile', v_id::text,
    jsonb_build_object('organization', p ->> 'organization', 'org_type', p ->> 'org_type'), v_id);
  perform private.notify_admins('registration_pending',
    'New registration pending: ' || v_name, 'Onay bekleyen yeni kayıt: ' || v_name,
    '/admin/users?status=pending', 'admin_new_registration',
    jsonb_build_object('name', v_name, 'organization', p ->> 'organization', 'email', v_email));
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Login lockout (5 failed attempts in 15 minutes → locked for 15 minutes) ----------
create table private.login_attempts (
  id bigint generated always as identity primary key,
  email text not null,
  success boolean not null,
  attempted_at timestamptz not null default now()
);
create index login_attempts_email_idx on private.login_attempts (email, attempted_at desc);

create or replace function public.login_precheck(p_email text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_last_success timestamptz;
  v_failures int;
  v_last_failure timestamptz;
  v_hash text;
  v_uid uuid;
begin
  select max(attempted_at) into v_last_success from private.login_attempts where email = v_email and success;
  select count(*), max(attempted_at) into v_failures, v_last_failure
    from private.login_attempts
   where email = v_email and not success
     and attempted_at > greatest(coalesce(v_last_success, '-infinity'), now() - interval '15 minutes');
  if v_failures >= 5 then
    return jsonb_build_object('status', 'locked', 'until', v_last_failure + interval '15 minutes');
  end if;

  select id, encrypted_password into v_uid, v_hash from auth.users where lower(email) = v_email;
  if v_hash is null or v_hash <> extensions.crypt(coalesce(p_password, ''), v_hash) then
    insert into private.login_attempts (email, success) values (v_email, false);
    return jsonb_build_object('status', 'invalid', 'remaining', greatest(0, 4 - v_failures));
  end if;

  insert into private.login_attempts (email, success) values (v_email, true);
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set previous_login_at = last_login_at, last_login_at = now() where id = v_uid;
  perform private.log_activity('auth.login', 'profile', v_uid::text, '{}'::jsonb, v_uid);
  return jsonb_build_object('status', 'ok');
end $$;

-- ---------- Password reset through our own email (no Supabase email configuration needed) ----------
create table private.password_reset_tokens (
  token_hash text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create or replace function public.request_password_reset(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user record;
  v_token text;
  v_recent int;
begin
  select u.id, p.preferred_language, p.status into v_user
    from auth.users u join public.profiles p on p.id = u.id
   where lower(u.email) = lower(trim(coalesce(p_email, '')));
  if v_user.id is null or v_user.status in ('rejected', 'suspended') then
    return; -- never reveal whether an account exists
  end if;
  select count(*) into v_recent from private.password_reset_tokens
   where user_id = v_user.id and expires_at > now() + interval '50 minutes';
  if v_recent >= 3 then return; end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.password_reset_tokens (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_user.id, now() + interval '1 hour');
  perform private.queue_email(lower(trim(p_email)), v_user.preferred_language, 'password_reset',
                              jsonb_build_object('token', v_token));
  perform private.log_activity('auth.password_reset_requested', 'profile', v_user.id::text, '{}'::jsonb, v_user.id);
end $$;

create or replace function public.complete_password_reset(p_token text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_row record;
begin
  if not private.password_ok(coalesce(p_password, '')) then
    return jsonb_build_object('ok', false, 'error', 'weak_password');
  end if;
  select * into v_row from private.password_reset_tokens
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     and used_at is null and expires_at > now();
  if v_row.user_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = v_row.user_id;
  update private.password_reset_tokens set used_at = now() where user_id = v_row.user_id and used_at is null;
  delete from private.login_attempts where email = (select lower(email) from auth.users where id = v_row.user_id);
  perform private.log_activity('auth.password_reset_completed', 'profile', v_row.user_id::text, '{}'::jsonb, v_row.user_id);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- Admin: user management ----------
create or replace function private.require_admin()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
end $$;

create or replace function public.admin_review_user(p_user uuid, p_decision text, p_role public.app_role default null, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  perform private.require_admin();
  select * into v from public.profiles where id = p_user;
  if v.id is null then raise exception 'not_found'; end if;
  if p_decision = 'approve' then
    if p_role is null then raise exception 'role_required'; end if;
    update public.profiles set status = 'approved', role = p_role, review_reason = nullif(trim(coalesce(p_reason, '')), ''),
           reviewed_by = auth.uid(), reviewed_at = now() where id = p_user;
    perform private.queue_email(v.email, v.preferred_language, 'account_approved',
      jsonb_build_object('name', v.first_name));
    perform private.log_activity('user.approved', 'profile', p_user::text, jsonb_build_object('role', p_role, 'email', v.email));
  elsif p_decision = 'reject' then
    update public.profiles set status = 'rejected', role = null, review_reason = nullif(trim(coalesce(p_reason, '')), ''),
           reviewed_by = auth.uid(), reviewed_at = now() where id = p_user;
    perform private.queue_email(v.email, v.preferred_language, 'account_rejected',
      jsonb_build_object('name', v.first_name, 'reason', coalesce(p_reason, '')));
    perform private.log_activity('user.rejected', 'profile', p_user::text, jsonb_build_object('reason', p_reason, 'email', v.email));
  else
    raise exception 'invalid_decision';
  end if;
end $$;

create or replace function public.admin_set_user_role(p_user uuid, p_role public.app_role)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_user = auth.uid() and p_role <> 'admin' then raise exception 'cannot_demote_self'; end if;
  update public.profiles set role = p_role where id = p_user;
  perform private.log_activity('user.role_changed', 'profile', p_user::text, jsonb_build_object('role', p_role));
end $$;

create or replace function public.admin_set_user_status(p_user uuid, p_status public.account_status)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if p_user = auth.uid() then raise exception 'cannot_change_self'; end if;
  if p_status not in ('approved', 'suspended') then raise exception 'invalid_status'; end if;
  update public.profiles set status = p_status where id = p_user and role is not null;
  perform private.log_activity(case when p_status = 'suspended' then 'user.suspended' else 'user.reactivated' end,
                               'profile', p_user::text, '{}'::jsonb);
end $$;

create or replace function public.admin_set_user_password(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  if not private.password_ok(coalesce(p_password, '')) then raise exception 'weak_password'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now()
   where id = p_user;
  delete from private.login_attempts where email = (select lower(email) from auth.users where id = p_user);
  perform private.log_activity('user.password_set_by_admin', 'profile', p_user::text, '{}'::jsonb);
end $$;

create or replace function public.admin_export_user_data(p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.require_admin();
  perform private.log_activity('user.data_exported', 'profile', p_user::text, '{}'::jsonb);
  return jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where id = p_user),
    'activity', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at)
                          from public.activity_log a where a.actor_id = p_user), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at)
                               from public.notifications n where n.user_id = p_user), '[]'::jsonb)
  );
end $$;

create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  perform private.require_admin();
  if p_user = auth.uid() then raise exception 'cannot_delete_self'; end if;
  select email into v_email from public.profiles where id = p_user;
  delete from auth.users where id = p_user;
  perform private.log_activity('user.deleted', 'profile', p_user::text, jsonb_build_object('email', v_email));
end $$;

-- ---------- Self-service ----------
create or replace function public.request_account_deletion()
returns void language plpgsql security definer set search_path = '' as $$
declare v record;
begin
  select * into v from public.profiles where id = auth.uid();
  if v.id is null then raise exception 'forbidden'; end if;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set deletion_requested_at = now() where id = v.id;
  perform private.log_activity('user.deletion_requested', 'profile', v.id::text, '{}'::jsonb);
  perform private.notify_admins('deletion_request',
    'Account deletion requested: ' || v.first_name || ' ' || v.last_name,
    'Hesap silme talebi: ' || v.first_name || ' ' || v.last_name,
    '/admin/users', 'admin_deletion_request',
    jsonb_build_object('name', v.first_name || ' ' || v.last_name, 'email', v.email));
end $$;

create or replace function public.mark_notifications_read()
returns void language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

create or replace function public.log_password_changed()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'forbidden'; end if;
  perform private.log_activity('auth.password_changed', 'profile', auth.uid()::text, '{}'::jsonb);
end $$;

-- ---------- Settings ----------
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- Announcements ----------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_tr text,
  body_en text not null default '',
  body_tr text,
  priority public.announcement_priority not null default 'normal',
  visibility public.content_visibility not null default 'all',
  status public.publish_status not null default 'draft',
  published_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Deadlines ----------
create table public.deadlines (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_tr text,
  due_at timestamptz not null,
  link text,
  visibility public.content_visibility not null default 'all',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.activity_log enable row level security;
alter table public.notifications enable row level security;
alter table public.email_outbox enable row level security;
alter table public.settings enable row level security;
alter table public.announcements enable row level security;
alter table public.deadlines enable row level security;
alter table private.config enable row level security;
alter table private.login_attempts enable row level security;
alter table private.password_reset_tokens enable row level security;

create policy "profiles: read own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "activity: admin read" on public.activity_log for select to authenticated
  using (public.is_admin());

create policy "notifications: read own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications: update own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "outbox: admin read" on public.email_outbox for select to authenticated
  using (public.is_admin());

create policy "settings: approved read" on public.settings for select to authenticated
  using (public.is_approved());
create policy "settings: admin write" on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "announcements: read visible" on public.announcements for select to authenticated
  using ((status = 'published' and public.can_view(visibility)) or public.is_staff());
create policy "announcements: staff write" on public.announcements for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy "deadlines: read visible" on public.deadlines for select to authenticated
  using (public.can_view(visibility) or public.is_staff());
create policy "deadlines: staff write" on public.deadlines for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ---------- Function privileges ----------
revoke execute on all functions in schema private from public, anon, authenticated;
revoke execute on function public.claim_queued_emails(text), public.mark_email_result(text, bigint, text, text) from public;
grant execute on function public.claim_queued_emails(text), public.mark_email_result(text, bigint, text, text) to anon, authenticated;

revoke execute on function public.admin_review_user(uuid, text, public.app_role, text),
  public.admin_set_user_role(uuid, public.app_role), public.admin_set_user_status(uuid, public.account_status),
  public.admin_set_user_password(uuid, text), public.admin_export_user_data(uuid), public.admin_delete_user(uuid),
  public.request_account_deletion(), public.mark_notifications_read(), public.log_password_changed()
  from public, anon;
grant execute on function public.admin_review_user(uuid, text, public.app_role, text),
  public.admin_set_user_role(uuid, public.app_role), public.admin_set_user_status(uuid, public.account_status),
  public.admin_set_user_password(uuid, text), public.admin_export_user_data(uuid), public.admin_delete_user(uuid),
  public.request_account_deletion(), public.mark_notifications_read(), public.log_password_changed()
  to authenticated;
