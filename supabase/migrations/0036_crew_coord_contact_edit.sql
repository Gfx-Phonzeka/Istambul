-- HB Portal · Crew Ops coordination can correct the contact data (name, phone, organisation) of production-team members.
-- The email stays with administrators (it is the sign-in).
create or replace function public.crew_update_contact(p_id uuid, p_first text, p_last text, p_phone text, p_org text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_crew_coord() then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.profiles where id = p_id and (role = 'production' or public.is_admin())) then raise exception 'forbidden'; end if;
  if coalesce(trim(p_first), '') = '' or coalesce(trim(p_last), '') = '' then raise exception 'missing_fields'; end if;
  perform set_config('app.bypass_profile_guard', 'on', true);
  update public.profiles set first_name = left(trim(p_first), 100), last_name = left(trim(p_last), 100),
    phone = left(trim(coalesce(p_phone, '')), 50), organization = left(trim(coalesce(nullif(p_org, ''), organization)), 200)
  where id = p_id;
  perform private.log_activity('crew.contact_updated', 'profile', p_id::text, '{}'::jsonb);
end $$;
grant execute on function public.crew_update_contact(uuid, text, text, text, text) to authenticated;
