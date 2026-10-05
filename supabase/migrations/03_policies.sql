-- Stage 08: project isolation. Never use a service-role key in the application.
begin;
create policy projects_select on public.projects for select to authenticated using (auth.uid() = user_id);
create policy projects_insert on public.projects for insert to authenticated with check (auth.uid() = user_id);
create policy projects_update on public.projects for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy projects_delete on public.projects for delete to authenticated using (auth.uid() = user_id);
revoke all on public.profiles, public.projects from anon;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
commit;
