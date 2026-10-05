-- Stage 11: support per-user project lists and reliable update timestamps.
begin;
create index projects_user_created_idx on public.projects(user_id, created_at desc);
create function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger projects_updated_at before update on public.projects for each row execute function public.touch_updated_at();
commit;
