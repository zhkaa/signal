-- Stage 05: structured content projects.
begin;
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 3 and 160),
  kind text not null check (kind in ('video', 'channel', 'stream')),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
-- Access stays closed until the policies in the next migration are installed.
commit;
