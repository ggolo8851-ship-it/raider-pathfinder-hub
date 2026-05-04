create table public.page_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  path text not null,
  visited_at timestamptz not null default now()
);
alter table public.page_visits enable row level security;
create policy "users insert own visits" on public.page_visits
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "admins read visits" on public.page_visits
  for select using (has_role(auth.uid(),'admin'));
create index page_visits_visited_at_idx on public.page_visits(visited_at desc);