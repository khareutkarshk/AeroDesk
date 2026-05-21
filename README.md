# AeroDesk Flight Management

Production-style SaaS MVP for the internship assignment: flight search, seat selection, booking, reschedule, cancellation, Supabase Auth, Zustand persistence, and PWA support.

## Stack

- Next.js 14 App Router, TypeScript, Tailwind CSS
- Supabase Postgres/Auth/Realtime
- Zustand persist middleware
- Zod, React Hook Form, shadcn-compatible Radix primitives
- next-pwa, Lucide icons

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Supabase:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your_personal_access_token
export SUPABASE_PROJECT_REF=your_project_ref
supabase link --project-ref <project-ref>
supabase db push
supabase db reset
```

With pnpm scripts:

```bash
set -a && source .env.local && set +a
pnpm db:link
pnpm db:push
pnpm db:seed
```

`SUPABASE_ACCESS_TOKEN` must be a Supabase personal access token from Account Settings, not the project anon key.

Required env:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://your-production-domain.vercel.app
SUPABASE_ACCESS_TOKEN=
SUPABASE_PROJECT_REF=
```

`NEXT_PUBLIC_SITE_URL` must match your deployed origin (no trailing slash). Vercel sets `VERCEL_URL` automatically, but set `NEXT_PUBLIC_SITE_URL` when using a custom domain.

In **Supabase Dashboard → Authentication → URL configuration**:

- **Site URL**: your production URL (e.g. `https://aero-desk-eight.vercel.app`)
- **Redirect URLs**: add both production and local callback URLs:
  - `https://aero-desk-eight.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Create a test user in Supabase Auth:

```txt
email: demo@aerodesk.dev
password: password123
```

Then sign in from `/login`.

## Architecture

```txt
app/                 Route groups and server-rendered pages
components/ui/       Reusable shadcn-compatible primitives
components/shared/   Cross-feature UI
features/flights/    Search/results server reads and components
features/seats/      Seat map and realtime client UI
features/bookings/   Booking actions, management UI
features/auth/       Auth server helpers
lib/supabase/        Browser/server clients
lib/validators/      Zod schemas
stores/              Zustand workflow/session stores
types/               Generated-style database types
supabase/            Migrations and seed data
```

## Database Design

`supabase/migrations/001_initial_schema.sql` creates:

- `flights`, `seats`, `bookings`, `passengers`, `reschedules`
- enums for flight, booking, and seat status
- indexes for search, seat maps, booking lists, and reschedules
- RLS on every table
- `reserve_seat` RPC with row locks for race-free booking
- `cancel_booking` RPC with atomic seat release
- `reschedule_booking` RPC with same-route enforcement and fee calculation
- trigger-enforced 2-hour cancellation restriction
- realtime publication for `seats`

`supabase/seed.sql` inserts 8 flights across 4 routes and a complete 24-row, 6-seat cabin per flight.

## Zustand

`useFlightStore` persists non-sensitive booking progress: search query, selected flight, selected seat, current step, and passenger draft excluding passport number.

`useUserStore` persists only the session token. Cached bookings stay in memory so private booking history does not become durable browser data.

Both stores expose reset actions for logout, cancellation, and completed booking flows.

## PWA

`next-pwa` is configured for:

- `StaleWhileRevalidate` flight search caching
- `CacheFirst` static assets
- installable manifest
- offline fallback route at `/offline`

## Implemented Routes

- `/search` search form with persisted query
- `/flights` server-filtered results from URL params
- `/checkout` realtime seat map and passenger form
- `/confirmation` PNR and itinerary summary
- `/bookings` booking list, cancellation, and reschedule flow
- `/offline` PWA fallback

## Verification

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Tradeoffs

- Next is pinned to the latest resolver-selected Next 14 release to satisfy the assignment stack. The registry currently marks Next 14 deprecated for a security advisory; production deployment should move to a patched 14.x if published or to the assignment-allowed 14+ line.
- Database types are checked in manually for the initial pass. In a full Supabase workflow, regenerate with `supabase gen types typescript`.
- Test user creation is documented instead of inserted through SQL because Supabase Auth internals differ across hosted/local versions; use Auth UI or API for reliable credentials.
