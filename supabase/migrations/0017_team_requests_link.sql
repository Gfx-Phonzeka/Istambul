-- Team requests moved to /team/requests (the /requests page is the right holders' Service Requests entry).
-- Points the links in request e-mails and notifications to the new page. Works on both events' databases:
-- each function is rewritten from its current definition, so per-event texts stay as they are.
do $$
declare f text; d text;
begin
  foreach f in array array['public.create_service_request(jsonb)', 'public.admin_update_request(uuid,public.request_status,text)'] loop
    d := pg_get_functiondef(f::regprocedure);
    d := replace(replace(d, '|| ''/requests#''', '|| ''/team/requests#'''), '|| ''/requests''', '|| ''/team/requests''');
    execute d;
  end loop;
end $$;
