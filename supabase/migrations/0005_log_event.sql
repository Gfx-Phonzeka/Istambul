-- Lets signed-in, approved users record usage events (PDF exports, page views) in the activity log.
-- Only harmless prefixes are accepted so users cannot forge administrative entries.
create or replace function public.log_event(p_action text, p_details jsonb default '{}'::jsonb, p_entity_type text default null, p_entity_id text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_approved() then return; end if;
  if p_action !~ '^(handbook|view)\.[a-z_]{1,40}$' then raise exception 'invalid_action'; end if;
  perform private.log_activity(p_action, left(p_entity_type, 60), left(p_entity_id, 200),
                               coalesce(p_details, '{}'::jsonb) - 'actor');
end $$;
revoke execute on function public.log_event(text, jsonb, text, text) from public, anon;
grant execute on function public.log_event(text, jsonb, text, text) to authenticated;
