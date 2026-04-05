# Environment variables

Never commit real secrets. Copy values into `.env` locally and configure the same keys in Vercel (or your host).

## Required for the app

| Variable                        | Purpose                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Postgres connection string. Prefer the Supabase **pooler** URL (port `6543`) for the app. The Drizzle client sets `prepare: false` in code because PgBouncer transaction mode does not support prepared statements. Use a **direct** URL (port `5432`) for `drizzle-kit` if you hit migration issues. |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL.                                                                                                                                                                                                                                                                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe).                                                                                                                                                                                                                                                                     |

## Logo.dev (vehicle make logo)

When vendors save a vehicle, the app stores the **Logo.dev image URL** in `make_logo_url` on `vehicles` (no extra image hosting). Cards use that URL in `<img>` / `next/image`.

| Variable                               | Purpose                                                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY` | Same publishable key from [Logo.dev](https://www.logo.dev/). Exposed to the browser so the make **dropdown** can render logos without calling your API per row. |
| `LOGO_DEV_PUBLISHABLE_KEY`             | Optional fallback (server only). If you only set `NEXT_PUBLIC_…`, that is enough for both server and client.                                                    |

If unset, vehicles are created without a stored make logo, and the make combobox falls back to initials.

## Cloudinary (vendor verification & vehicle photos)

Server-side uploads only. Same credentials for both flows.

| Variable                | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `CLOUDINARY_CLOUD_NAME` | Cloud name from the Cloudinary dashboard. |
| `CLOUDINARY_API_KEY`    | API key.                                  |
| `CLOUDINARY_API_SECRET` | API secret (server only).                 |

Folders:

- Vendor KYC: `rentnowpk/vendor-verification/{vendorProfileId}/`
- Vehicle listing images: `rentnowpk/vehicles/{vehicleId}/`

## Google Maps Platform

Use **two API keys** in Google Cloud (different restrictions):

| Variable                          | Purpose                                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser: Maps JavaScript API, Places (Autocomplete / map). Restrict by **HTTP referrer** to your domains.                              |
| `GOOGLE_MAPS_SERVER_KEY`          | Server only: Place Details, Geocoding, Directions. Restrict by **IP** (e.g. Vercel) or restrict APIs only; never expose to the client. |

Enable at minimum: **Maps JavaScript API**, **Places API**, **Geocoding API**, **Directions API** (per feature usage).

Never log full API responses containing user addresses in production.
