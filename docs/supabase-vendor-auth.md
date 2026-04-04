# Supabase: vendor auth setup

## Dashboard settings

1. **Authentication → URL configuration**
   - **Site URL:** your production URL (e.g. `https://rentnowpk.com`) and for local dev add `http://localhost:3000`.
   - **Redirect URLs:** include:
     - `http://localhost:3000/auth/callback`
     - `https://<your-domain>/auth/callback`
   - Match `NEXT_PUBLIC_APP_URL` in `.env` (no trailing slash).

2. **Authentication → Providers → Email**
   - Enable **Confirm email** for vendors (architecture: Supabase sends verification email).

3. **SQL: trigger**
   - Run [`supabase/triggers/handle_new_user.sql`](../supabase/triggers/handle_new_user.sql) in the Supabase SQL Editor once.
   - This creates `public.users` (including `phone`) and `vendor_profiles` when a row is inserted into `auth.users`, using `raw_user_meta_data` from `signUp`: `role`, `business_name`, `whatsapp_phone`, `phone` (E.164), `full_name`, `display_name`, and `name` (business name for Supabase Auth UI and `users.full_name`).

## Environment

- `NEXT_PUBLIC_APP_URL` — used for `emailRedirectTo` (e.g. `http://localhost:3000`).
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — required.

## Behaviour notes

- **Email confirmation:** If enabled, `signUp` may return no session until the user clicks the link; the app shows “Check your email”. After confirmation, Supabase redirects to `/auth/callback?next=...&code=...`.
- **Missing DB row:** If the trigger fails, `getRequiredUser` will not find a `public.users` row; the user is redirected to `/auth/login` with an error state (see session helper).
