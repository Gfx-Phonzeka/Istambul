-- Small hardening after the Supabase security advisor review.
alter function private.password_ok(text) set search_path = '';
revoke execute on function public.my_role(), public.is_approved(), public.is_staff(), public.is_admin(),
  public.can_view(public.content_visibility) from public, anon;
grant execute on function public.my_role(), public.is_approved(), public.is_staff(), public.is_admin(),
  public.can_view(public.content_visibility) to authenticated;
