-- iSHKiY backend v1 (connect-only) — paste this whole file into
-- Supabase -> SQL Editor -> New query -> Run.
-- Admin email is set in one place below; change it if yours differs.

-- ============ living profiles: the user's cloud copy ============
create table if not exists living_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
alter table living_profiles enable row level security;

create policy "own profile read"   on living_profiles for select using (auth.uid() = user_id);
create policy "own profile write"  on living_profiles for insert with check (auth.uid() = user_id);
create policy "own profile update" on living_profiles for update using (auth.uid() = user_id);
create policy "own profile delete" on living_profiles for delete using (auth.uid() = user_id);

-- ============ practitioners: the human layer ============
create table if not exists practitioners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  discipline text not null check (discipline in ('therapist','counsellor','coach','mentor','ifa','pt','physio')),
  registration_body text,
  registration_number text,
  insurance_confirmed boolean not null default false,
  bio text,
  booking_url text,
  apps text[] not null default '{era}',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table practitioners enable row level security;

-- anyone may apply (application lands as pending; nothing else is writable)
create policy "apply" on practitioners for insert
  with check (status = 'pending');

-- the world may see approved practitioners only
create policy "directory" on practitioners for select
  using (status = 'approved');

-- the admin sees and manages everything
create policy "admin read" on practitioners for select
  using ((auth.jwt() ->> 'email') = 'tarang@ishkiy.com');
create policy "admin update" on practitioners for update
  using ((auth.jwt() ->> 'email') = 'tarang@ishkiy.com');
create policy "admin delete" on practitioners for delete
  using ((auth.jwt() ->> 'email') = 'tarang@ishkiy.com');

-- ============ share grants: the consent ledger ============
create table if not exists share_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  practitioner_id uuid not null references practitioners(id) on delete cascade,
  sections text[] not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table share_grants enable row level security;

create policy "own grants read"   on share_grants for select using (auth.uid() = user_id);
create policy "own grants write"  on share_grants for insert with check (auth.uid() = user_id);
create policy "own grants update" on share_grants for update using (auth.uid() = user_id);
