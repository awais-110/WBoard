-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Boards table
create table public.boards (
  id uuid default uuid_generate_v4() primary key,
  title text not null default 'Untitled Board',
  owner_id uuid references public.profiles(id) on delete cascade not null,
  canvas_data jsonb default '{}' not null,
  thumbnail_url text,
  is_public boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Board collaborators (many-to-many)
create table public.board_members (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('viewer', 'editor', 'admin')) default 'editor' not null,
  invited_at timestamptz default now() not null,
  unique (board_id, user_id)
);

-- Canvas events log (for real-time sync delta)
create table public.canvas_events (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz default now() not null
);

-- Create indexes for performance
create index boards_owner_id_idx on public.boards(owner_id);
create index board_members_board_id_idx on public.board_members(board_id);
create index board_members_user_id_idx on public.board_members(user_id);
create index canvas_events_board_id_idx on public.canvas_events(board_id);
create index canvas_events_created_at_idx on public.canvas_events(created_at);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boards_updated_at
  before update on public.boards
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.canvas_events enable row level security;

-- Helper functions avoid recursive RLS checks between boards and board_members.
create or replace function public.is_board_owner(target_board_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.boards
    where id = target_board_id and owner_id = target_user_id
  );
$$;

create or replace function public.is_board_member(target_board_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.board_members
    where board_id = target_board_id and user_id = target_user_id
  );
$$;

create or replace function public.can_edit_board(target_board_id uuid, target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_board_owner(target_board_id, target_user_id)
    or exists (
      select 1 from public.board_members
      where board_id = target_board_id
        and user_id = target_user_id
        and role in ('editor', 'admin')
    );
$$;

-- Profiles: users can read all, update only own
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Boards: owner + members can access
create policy "Board owners can do everything" on public.boards
  for all using (auth.uid() = owner_id);

create policy "Public boards are viewable by all" on public.boards
  for select using (is_public = true);

create policy "Board members can view" on public.boards
  for select using (public.is_board_member(id, auth.uid()));

create policy "Board editors can update" on public.boards
  for update using (public.can_edit_board(id, auth.uid()));

-- Board members
create policy "Members can view board members" on public.board_members
  for select using (
    auth.uid() = user_id or
    public.is_board_owner(board_id, auth.uid())
  );

create policy "Board owner can manage members" on public.board_members
  for all using (public.is_board_owner(board_id, auth.uid()));

-- Canvas events: board members only
create policy "Board members can read events" on public.canvas_events
  for select using (
    public.is_board_owner(board_id, auth.uid()) or
    public.is_board_member(board_id, auth.uid())
  );

create policy "Board members can insert events" on public.canvas_events
  for insert with check (
    auth.uid() = user_id and
    public.can_edit_board(board_id, auth.uid())
  );

-- Enable Realtime on canvas_events and boards
alter publication supabase_realtime add table public.canvas_events;
alter publication supabase_realtime add table public.board_members;
