-- Admin access is granted only by the project owner in SQL Editor.
begin;
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role = 'admin')
);
alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

create function public.is_signal_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'admin');
$$;
revoke all on function public.is_signal_admin() from public;
grant execute on function public.is_signal_admin() to authenticated;

create policy profiles_admin_read on public.profiles for select to authenticated using (public.is_signal_admin());
create policy projects_admin_read on public.projects for select to authenticated using (public.is_signal_admin());

create table public.app_settings (
  id integer primary key check (id = 1),
  announcement_ru text not null default '' check (length(announcement_ru) <= 300),
  announcement_en text not null default '' check (length(announcement_en) <= 300),
  version integer not null default 1 check (version > 0)
);
insert into public.app_settings(id) values (1);
alter table public.app_settings enable row level security;
create policy settings_read on public.app_settings for select to anon, authenticated using (true);
create policy settings_admin_update on public.app_settings for update to authenticated using (public.is_signal_admin()) with check (public.is_signal_admin());
grant select on public.app_settings to anon, authenticated;
grant update (announcement_ru, announcement_en, version) on public.app_settings to authenticated;

create table public.admin_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_events enable row level security;
create policy events_admin_read on public.admin_events for select to authenticated using (public.is_signal_admin());
grant select on public.admin_events to authenticated;
create function public.audit_settings_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.admin_events(actor_id, action) values (auth.uid(), 'announcement_updated');
  return new;
end;
$$;
revoke all on function public.audit_settings_change() from public;
create trigger settings_audit after update on public.app_settings for each row execute function public.audit_settings_change();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name) values (new.id, left(coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''), 100));
  return new;
end;
$$;
commit;
