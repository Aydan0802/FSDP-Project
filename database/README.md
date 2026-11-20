# Verify the Caller: the database (Supabase)

The database holds **sign-in**: an ID and a scrambled (hashed) password, for customers and for bank staff. It also holds the risk cases, scam reports and freeze requests (see [below](#risk-cases-scam-reports-and-freeze-requests-jose)). No real biometrics.

| Table | Who | Columns |
|---|---|---|
| `customer_users` | customers (demo accounts + anyone who signs up) | `id`, `user_id`, `user_password` |
| `staff_users` | bank staff (made by the bank only, no sign-up) | `id`, `user_id`, `user_password` |

`user_password` is never the real password. It is a hash that starts with `scrypt$`.

## The six demo accounts

| Side | ID | Password |
|---|---|---|
| Customer | `customer01` / `02` / `03` | `Demo#Cust01` / `02` / `03` |
| Bank staff | `staff01` / `02` / `03` | `Demo#Staff01` / `02` / `03` |

An ID only works on its own side. Five wrong passwords in a row lock that account for 5 minutes.

## Setting it up (once per Supabase project)

1. Supabase dashboard, **SQL Editor, New query**. Paste all of `supabase-setup.sql`, press **Run**. It is safe to run twice.
2. Check it worked. Run this; both rows should say `true`:
   ```sql
   select relname, relrowsecurity from pg_class where relname in ('customer_users','staff_users');
   ```
   And this; every password should start with `scrypt$16384`:
   ```sql
   select user_id, left(user_password, 12) from public.staff_users;
   ```
3. In the `server` folder, copy `.env.example` to `.env` and fill in `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (dashboard, **Project Settings, API Keys**: the *secret* key, not the publishable one).
4. `npm start`. The first line should say **Sign-in uses Supabase**. Without a `.env`, the server uses the six demo accounts in memory instead (new sign-ups then vanish when the server stops).

**Never commit `.env`.** The secret key can read and change every table. It is already in `.gitignore`.

## Sign up

Customers can make an account at `#login/signup`. The server checks the rules (ID 4 to 30 characters, password at least 8, not too common, not containing the ID), hashes the password, and inserts a row into `customer_users`. IDs starting with `admin`, `staff`, `root`, `ocbc`, `bank`, `demo` or `system` are kept back. One computer can make 10 accounts an hour.

Staff accounts are **not** open to sign-up, otherwise anyone could open the staff pages.

## Adding a staff account (or changing a password)

```
cd server
node scripts/hash-password.js "the new password"
```
Then in the SQL Editor:
```sql
insert into public.staff_users (user_id, user_password) values ('staff04', 'PASTE-THE-HASH-HERE');
-- or: update public.staff_users set user_password = 'PASTE-THE-HASH-HERE' where user_id = 'staff01';
```
IDs must be lowercase.

## Sharing the database with the team

The data lives in Supabase's cloud, so everyone can use the **same** database. Nothing is stored on anyone's computer.

1. **Give teammates the dashboard (optional):** Supabase, **Organization settings, Team, Invite**. They can then see the tables and run SQL.
2. **Give teammates the connection details (needed to run the server):** send the `SUPABASE_URL` and `SUPABASE_SECRET_KEY` privately (a direct message, not the repo, not the group's public channel). Each teammate creates their own `server/.env` from `.env.example` and pastes both in.
3. Everyone who runs the server with that `.env` now signs in against the same accounts. An account made by one person works for all.
4. A teammate with no `.env` still works: the server falls back to the six demo accounts in memory.

If the key leaks (for example, committed by mistake): Supabase, **Project Settings, API Keys**, create a new secret key, delete the old one, and tell the team to update their `.env`.

## Risk cases, scam reports and freeze requests (Jose)

Three more tables, so these features work for real instead of only in the demo. Same rules as the sign-in tables: Row Level Security on, only the server's secret key can use them.

| Table | Filled by | Read by | Shown as |
|---|---|---|---|
| `risk_cases` | Check a transfer, when the result is High | Staff console | `TR-0001` |
| `scam_reports` | Report a scam | Staff › Reports & freezes | `SR-0001` |
| `freeze_requests` | Freeze my accounts | Staff › Reports & freezes | `FR-0001` |

Set them up once: **SQL Editor, New query**, paste all of `jose-tables.sql`, **Run**. The last line should show three rows, all `true`. The server uses the same `SUPABASE_URL` and `SUPABASE_SECRET_KEY`; `npm start` then says **Cases, reports and freezes are saved in Supabase**. Without them, these are kept in memory and vanish when the server stops.

On Vercel, the same two values must be set in the project's **Environment Variables**, or the live site keeps them in memory (and on Vercel, memory is wiped often).

## Troubleshooting

| What you see | Usually means |
|---|---|
| "Sign in is not working right now" | The server couldn't reach Supabase. Read the terminal for the real error. |
| `Supabase answered 401` / `403` | Wrong or missing `SUPABASE_SECRET_KEY`. |
| `Supabase answered 404` | The table name is wrong, or the `public` schema isn't exposed in Data API settings. |
| Everything suddenly fails after a quiet week | Free projects pause after about a week of inactivity. Open the dashboard and press **Restore**. |
