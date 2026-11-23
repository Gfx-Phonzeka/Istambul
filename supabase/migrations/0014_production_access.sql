-- HB Portal · Production team, part 2: access rules, team requests, team files, team import and invitations.
-- The "production" role sees everything an approved Right Holder sees, plus content marked "production".
-- Nothing changes for right holders and partners.

-- ---------- Team fields on the profile (set by admins, read-only for the user) ----------
alter table public.profiles
  add column if not exists team_function text,
  add column if not exists team_venue_id uuid references public.venues (id) on delete set null,
  add column if not exists team_sport_id uuid references public.sports (id) on delete set null;

create or replace function private.guard_profile_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if coalesce(current_setting('app.bypass_profile_guard', true), '') = 'on' then
    return new;
  end if;
  if auth.uid() is null or public.is_admin() then
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
  new.team_function := old.team_function;
  new.team_venue_id := old.team_venue_id;
  new.team_sport_id := old.team_sport_id;
  return new;
end $$;

-- ---------- Role helpers ----------
create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.my_role() in ('production', 'editor', 'admin'), false)
$$;

create or replace function public.can_view(v public.content_visibility)
returns boolean language sql stable security definer set search_path = '' as $$
  select case v
    when 'all' then public.is_approved()
    when 'partners' then coalesce(public.my_role() in ('partner', 'editor', 'admin'), false)
    when 'production' then public.is_team()
    when 'internal' then public.is_staff()
  end
$$;

create or replace function private.user_can_view(p_role public.app_role, v public.content_visibility)
returns boolean language sql immutable set search_path = '' as $$
  select case v when 'all' then p_role is not null
                when 'partners' then p_role in ('partner', 'editor', 'admin')
                when 'production' then p_role in ('production', 'editor', 'admin')
                else p_role in ('editor', 'admin') end
$$;

grant execute on function public.is_team() to authenticated;

-- ---------- Team requests (same workflow as service requests, separate list for admins) ----------
alter table public.service_requests drop constraint if exists service_requests_request_type_check;
alter table public.service_requests add constraint service_requests_request_type_check check (request_type in (
  'unilateral', 'additional_production', 'other',
  'team_equipment', 'team_accreditation', 'team_uniform', 'team_logistics', 'team_other'));

create or replace function public.create_service_request(p jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_ref text; me record; a record; v_type text := coalesce(p ->> 'request_type', ''); v_team boolean;
begin
  if not public.is_approved() then raise exception 'forbidden'; end if;
  v_team := v_type like 'team\_%';
  if v_team then
    if v_type not in ('team_equipment', 'team_accreditation', 'team_uniform', 'team_logistics', 'team_other') or not public.is_team() then
      raise exception 'invalid_type';
    end if;
  elsif v_type not in ('unilateral', 'additional_production', 'other') then
    raise exception 'invalid_type';
  end if;
  if length(trim(coalesce(p ->> 'description', ''))) < 10 then raise exception 'description_required'; end if;
  if coalesce(trim(p ->> 'contact_name'), '') = '' or coalesce(p ->> 'contact_email', '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'contact_required'; end if;
  select * into me from public.profiles where id = auth.uid();
  insert into public.service_requests (user_id, request_type, venue_id, sport_id, start_date, end_date, description, contact_name, contact_email, contact_phone)
  values (auth.uid(), v_type, nullif(p ->> 'venue_id', '')::uuid, nullif(p ->> 'sport_id', '')::uuid,
          nullif(p ->> 'start_date', '')::date, nullif(p ->> 'end_date', '')::date, left(trim(p ->> 'description'), 5000),
          left(trim(p ->> 'contact_name'), 200), left(trim(p ->> 'contact_email'), 200), left(nullif(trim(p ->> 'contact_phone'), ''), 50))
  returning id, reference into v_id, v_ref;
  insert into public.request_events (request_id, status) values (v_id, 'received');
  perform private.log_activity('request.created', 'service_requests', v_id::text, jsonb_build_object('reference', v_ref, 'team', v_team));
  for a in select id from public.profiles where role = 'admin' and status = 'approved' loop
    if v_team then
      perform private.notify_user(a.id, 'request_new', 'New team request ' || v_ref || ' – ' || me.first_name || ' ' || me.last_name,
        'Yeni ekip talebi ' || v_ref || ' – ' || me.first_name || ' ' || me.last_name, left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300),
        '/admin/requests/' || v_id);
    else
      perform private.notify_user(a.id, 'request_new', 'New service request ' || v_ref || ' – ' || me.organization,
        'Yeni hizmet talebi ' || v_ref || ' – ' || me.organization, left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300),
        '/admin/requests/' || v_id);
    end if;
  end loop;
  perform private.queue_raw_email(me.email, me.preferred_language, 'request_received',
    case when me.preferred_language = 'tr' then 'Talebiniz alındı: ' || v_ref else 'We received your request: ' || v_ref end,
    case when me.preferred_language = 'tr'
      then 'Talebiniz (' || v_ref || E') alındı. Durumu portalda takip edebilirsiniz:\n' || private.site_url() || '/requests'
      else 'Your request (' || v_ref || E') has been received. You can follow its status in the portal:\n' || private.site_url() || '/requests' end);
  return v_ref;
end $$;

-- ---------- Private storage for production-team files (manual drawings, wipes, templates…) ----------
insert into storage.buckets (id, name, public) values ('team-media', 'team-media', false) on conflict (id) do nothing;
drop policy if exists "team-media: team read" on storage.objects;
drop policy if exists "team-media: staff insert" on storage.objects;
drop policy if exists "team-media: staff update" on storage.objects;
drop policy if exists "team-media: staff delete" on storage.objects;
create policy "team-media: team read" on storage.objects for select to authenticated
  using (bucket_id = 'team-media' and public.is_team());
create policy "team-media: staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'team-media' and public.is_staff());
create policy "team-media: staff update" on storage.objects for update to authenticated
  using (bucket_id = 'team-media' and public.is_staff());
create policy "team-media: staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'team-media' and public.is_staff());

-- ---------- Team import (admins): creates or updates one production-team account ----------
-- The account is approved with the "production" role and an unusable random password;
-- the person sets their own password through the invitation email.
create or replace function public.admin_import_team_member(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_first text := left(trim(coalesce(p ->> 'first_name', '')), 100);
  v_last text := left(trim(coalesce(p ->> 'last_name', '')), 100);
  v_lang text := case when p ->> 'lang' = 'tr' then 'tr' else 'en' end;
  v_id uuid; v_prof record;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'invalid_email'); end if;
  if v_first = '' or v_last = '' then return jsonb_build_object('ok', false, 'error', 'missing_fields'); end if;

  select id into v_id from auth.users where lower(email) = v_email;
  if v_id is null then
    v_id := private.create_auth_user(v_email, encode(extensions.gen_random_bytes(24), 'hex'), jsonb_build_object(
      'first_name', v_first, 'last_name', v_last, 'organization', left(trim(coalesce(nullif(p ->> 'organization', ''), 'Medialuso')), 200),
      'country', left(trim(coalesce(p ->> 'country', '')), 100), 'org_type', 'other', 'job_title', left(trim(coalesce(p ->> 'function', '')), 150),
      'phone', left(trim(coalesce(p ->> 'phone', '')), 50), 'lang', v_lang, 'terms_accepted', false));
  end if;
  select * into v_prof from public.profiles where id = v_id;
  if v_prof.role is not null and v_prof.role <> 'production' then
    return jsonb_build_object('ok', false, 'error', 'other_role', 'role', v_prof.role);
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set
    first_name = v_first, last_name = v_last,
    organization = left(trim(coalesce(nullif(p ->> 'organization', ''), nullif(organization, ''), 'Medialuso')), 200),
    job_title = left(trim(coalesce(p ->> 'function', '')), 150),
    phone = left(trim(coalesce(p ->> 'phone', '')), 50),
    preferred_language = v_lang,
    team_function = nullif(left(trim(coalesce(p ->> 'function', '')), 150), ''),
    team_venue_id = nullif(p ->> 'venue_id', '')::uuid,
    team_sport_id = nullif(p ->> 'sport_id', '')::uuid,
    role = 'production', status = 'approved', reviewed_by = auth.uid(), reviewed_at = coalesce(reviewed_at, now())
  where id = v_id;
  perform private.log_activity('team.imported', 'profile', v_id::text, jsonb_build_object('email', v_email, 'new', v_prof.role is null));
  return jsonb_build_object('ok', true, 'id', v_id, 'status', case when v_prof.role is null then 'created' else 'updated' end);
end $$;

-- ---------- Invitation email: a link to choose a password (valid 7 days) ----------
create or replace function public.admin_send_team_invite(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v record; v_token text; tr boolean;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select id, email, first_name, preferred_language into v from public.profiles where id = p_user and role = 'production' and status = 'approved';
  if v.id is null then raise exception 'not_found'; end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.password_reset_tokens (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v.id, now() + interval '7 days');
  tr := v.preferred_language = 'tr';
  perform private.queue_raw_email(v.email, v.preferred_language, 'team_invite',
    case when tr then 'Istanbul 2027 HB Portal – ekip hesabınız' else 'Istanbul 2027 HB Portal – your team account' end,
    case when tr then
      'Merhaba ' || v.first_name || E',\n\nIstanbul 2027 HB Portal''da üretim ekibi hesabınız oluşturuldu. Şifrenizi belirlemek için bu bağlantıyı açın (7 gün geçerlidir):\n'
      || private.site_url() || '/reset-password?token=' || v_token
      || E'\n\nŞifrenizi belirledikten sonra ' || private.site_url() || '/login adresinden giriş yapabilirsiniz.'
    else
      'Hello ' || v.first_name || E',\n\nYour production team account on the Istanbul 2027 HB Portal is ready. Open this link to choose your password (valid for 7 days):\n'
      || private.site_url() || '/reset-password?token=' || v_token
      || E'\n\nAfter choosing your password, sign in at ' || private.site_url() || '/login.' end);
  perform private.log_activity('team.invited', 'profile', v.id::text, jsonb_build_object('email', v.email));
end $$;

revoke execute on function public.admin_import_team_member(jsonb), public.admin_send_team_invite(uuid) from public, anon;
grant execute on function public.admin_import_team_member(jsonb), public.admin_send_team_invite(uuid) to authenticated;
