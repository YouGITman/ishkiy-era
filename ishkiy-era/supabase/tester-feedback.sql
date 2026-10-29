-- Tester survey table. Paste into Supabase -> SQL Editor -> New query -> Run.
-- Safe to run more than once: it creates what's missing and resets the
-- policies and permissions to what the app needs.
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

drop policy if exists "testers send" on tester_feedback;
drop policy if exists "admin reads feedback" on tester_feedback;
create policy "testers send" on tester_feedback for insert
  to anon, authenticated
  with check (true);
create policy "admin reads feedback" on tester_feedback for select
  to authenticated
  using ((auth.jwt() ->> 'email') = 'tarang@ishkiy.com');

-- Newer Supabase projects don't grant table access to the app's public key by
-- default, so say it outright: the app may add rows, and nothing else.
grant usage on schema public to anon, authenticated;
grant insert on tester_feedback to anon, authenticated;
grant select on tester_feedback to authenticated;
