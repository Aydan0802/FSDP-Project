-- Verify the Caller: Supabase setup for sign-in.
-- Where: Supabase dashboard > SQL Editor > New query. Paste ALL of this, press Run.
-- It is safe to run more than once. It changes nothing you've typed into the tables by hand.
--
-- Your tables customer_users and staff_users each have: id (int8), user_id (varchar), user_password (varchar).
-- This script does three things to them:
--   1. LOCKS them (Row Level Security), so nobody can read them through Supabase's public API.
--      Only our own server, using the SECRET key, can read them.
--   2. Makes every user_id unique and lowercase (the server looks IDs up in lowercase).
--   3. Adds the demo accounts: 3 customers and 3 staff.
--
-- IMPORTANT: user_password holds a HASH (a scrambled version), never the real password.
-- The demo passwords are listed below. Never type a real password into this project.
--   customer01 / Demo#Cust01    staff01 / Demo#Staff01
--   customer02 / Demo#Cust02    staff02 / Demo#Staff02
--   customer03 / Demo#Cust03    staff03 / Demo#Staff03

-- 1. Lock the tables. With Row Level Security ON and no policies, the public (anon) key sees nothing.
--    The server's secret key skips these rules, so sign-in still works.
alter table public.customer_users enable row level security;
alter table public.staff_users enable row level security;

-- 2. Rules for the IDs
create unique index if not exists customer_users_user_id_key on public.customer_users (user_id);
create unique index if not exists staff_users_user_id_key on public.staff_users (user_id);

alter table public.customer_users drop constraint if exists customer_users_user_id_lowercase;
alter table public.customer_users add constraint customer_users_user_id_lowercase check (user_id = lower(user_id));
alter table public.staff_users drop constraint if exists staff_users_user_id_lowercase;
alter table public.staff_users add constraint staff_users_user_id_lowercase check (user_id = lower(user_id));

-- 3. The demo accounts (id is filled in by Supabase). Accounts that already exist are skipped.
insert into public.customer_users (user_id, user_password) values
  ('customer01', 'scrypt$16384$8$1$29a96387a24eed0ce8ea2a976878dfa2$6aa48225d25673ae62f1776f7da392cce4b5abaa7d890a3394d18ceb565b1b0d745f1a124519b2499e0a1dc9ca5084c2ef4480d00602a9bfe4aed68bb3dfe438'),
  ('customer02', 'scrypt$16384$8$1$85fb1ad9c333c95bdf8f62cc27f3b6db$823cee9981171c2f1ca08234cd9b655a60a108bc95b2a165ae3a8bb27b7952c4f8064224d0cbb835e1a502d8dc6240f93272278fea47bea947c2ad7ec8f5625e'),
  ('customer03', 'scrypt$16384$8$1$587837dac0a3f05eb084e45e3e7526fc$92eb827a91a464938e7c4c065337f20c4e2080fb73b30a3b15973de4e3d4ebb3ca214b4701f8dd599f576acae760a2e8b2188864d1390c1521c78ed23f845a7c')
on conflict (user_id) do nothing;

insert into public.staff_users (user_id, user_password) values
  ('staff01', 'scrypt$16384$8$1$0fb545f33d54366c533971b5010a69e4$0614d4c7db28e68c149b0ccfe24936425da119dfbb2f7e98d39e62e0f49ebda96d4b45d24d4ace908c79ccfe819237258483fba54f9de7e2e2cd222334bdee48'),
  ('staff02', 'scrypt$16384$8$1$e575ac019649fe012b5708fb1a352baf$8fe452a3e7eafe1f3fea307ddddb3eeefb0b75947eaf8c20a71728de4769c9037ed7ff1915d03d7c64f7e25322b97a0fbb42877590c4443f6ccdbdc3a6ae5c08'),
  ('staff03', 'scrypt$16384$8$1$4207815ef18837cd4d3ffe354fafc52a$8322a9e677c3b1a6d477bdba2a2d351bbc5d3f274278678b953ad1b591b6923f68b0afc6eb54c212eb954aada1ee2afca66c0ca05c543d8420c0eeabfbbb3938')
on conflict (user_id) do nothing;

-- Check: you should see 3 rows in each, and the passwords should start with scrypt$
select 'customer_users' as table_name, id, user_id, left(user_password, 12) as password_starts from public.customer_users
union all
select 'staff_users', id, user_id, left(user_password, 12) from public.staff_users
order by 1, 2;
