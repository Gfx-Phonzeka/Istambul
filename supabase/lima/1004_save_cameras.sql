-- Lima 2027 only: camera saving keeps the Spanish, English and Portuguese functions (Istanbul's version only knows EN/TR).
CREATE OR REPLACE FUNCTION public.save_cameras(p_plan uuid, p_cameras jsonb)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
declare c jsonb; i int := 0; keep uuid[] := '{}'; v_id uuid; v_status public.publish_status;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  select status into v_status from public.camera_plans where id = p_plan;
  if v_status is null then raise exception 'not_found'; end if;
  for c in select * from jsonb_array_elements(coalesce(p_cameras, '[]'::jsonb)) loop
    i := i + 1;
    v_id := nullif(c ->> 'id', '')::uuid;
    if v_id is not null and exists (select 1 from public.cameras where id = v_id and plan_id = p_plan) then
      update public.cameras set position = i, number = left(coalesce(c ->> 'number', ''), 20), type = left(coalesce(c ->> 'type', 'hard'), 40),
             lens = left(c ->> 'lens', 80),
             function_es = nullif(left(c ->> 'function_es', 300), ''), function_en = nullif(left(c ->> 'function_en', 300), ''), function_pt = nullif(left(c ->> 'function_pt', 300), ''),
             level = coalesce(nullif(c ->> 'level', ''), '1'), is_special = coalesce((c ->> 'is_special')::boolean, false),
             x = least(1, greatest(0, coalesce((c ->> 'x')::numeric, 0.5))), y = least(1, greatest(0, coalesce((c ->> 'y')::numeric, 0.5))),
             angle = nullif(c ->> 'angle', '')::numeric
       where id = v_id;
    else
      insert into public.cameras (plan_id, position, number, type, lens, function_es, function_en, function_pt, level, is_special, x, y, angle)
      values (p_plan, i, left(coalesce(c ->> 'number', ''), 20), left(coalesce(c ->> 'type', 'hard'), 40), left(c ->> 'lens', 80),
              nullif(left(c ->> 'function_es', 300), ''), nullif(left(c ->> 'function_en', 300), ''), nullif(left(c ->> 'function_pt', 300), ''),
              coalesce(nullif(c ->> 'level', ''), '1'), coalesce((c ->> 'is_special')::boolean, false),
              least(1, greatest(0, coalesce((c ->> 'x')::numeric, 0.5))), least(1, greatest(0, coalesce((c ->> 'y')::numeric, 0.5))),
              nullif(c ->> 'angle', '')::numeric)
      returning id into v_id;
    end if;
    keep := keep || v_id;
  end loop;
  delete from public.cameras where plan_id = p_plan and not (id = any (keep));
  if v_status = 'published' then
    update public.camera_plans set content_updated_at = now() where id = p_plan;
  end if;
  perform private.log_activity('camera.cameras_saved', 'camera_plans', p_plan::text, jsonb_build_object('count', i));
end $function$;
