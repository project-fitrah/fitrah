create table if not exists recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  raw_text text not null,
  structured_text text,
  status text not null default 'raw',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table recordings enable row level security;

create policy "Users can only access their own recordings"
on recordings for all
using (auth.uid() = user_id);
