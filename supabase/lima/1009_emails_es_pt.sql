-- HB Portal · Lima: automatic emails and notifications in Spanish, Brazilian Portuguese and English
-- (by the person's preferred language). Replaces the English/Turkish wording inherited from Istanbul.

create or replace function private.lang3(p text) returns text language sql immutable set search_path = '' as $$
  select case when p in ('es', 'pt') then p else 'en' end
$$;

create or replace function private.queue_raw_email(p_to text, p_lang text, p_template text, p_subject text, p_body text)
returns void language sql security definer set search_path = '' as $$
  insert into public.email_outbox (to_email, lang, template, subject, body_text)
  values (p_to, private.lang3(p_lang), p_template, p_subject, p_body)
$$;

create or replace function private.queue_email(p_to text, p_lang text, p_template text, p_vars jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  l text := private.lang3(p_lang);
  s text; b text;
  site text := private.site_url();
  name text := coalesce(p_vars ->> 'name', '');
  reason text := coalesce(p_vars ->> 'reason', '');
  sig text := E'\n\nHost Broadcaster · Lima 2027';
begin
  if p_template = 'account_approved' then
    s := case l when 'es' then 'Tu cuenta del portal Lima 2027 ha sido aprobada' when 'pt' then 'Sua conta do portal Lima 2027 foi aprovada' else 'Your Lima 2027 portal account has been approved' end;
    b := case l
      when 'es' then 'Hola ' || name || E',\n\nTu solicitud de acceso al Lima 2027 HB Portal ha sido aprobada.\nInicia sesión aquí: ' || site || '/login'
      when 'pt' then 'Olá ' || name || E',\n\nSua solicitação de acesso ao Lima 2027 HB Portal foi aprovada.\nEntre aqui: ' || site || '/login'
      else 'Hello ' || name || E',\n\nYour request to access the Lima 2027 HB Portal has been approved.\nSign in here: ' || site || '/login' end || sig;
  elsif p_template = 'account_rejected' then
    s := case l when 'es' then 'Tu solicitud de acceso al portal Lima 2027' when 'pt' then 'Sua solicitação de acesso ao portal Lima 2027' else 'Your Lima 2027 portal access request' end;
    b := case l
      when 'es' then 'Hola ' || name || E',\n\nLamentablemente, tu solicitud de acceso al Lima 2027 HB Portal no fue aprobada.'
        || case when reason <> '' then E'\nMotivo: ' || reason else '' end || E'\n\nSi tienes preguntas, contáctanos.'
      when 'pt' then 'Olá ' || name || E',\n\nInfelizmente, sua solicitação de acesso ao Lima 2027 HB Portal não foi aprovada.'
        || case when reason <> '' then E'\nMotivo: ' || reason else '' end || E'\n\nSe tiver dúvidas, entre em contato conosco.'
      else 'Hello ' || name || E',\n\nUnfortunately your request to access the Lima 2027 HB Portal was not approved.'
        || case when reason <> '' then E'\nReason: ' || reason else '' end || E'\n\nPlease contact us if you have any questions.' end || sig;
  elsif p_template = 'admin_new_registration' then
    s := case l when 'es' then 'Nuevo registro pendiente de aprobación: ' when 'pt' then 'Novo cadastro aguardando aprovação: ' else 'New registration pending approval: ' end || name;
    b := case l
      when 'es' then E'Hay un nuevo registro esperando aprobación.\n\nNombre: ' || name || E'\nOrganización: ' || coalesce(p_vars ->> 'organization', '')
        || E'\nCorreo: ' || coalesce(p_vars ->> 'email', '') || E'\n\nRevísalo aquí: '
      when 'pt' then E'Há um novo cadastro aguardando aprovação.\n\nNome: ' || name || E'\nOrganização: ' || coalesce(p_vars ->> 'organization', '')
        || E'\nEmail: ' || coalesce(p_vars ->> 'email', '') || E'\n\nVeja aqui: '
      else E'A new registration is waiting for approval.\n\nName: ' || name || E'\nOrganisation: ' || coalesce(p_vars ->> 'organization', '')
        || E'\nEmail: ' || coalesce(p_vars ->> 'email', '') || E'\n\nReview it here: ' end || site || '/admin/users?status=pending';
  elsif p_template = 'password_reset' then
    s := case l when 'es' then 'Portal Lima 2027 – restablecer contraseña' when 'pt' then 'Portal Lima 2027 – redefinir senha' else 'Lima 2027 portal – password reset' end;
    b := case l
      when 'es' then E'Recibimos una solicitud para restablecer tu contraseña. Abre este enlace para elegir una nueva (válido durante 1 hora):\n'
        || site || '/reset-password?token=' || (p_vars ->> 'token') || E'\n\nSi no lo solicitaste, ignora este correo.'
      when 'pt' then E'Recebemos uma solicitação para redefinir sua senha. Abra este link para escolher uma nova (válido por 1 hora):\n'
        || site || '/reset-password?token=' || (p_vars ->> 'token') || E'\n\nSe você não pediu isso, ignore este email.'
      else E'We received a request to reset your password. Open this link to choose a new password (valid for 1 hour):\n'
        || site || '/reset-password?token=' || (p_vars ->> 'token') || E'\n\nIf you did not ask for this, you can ignore this email.' end;
  elsif p_template = 'admin_deletion_request' then
    s := case l when 'es' then 'Solicitud de eliminación de cuenta: ' when 'pt' then 'Solicitação de exclusão de conta: ' else 'Account deletion request: ' end || name;
    b := name || ' (' || coalesce(p_vars ->> 'email', '') || ') ' || case l
      when 'es' then 'pidió eliminar su cuenta.' when 'pt' then 'pediu a exclusão da conta.' else 'asked for their account to be deleted.' end
      || E'\n\n' || site || '/admin/users';
  else
    raise exception 'unknown email template %', p_template;
  end if;
  insert into public.email_outbox (to_email, lang, template, subject, body_text) values (p_to, l, p_template, s, b);
end $$;

-- Bell notification + optional email in the person's language. Spanish/Portuguese texts are optional (fall back to English).
drop function if exists private.notify_user(uuid, text, text, text, text, text, text);
create or replace function private.notify_user(p_user uuid, p_kind text, p_title_en text, p_title_tr text, p_body_en text, p_body_tr text, p_link text,
  p_title_es text default null, p_title_pt text default null, p_body_es text default null, p_body_pt text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare u record; l text; t text; b text;
begin
  select id, email, preferred_language, notify_email into u from public.profiles where id = p_user and status = 'approved';
  if u.id is null then return; end if;
  insert into public.notifications (user_id, kind, title_en, title_tr, body_en, body_tr, link, title_es, title_pt, body_es, body_pt)
  values (u.id, p_kind, p_title_en, p_title_tr, p_body_en, p_body_tr, p_link, p_title_es, p_title_pt, p_body_es, p_body_pt);
  if u.notify_email then
    l := private.lang3(u.preferred_language);
    t := case l when 'es' then coalesce(p_title_es, p_title_en) when 'pt' then coalesce(p_title_pt, p_title_en) else p_title_en end;
    b := case l when 'es' then coalesce(p_body_es, p_body_en, '') when 'pt' then coalesce(p_body_pt, p_body_en, '') else coalesce(p_body_en, '') end;
    perform private.queue_raw_email(u.email, l, 'notification', t,
      b || E'\n\n' || private.site_url() || coalesce(p_link, '/') || case l
        when 'es' then E'\n\nPuedes cambiar tus preferencias de notificación en tu perfil.'
        when 'pt' then E'\n\nVocê pode alterar suas preferências de notificação no seu perfil.'
        else E'\n\nYou can change your notification preferences in your profile.' end);
  end if;
end $$;

drop function if exists private.notify_followers(jsonb, text, text, text, text, text, text, public.content_visibility);
create or replace function private.notify_followers(p_targets jsonb, p_kind text, p_title_en text, p_title_tr text, p_body_en text, p_body_tr text,
  p_link text, p_visibility public.content_visibility,
  p_title_es text default null, p_title_pt text default null, p_body_es text default null, p_body_pt text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare u uuid;
begin
  for u in
    select distinct f.user_id from public.favorites f
      join jsonb_to_recordset(p_targets) as t(kind text, id uuid) on t.kind = f.kind and t.id = f.target_id
      join public.profiles p on p.id = f.user_id
     where p.status = 'approved' and private.user_can_view(p.role, p_visibility) and f.user_id is distinct from auth.uid()
  loop
    perform private.notify_user(u, p_kind, p_title_en, p_title_tr, p_body_en, p_body_tr, p_link, p_title_es, p_title_pt, p_body_es, p_body_pt);
  end loop;
end $$;

create or replace function public.notify_schedule_import(p_sports uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  for s in select id, title_en, title_es, title_pt, title_tr from public.sports where id = any (p_sports) loop
    perform private.notify_followers(jsonb_build_array(jsonb_build_object('kind', 'sport', 'id', s.id)), 'schedule_changed',
      'Schedule updated: ' || s.title_en, 'Takvim güncellendi: ' || coalesce(s.title_tr, s.title_en),
      'The competition schedule of this sport has changed.', 'Bu sporun yarışma takvimi değişti.', '/schedule', 'all',
      'Calendario actualizado: ' || coalesce(s.title_es, s.title_en), 'Calendário atualizado: ' || coalesce(s.title_pt, s.title_en),
      'El calendario de competición de este deporte ha cambiado.', 'O calendário de competição deste esporte mudou.');
  end loop;
end $$;

create or replace function private.on_announcement_published()
returns trigger language plpgsql security definer set search_path = '' as $$
declare u record;
begin
  if new.priority = 'urgent' and new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published' or old.content_updated_at is distinct from new.content_updated_at) then
    for u in select id from public.profiles where status = 'approved' and private.user_can_view(role, new.visibility) loop
      perform private.notify_user(u.id, 'urgent_notice', 'Urgent: ' || new.title_en, 'Acil: ' || coalesce(new.title_tr, new.title_en),
        left(public.html_to_text(new.body_en), 400), left(public.html_to_text(coalesce(new.body_tr, new.body_en)), 400), '/news/' || new.id,
        'Urgente: ' || coalesce(new.title_es, new.title_en), 'Urgente: ' || coalesce(new.title_pt, new.title_en),
        left(public.html_to_text(coalesce(new.body_es, new.body_en)), 400), left(public.html_to_text(coalesce(new.body_pt, new.body_en)), 400));
    end loop;
  end if;
  return new;
end $$;

create or replace function public.admin_send_team_invite(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v record; v_token text; l text; link text;
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select id, email, first_name, preferred_language into v from public.profiles where id = p_user and role = 'production' and status = 'approved';
  if v.id is null then raise exception 'not_found'; end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into private.password_reset_tokens (token_hash, user_id, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v.id, now() + interval '7 days');
  l := private.lang3(v.preferred_language);
  link := private.site_url() || '/reset-password?token=' || v_token;
  perform private.queue_raw_email(v.email, l, 'team_invite',
    case l when 'es' then 'Lima 2027 HB Portal – tu cuenta del equipo' when 'pt' then 'Lima 2027 HB Portal – sua conta da equipe' else 'Lima 2027 HB Portal – your team account' end,
    case l
      when 'es' then 'Hola ' || v.first_name || E',\n\nTu cuenta del equipo de producción en el Lima 2027 HB Portal está lista. Abre este enlace para elegir tu contraseña (válido durante 7 días):\n'
        || link || E'\n\nDespués, inicia sesión en ' || private.site_url() || '/login.'
      when 'pt' then 'Olá ' || v.first_name || E',\n\nSua conta da equipe de produção no Lima 2027 HB Portal está pronta. Abra este link para escolher sua senha (válido por 7 dias):\n'
        || link || E'\n\nDepois, entre em ' || private.site_url() || '/login.'
      else 'Hello ' || v.first_name || E',\n\nYour production team account on the Lima 2027 HB Portal is ready. Open this link to choose your password (valid for 7 days):\n'
        || link || E'\n\nAfter choosing your password, sign in at ' || private.site_url() || '/login.' end);
  perform private.log_activity('team.invited', 'profile', v.id::text, jsonb_build_object('email', v.email));
end $$;

create or replace function public.create_service_request(p jsonb)
returns text language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_ref text; me record; a record; v_type text := coalesce(p ->> 'request_type', ''); v_team boolean; l text;
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
        '/admin/requests/' || v_id,
        'Nueva solicitud del equipo ' || v_ref || ' – ' || me.first_name || ' ' || me.last_name,
        'Nova solicitação da equipe ' || v_ref || ' – ' || me.first_name || ' ' || me.last_name,
        left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300));
    else
      perform private.notify_user(a.id, 'request_new', 'New service request ' || v_ref || ' – ' || me.organization,
        'Yeni hizmet talebi ' || v_ref || ' – ' || me.organization, left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300),
        '/admin/requests/' || v_id,
        'Nueva solicitud de servicio ' || v_ref || ' – ' || me.organization, 'Nova solicitação de serviço ' || v_ref || ' – ' || me.organization,
        left(trim(p ->> 'description'), 300), left(trim(p ->> 'description'), 300));
    end if;
  end loop;
  l := private.lang3(me.preferred_language);
  perform private.queue_raw_email(me.email, l, 'request_received',
    case l when 'es' then 'Hemos recibido tu solicitud: ' when 'pt' then 'Recebemos sua solicitação: ' else 'We received your request: ' end || v_ref,
    case l
      when 'es' then 'Hemos recibido tu solicitud (' || v_ref || E'). Puedes seguir su estado en el portal:\n'
      when 'pt' then 'Recebemos sua solicitação (' || v_ref || E'). Você pode acompanhar o status no portal:\n'
      else 'Your request (' || v_ref || E') has been received. You can follow its status in the portal:\n' end
      || private.site_url() || '/team/requests');
  return v_ref;
end $$;

create or replace function public.admin_update_request(p_id uuid, p_status public.request_status, p_message text)
returns void language plpgsql security definer set search_path = '' as $$
declare r record; u record; l text; lab text;
  labels jsonb := '{"en":{"received":"Received","in_review":"In review","confirmed":"Confirmed","rejected":"Declined"},
                    "es":{"received":"Recibida","in_review":"En revisión","confirmed":"Confirmada","rejected":"Rechazada"},
                    "pt":{"received":"Recebida","in_review":"Em análise","confirmed":"Confirmada","rejected":"Recusada"},
                    "tr":{"received":"Alındı","in_review":"İnceleniyor","confirmed":"Onaylandı","rejected":"Reddedildi"}}';
begin
  if not public.is_admin() then raise exception 'forbidden'; end if;
  select * into r from public.service_requests where id = p_id;
  if r.id is null then raise exception 'not_found'; end if;
  if r.status = p_status and coalesce(trim(p_message), '') = '' then return; end if;
  update public.service_requests set status = p_status, status_message = nullif(trim(p_message), ''), updated_at = now() where id = p_id;
  insert into public.request_events (request_id, status, message) values (p_id, p_status, nullif(trim(p_message), ''));
  perform private.log_activity('request.status_changed', 'service_requests', p_id::text, jsonb_build_object('reference', r.reference, 'status', p_status));
  insert into public.notifications (user_id, kind, title_en, title_tr, body_en, body_tr, link, title_es, title_pt, body_es, body_pt)
  values (r.user_id, 'request_status', 'Request ' || r.reference || ': ' || (labels -> 'en' ->> p_status::text),
          'Talep ' || r.reference || ': ' || (labels -> 'tr' ->> p_status::text), nullif(trim(p_message), ''), nullif(trim(p_message), ''), '/requests#' || r.reference,
          'Solicitud ' || r.reference || ': ' || (labels -> 'es' ->> p_status::text), 'Solicitação ' || r.reference || ': ' || (labels -> 'pt' ->> p_status::text),
          nullif(trim(p_message), ''), nullif(trim(p_message), ''));
  select email, preferred_language into u from public.profiles where id = r.user_id;
  if u.email is not null then
    l := private.lang3(u.preferred_language);
    lab := labels -> l ->> p_status::text;
    perform private.queue_raw_email(u.email, l, 'request_status',
      case l when 'es' then 'Tu solicitud ' when 'pt' then 'Sua solicitação ' else 'Your request ' end || r.reference || ': ' || lab,
      case l when 'es' then 'El estado de tu solicitud (' || r.reference || ') es ahora: ' || lab || '.'
             when 'pt' then 'O status da sua solicitação (' || r.reference || ') agora é: ' || lab || '.'
             else 'The status of your service request (' || r.reference || ') is now: ' || lab || '.' end
      || case when coalesce(trim(p_message), '') <> '' then E'\n\n' || trim(p_message) else '' end
      || E'\n\n' || private.site_url() || '/team/requests');
  end if;
end $$;
