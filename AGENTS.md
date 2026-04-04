<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project-specific rules:
- Product: RentNowPk — vehicle rental marketplace (see docs/architecture.md, docs/flow.md)
- Stack: Next.js 16, Supabase, Drizzle ORM, Tailwind, shadcn/ui
- Roles in DB: CUSTOMER, VENDOR, ADMIN (not legacy homeowner/painter)
- Database schema is at src/lib/db/schema.ts
- Server Actions are in src/lib/actions/
- Auth helper is getRequiredUser() in src/lib/auth/session.ts
- cacheComponents: true is enabled — use "use cache" directive, NOT unstable_cache; root `layout.tsx` wraps `children` in `<Suspense fallback={null}>` so async dashboard layouts do not trigger blocking-route during prerender
- proxy.ts replaces middleware.ts — never create middleware.ts; it calls `updateSession()` from `src/lib/supabase/middleware.ts` (no route auth checks in proxy — use `getRequiredUser()` in layouts)
- App routes: see `docs/routes.md` (`(public)/`, `customer/`, `vendor/`, `admin/`)
- params and searchParams are always Promises — always await them
- Money fields use Decimal strings in DB — parse with parseFloat() for display only
