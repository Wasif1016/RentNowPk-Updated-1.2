# App routes (RentNowPk)

Route groups in parentheses **do not** appear in the URL.

## Public — `src/app/(public)/`

| URL                            | File                                          |
| ------------------------------ | --------------------------------------------- |
| `/`                            | `(public)/page.tsx`                           |
| `/search`                      | `(public)/search/page.tsx`                    |
| `/for-vendors`                 | `(public)/for-vendors/page.tsx`               |
| `/{vendorSlug}/{vehicleSlug}` | `(public)/[vendorSlug]/[vehicleSlug]/page.tsx` |

Search supports `pickupPlaceId`, `dropoffPlaceId`, `radiusKm` (see [`public-search` validation](../src/lib/validation/public-search.ts)). Public vehicle URLs use `vendor_profiles.public_slug` and `vehicles.slug`.

Uses `(public)/layout.tsx` (marketing header/footer).

## Auth — `src/app/auth/`

| URL              | File                     | Notes                                        |
| ---------------- | ------------------------ | -------------------------------------------- |
| `/auth/login`          | `auth/login/page.tsx`                | Email/password + Google; optional `next` (allowed public + dashboard paths) |
| `/auth/signup`         | `auth/signup/page.tsx`             | Vendor registration (Supabase + trigger)                                |
| `/auth/signup-customer`| `auth/signup-customer/page.tsx`    | Customer registration; optional `next`                                    |
| `/auth/callback`       | `auth/callback/route.ts`            | PKCE / email-link `code` exchange + `next` redirect                         |

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

| URL              | Notes                                              |
| ---------------- | -------------------------------------------------- |
| `/admin`         | Dashboard (`admin/page.tsx`)                       |
| `/admin/vendors` | Vendor list, verification review (`admin/vendors/page.tsx`) |

## API

| URL            | Purpose         |
| -------------- | --------------- |
| `/api/inngest` | Inngest webhook |

## Auth redirects

Unauthenticated users are sent to [`/auth/login`](../src/app/auth/login/page.tsx). Missing `public.users` row (e.g. trigger failure): `/auth/login?error=setup_incomplete`.

Post-login `next` and OAuth callback `next` are validated with [`sanitizeNextPath`](../src/lib/auth/safe-next.ts) (dashboard routes, `/`, `/search`, `/for-vendors`, `/auth/*`, and two-segment public vehicle URLs).

`getRequiredUser()` in [`src/lib/auth/session.ts`](../src/lib/auth/session.ts) sends users to the correct home by role:

- `CUSTOMER` → `/customer`
- `VENDOR` → `/vendor`
- `ADMIN` → `/admin`

## Proxy

[`src/proxy.ts`](../src/proxy.ts) only runs Supabase `updateSession()` (no route ACL). Session refresh + layout guards handle access.
