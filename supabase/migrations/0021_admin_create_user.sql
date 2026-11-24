-- Administrators can create accounts directly (already approved, with a role), e.g. for testing or for people who cannot register.
create or replace function public.admin_create_user(p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(coalesce(p ->> 'email', '')));
  v_role text := coalesce(p ->> 'role', '');
  v_lang text := coalesce(p ->> 'lang', '');
  v_id uuid;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'invalid_email'); end if;
  if not private.password_ok(coalesce(p ->> 'password', '')) then return jsonb_build_object('ok', false, 'error', 'weak_password'); end if;
  if coalesce(trim(p ->> 'first_name'), '') = '' or coalesce(trim(p ->> 'last_name'), '') = '' or coalesce(trim(p ->> 'organization'), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_fields');
  end if;
  if v_role not in ('right_holder', 'partner', 'production', 'editor', 'admin') then return jsonb_build_object('ok', false, 'error', 'missing_fields'); end if;
  if exists (select 1 from auth.users where lower(email) = v_email) then return jsonb_build_object('ok', false, 'error', 'email_exists'); end if;

  v_id := private.create_auth_user(v_email, p ->> 'password', jsonb_build_object(
    'first_name', left(trim(p ->> 'first_name'), 100), 'last_name', left(trim(p ->> 'last_name'), 100),
    'organization', left(trim(p ->> 'organization'), 200), 'country', left(trim(coalesce(p ->> 'country', '')), 100),
    'org_type', case when v_role in ('right_holder', 'partner') then v_role else 'other' end,
    'job_title', left(trim(coalesce(p ->> 'job_title', '')), 150), 'phone', left(trim(coalesce(p ->> 'phone', '')), 50),
    'lang', v_lang, 'terms_accepted', true));
  update public.profiles set role = v_role::public.app_role, status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
         preferred_language = coalesce(nullif(v_lang, ''), preferred_language)
   where id = v_id;
  perform private.log_activity('user.created_by_admin', 'profile', v_id::text, jsonb_build_object('email', v_email, 'role', v_role));
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.admin_create_user(jsonb) from public, anon;
grant execute on function public.admin_create_user(jsonb) to authenticated;
