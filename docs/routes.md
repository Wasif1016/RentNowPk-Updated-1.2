# App routes (RentNowPk)

Route groups in parentheses **do not** appear in the URL.

## Public — `src/app/(public)/`

| URL            | File                            |
| -------------- | ------------------------------- |
| `/`            | `(public)/page.tsx`             |
| `/search`      | `(public)/search/page.tsx`      |
| `/for-vendors` | `(public)/for-vendors/page.tsx` |

Uses `(public)/layout.tsx` (marketing header/footer).

## Auth — `src/app/auth/`

| URL              | File                     | Notes                                        |
| ---------------- | ------------------------ | -------------------------------------------- |
| `/auth/login`    | `auth/login/page.tsx`    | Email/password; optional `next` query        |
| `/auth/signup`   | `auth/signup/page.tsx`   | Vendor registration (Supabase + trigger)     |
| `/auth/callback` | `auth/callback/route.ts` | PKCE / email-link `code` exchange + redirect |

Minimal `auth/layout.tsx` (centered card, no marketing chrome).

## Customer — `src/app/customer/`

Requires auth + `CUSTOMER` role (`customer/layout.tsx`).

| URL                  | Notes                           |
| -------------------- | ------------------------------- |
| `/customer`          | Dashboard (`customer/page.tsx`) |
| `/customer/bookings` | Add when built                  |
| `/customer/settings` | Add when built                  |

## Vendor — `src/app/vendor/`

Requires auth + `VENDOR` role (`vendor/layout.tsx`).

| URL                    | Notes                                                   |
| ---------------------- | ------------------------------------------------------- |
| `/vendor`              | Dashboard (`vendor/page.tsx`)                           |
| `/vendor/vehicles`     | Fleet list                                              |
| `/vendor/vehicles/add` | Add vehicle (architecture: post-verify redirect target) |

## Admin — `src/app/admin/`

Requires auth + `ADMIN` role (`admin/layout.tsx`).

| URL      | Notes                        |
| -------- | ---------------------------- |
| `/admin` | Dashboard (`admin/page.tsx`) |

## API

| URL            | Purpose         |
| -------------- | --------------- |
| `/api/inngest` | Inngest webhook |

## Auth redirects

Unauthenticated users are sent to [`/auth/login`](../src/app/auth/login/page.tsx). Missing `public.users` row (e.g. trigger failure): `/auth/login?error=setup_incomplete`.

`getRequiredUser()` in [`src/lib/auth/session.ts`](../src/lib/auth/session.ts) sends users to the correct home by role:

- `CUSTOMER` → `/customer`
- `VENDOR` → `/vendor`
- `ADMIN` → `/admin`

## Proxy

[`src/proxy.ts`](../src/proxy.ts) only runs Supabase `updateSession()` (no route ACL). Session refresh + layout guards handle access.
