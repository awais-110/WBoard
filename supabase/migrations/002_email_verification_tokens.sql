create extension if not exists "uuid-ossp";

create table if not exists public.email_verification_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  email text not null,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default now() not null
);

create index if not exists email_verification_tokens_token_idx
  on public.email_verification_tokens(token);

create index if not exists email_verification_tokens_user_id_idx
  on public.email_verification_tokens(user_id);

alter table public.email_verification_tokens enable row level security;
