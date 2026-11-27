-- HB Portal · Production team joins by invitation: remember when each person was invited (set whenever an invitation email is queued).
alter table public.profiles add column if not exists invited_at timestamptz;

create or replace function private.mark_invited() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.template = 'team_invite' then
    perform set_config('app.bypass_profile_guard', 'on', true);
    update public.profiles set invited_at = now() where lower(email) = lower(new.to_email);
  end if;
  return new;
end $$;
drop trigger if exists email_outbox_mark_invited on public.email_outbox;
create trigger email_outbox_mark_invited after insert on public.email_outbox for each row execute function private.mark_invited();

-- Already invited before this change
update public.profiles p set invited_at = o.created_at
from (select lower(to_email) e, max(created_at) created_at from public.email_outbox where template = 'team_invite' group by 1) o
where lower(p.email) = o.e and p.invited_at is null;
