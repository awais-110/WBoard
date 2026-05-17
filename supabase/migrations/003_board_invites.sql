-- Board invites table (for email invites and tokens)
create table public.board_invites (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  email text not null,
  token text not null,
  role text check (role in ('viewer', 'editor', 'admin')) default 'editor' not null,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted boolean default false not null,
  expires_at timestamptz default (now() + interval '30 days') not null,
  created_at timestamptz default now() not null
);

create index board_invites_board_id_idx on public.board_invites(board_id);
create index board_invites_email_idx on public.board_invites(email);

alter table public.board_invites enable row level security;

create policy "Invites: owners can manage" on public.board_invites
  for all using (public.is_board_owner(board_id, auth.uid()));

create policy "Invites: owners can read" on public.board_invites
  for select using (public.is_board_owner(board_id, auth.uid()));
