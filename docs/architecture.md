# RentNowPk — Full Platform Flow

Implementation map for current App Router segments: [routes.md](./routes.md).

---

## Dashboards — auth, RBAC, and caching

- **Route protection**: Customer, vendor, and admin areas use server layouts that call `getRequiredUser(role)` in [`src/lib/auth/session.ts`](../src/lib/auth/session.ts). The proxy only refreshes the Supabase session; it does not enforce roles.
- **Per-request deduplication**: `getRequiredUser` / `getOptionalUser` share a single `React.cache()`’d load of `auth.getUser()` plus the `public.users` row, so layout and page work in one trip each.
- **Private dashboard data**: Prefer **dynamic** async Server Components for strictly user-specific lists and counts. Do not `"use cache"` another user’s data.
- **When to use `"use cache"`**: Only for read models that are explicitly scoped (e.g. tags from [`src/lib/constants/cache-tags.ts`](../src/lib/constants/cache-tags.ts) including `vendorId` / `userId`), with `cacheLife` profiles from `next.config.ts`. After writes, invalidate via `updateTag` / `revalidateTag` from Server Actions.
- **Segment loading**: `loading.tsx` under `customer/`, `vendor/`, and `admin/` shows a lightweight skeleton for the main pane while nested routes load; the sidebar stays mounted on client navigations ([`next/link`](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating) with prefetch).
- **Cache Components**: [`src/app/layout.tsx`](../src/app/layout.tsx) wraps `{children}` in `<Suspense fallback={null}>` inside the toast providers so async dashboard layouts (auth) do not hit the [blocking-route](https://nextjs.org/docs/messages/blocking-route) error during prerender.

---

## 1. Public Layer

- Landing page with search by city, current location, car type, and other filters
- SEO dynamic pages auto-generated per keyword, city, town, and vehicle name
- Each vendor has a public business profile page (fleet, ratings, city coverage — no contact details)
- Each vehicle has its own optimized listing page

---

## 2. Customer Journey

### 2.1 Auth Flow

- Customer visits site and searches or browses listings
- Clicks "Request a Booking" on a vehicle page (opens as overlay on same page)
- System checks login status
  - If logged in → proceed to booking form
  - If not logged in → show login / signup prompt
    - On signup: auto-verify (no Supabase email verification step for customers)
    - After signup, all previously filled booking details are retained — customer does not re-fill

### 2.2 Booking Request Form (overlay on vehicle page)

Fields:
- Pickup location (free text with Google Places autocomplete — free tier)
- Drop-off location (free text with Google Places autocomplete)
- From date and time
- To date and time
- Full name (auto-filled from profile after first booking)
- CNIC (auto-filled from profile after first booking, mandatory first time, saved for future)
- Drive type: With Driver or Self Drive (only options the vendor enabled for that car)
- Optional note

System actions on submission:
- Distance from pickup to drop-off is calculated in the backend
- A one-on-one chat thread is opened between customer and vendor
- Booking request appears in that chat thread with all details including calculated distance
- Vehicle calendar does not block dates yet at this stage

### 2.3 Waiting State

- Customer sees the booking request as "Pending" in their bookings page
- Customer can cancel the request before vendor accepts (no reason required at this stage)
- Multiple customers can request the same car for overlapping dates — vendor decides which to accept

### 2.4 After Vendor Accepts

- Customer is notified in chat and via push and in-app notification
- Vehicle dates are blocked on the calendar
- Booking moves to "Confirmed" state
- Customer can cancel up to 24 hours before pickup with a reason
- After booking is confirmed, contact details (phone number) are shared via booking summary email to both parties
- Google Maps location sharing is enabled in the chat thread after confirmation

### 2.5 Payment

- No in-platform payment for now
- Payment happens off-platform after the ride (cash or bank transfer)
- Platform will add Stripe, JazzCash, and EasyPaisa in a future release

### 2.6 Review

- After the ride, vendor can send a review link from the chat thread
- Customer can also leave a review independently from their booking history
- Review link never expires and stays the same URL for security
- Only customers with a confirmed and completed booking can leave a review
- One review per booking per customer
- 30-day window per vehicle between reviews from the same customer
- Review opens on a dedicated page (new tab)

---

## 3. Vendor Journey

### 3.1 Signup

- Vendor signs up with: Business Name, Email, WhatsApp Phone Number, Password
- Supabase sends email verification (standard flow)
- After verification, vendor is redirected to `/vendor/vehicles/add`
- A top banner prompts vendor to submit verification docs before vehicles go live

### 3.2 Verification (KYC)

Vendor submits:
1. CNIC number
2. Front and back CNIC images
3. Own photo (selfie)

- Vehicles are listed and visible in the vendor dashboard but hidden from the public until admin approves
- Admin approves or rejects with a short note for resubmission
- Once approved, all listed vehicles go live simultaneously (vendor-level verification, not per vehicle)
- Vendor notified via email and in-app notification on approval or rejection

### 3.3 Vehicle Listing

Each vehicle includes:
- Up to 5 images (first image is cover by default, vendor can change cover manually)
- Vehicle name, make, model, year
- City/cities where the vehicle is available for pickup (vendor can list in multiple cities; auto-fills city for subsequent listings)
- Drive type: With Driver, Self Drive, or both (vendor enables each separately and sets price for each)
- Price per day and per month for each enabled drive type
- Vehicle can be activated or deactivated at any time (deactivated vehicles hidden from site, existing confirmed bookings unaffected)

### 3.4 Availability and Calendar

- Vendor marks specific dates as unavailable directly on a calendar UI
- Vehicle still shows on the site on unavailable dates but booking requests for those dates are blocked
- Once a booking is confirmed, those dates are auto-blocked on the calendar
- If two customers request the same car for overlapping dates, vendor accepts one and the other sees those dates blocked going forward

### 3.5 Receiving and Managing Bookings

- New booking requests appear in the vendor's bookings page and in the one-on-one chat thread
- Vendor can chat with the customer, then Accept or Reject
  - Accept → dates auto-blocked, customer notified
  - Reject → customer notified with a message in chat
- If vendor tries to accept a booking that was already accepted by another vendor (or duplicate scenario), system shows a conflict message and creates a new booking for the customer to confirm

### 3.6 "Send Offer" Button (in chat)

- Both vendor and customer see a "Send Offer" button in the chat thread
- Clicking opens a popup where vendor can:
  - Select a different vehicle from their fleet
  - Set custom dates, times, and price
  - Add a note
- Customer can also initiate via the same button to request a different vehicle from that vendor's fleet (popup shows only the vendor's available vehicles for the originally requested dates)
- Customer cannot change the vendor in this flow — only the vehicle or dates

### 3.7 Review System (Vendor Side)

- Vendor can send a review link to the customer from the chat thread
- Vendor also receives a review rating from the customer that is displayed publicly on their profile and all their vehicle pages
- Vendor can reply to a customer review (50-word limit)
- Auto-review prompt is sent 1 day after the booking end date via chat and notification

---

## 4. Chat System

### 4.1 Core Features

- Real-time one-on-one chat between customer and vendor
- Admin has read-only access to all threads and can message both parties
- Thread list sidebar with search, unread badges, and booking link indicators
- Typing indicator ("Typing...")
- Single tick (sent) and double tick (seen)
- File and image upload with progress bar (max 3MB per file, 5 images per car listing)
- Audio messages (WhatsApp-style with animated waveform bar, max 2 minutes, max 3MB)
- Emoji reactions
- Inline message edit and soft delete
- Auto-scroll with unread count button
- Date separators and grouped consecutive messages
- Auto-resize textarea
- Filterable thread list with booking status pills

### 4.2 Notifications in Chat

- Sound tone plays on every new message (same tone for all users)
- Unread count badge resets after messages are read or seen
- Push notifications and in-app notifications for all new messages
- Push permission requested on first visit, then re-requested every 2 days if not granted

### 4.3 Contact Info Detection (Pre-Booking Only)

- Regex scanner runs on every message sent before the vendor accepts the booking
- Detects: phone numbers (03..., +92..., numeric variations), email addresses, messaging app references, social handles
- On detection:
  - Message is silently blocked (never delivered to recipient)
  - Warning shown in sender's chat UI
  - Admin notified via notification (thread marked red in admin view)
  - Email warning sent to the sender only
  - Admin makes manual decision on further action
- Audio messages are exempt from contact detection
- After booking is confirmed, this check is completely off for that thread
- Phone numbers are shared in the booking confirmation email to both parties after acceptance

### 4.4 Google Maps Location Sharing

- Enabled in chat only after booking is confirmed
- Shared as a URL that opens in Google Maps external app
- Both customer and vendor can share their live location

---

## 5. Notification System

- Push notifications and in-app notifications (unified system)
- Sound tone on every new message for all user types
- Notifications sent for:
  - New booking request (vendor)
  - Booking accepted / rejected (customer)
  - Booking cancelled (both)
  - New chat message (both)
  - Admin action on verification (vendor)
  - Contact info detection alert (admin)
  - Review request (customer, 1 day after ride)
- Unread count disappears after messages are read

---

## 6. Email System (Brevo via help@rentnowpk.com)

Professional email templates sent for:

| Trigger | Recipient |
|---|---|
| Vendor signup | Vendor (Supabase auto-sends verification) |
| Vendor verification approved | Vendor |
| Vendor verification rejected | Vendor (with reason note) |
| Booking confirmed | Both customer and vendor (includes phone numbers) |
| Booking cancelled | Both customer and vendor |
| Contact info shared before booking | Sender only (firm warning) |

---

## 7. Admin Panel

### 7.1 Vendor Verification Queue

- Admin reviews submitted docs: CNIC number, CNIC images, selfie
- Approves → all vendor vehicles go live, vendor notified via email and notification
- Rejects → sends rejection email with a short reason note for resubmission
- Admin can enable or disable any vendor account at any time (hidden from site, existing confirmed bookings unaffected)
- Admin can edit vendor details

### 7.2 Booking and Dispute Management

- Admin can view all bookings and their statuses
- Admin has read-only access to all chat threads
- Admin can message any vendor or customer directly in chat and via email

### 7.3 Contact Detection Queue

- Flagged chat threads are marked red in admin view
- Admin receives notification for each flag
- Admin manually reviews and decides to clear or take action

### 7.4 Dashboard Stats

- Total vendors (active / pending / suspended)
- Total customers
- Total bookings (confirmed / cancelled / pending)
- New signups today
- New vehicles listed today
- Leakage flags today

### 7.5 SEO Management

- Admin adds keywords, cities, and towns from dashboard
- Pages are auto-generated and immediately indexable in Google for:
  - `/keyword`
  - `/keyword/city`
  - `/keyword/city/town`
  - `/keyword/city/vehicle-name`
- Content auto-adjusts based on URL parameters (keyword, city, town, car name)
- Vehicle year included in auto-generated content where available
- 301 redirects on slug changes
- Custom 404 page with vehicle search functionality (no dead ends)
- Vendor business pages with optimized URLs
- Individual vehicle pages: `/business-name/city/vehicle-name`
- Fully auto-generated SEO-friendly descriptions per page

---

## 8. SEO Page Content Plan

Each dynamic template uses the following content slots:

| Slot | Source |
|---|---|
| H1 | Keyword + City/Town |
| Meta title | Keyword + City + "RentNowPk" |
| Meta description | Auto-generated from keyword, city, available cars |
| Body intro | Dynamic paragraph mentioning keyword, city, service type |
| Vehicle listings | Filtered by city and availability |
| FAQ section | Pre-templated questions with city/keyword variables |
| Schema markup | LocalBusiness + Product structured data |

---

## 9. Auth Summary

| User Type | Method |
|---|---|
| Customer | Email + Password or Google |
| Vendor | Email + Password (Supabase verification email) |
| Admin | Single admin account (manual setup) |

---

## 10. Tech Notes

- Mobile apps will be built with Expo using the same Supabase database
- Payment gateway (Stripe, JazzCash, EasyPaisa) to be added in a future release
- All vehicle slugs are auto-generated and not manually changeable
- Offline-to-online sync handled via Supabase Realtime for chat 