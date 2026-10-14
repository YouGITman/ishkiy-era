-- Tester survey table. Paste into Supabase -> SQL Editor -> New query -> Run,
-- once. Separate from schema.sql because that file has already been run on the
-- live project and its policies would clash on a second run.

-- ============ tester feedback: the in-app survey (tester version) ============
-- Testers write; only the admin reads. Remove with the survey at full launch.
create table if not exists tester_feedback (
  id uuid primary key default gen_random_uuid(),
  sid text,
  plan text,
  answers jsonb not null,
  email text,
  v text,
  created_at timestamptz not null default now()
);
alter table tester_feedback enable row level security;

create policy "testers send" on tester_feedback for insert
  with check (true);
create policy "admin reads feedback" on tester_feedback for select
  using ((auth.jwt() ->> 'email') = 'tarang@ishkiy.com');
