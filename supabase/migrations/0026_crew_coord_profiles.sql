-- HB Portal · Crew Ops: coordination (non-admin) can read the production team's profiles (name, email, phone).
grant execute on function public.is_crew_coord() to authenticated;
grant execute on function public.is_crew_finance() to authenticated;
drop policy if exists "profiles: crew coordination read" on public.profiles;
create policy "profiles: crew coordination read" on public.profiles for select to authenticated
  using (role in ('production', 'editor', 'admin') and public.is_crew_coord());

-- Crew Ops staff who are not in the production team (controlling / finance) can read functions, teams and participation.
drop policy if exists "crew_functions: read" on public.crew_functions;
create policy "crew_functions: read" on public.crew_functions for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_teams: read" on public.crew_teams;
create policy "crew_teams: read" on public.crew_teams for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_team_members: read" on public.crew_team_members;
create policy "crew_team_members: read" on public.crew_team_members for select to authenticated using (public.is_team() or public.is_crew_coord());
drop policy if exists "crew_participation: read" on public.crew_participation;
create policy "crew_participation: read" on public.crew_participation for select to authenticated using (public.is_team() or public.is_crew_coord());
