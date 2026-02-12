# CLAUDE.md

## Project Overview

Calendez is a self-hosted Calendly alternative built with Next.js 15, deployed on Vercel. It lets visitors book time on the owner's Google Calendar through a clean booking interface. No database required — Google Calendar stores the bookings, Upstash Redis stores the configuration.

## Architecture

- **Framework**: Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui
- **Auth**: Auth.js v5 with Google OAuth (calendar scopes for freebusy + events)
- **Config storage**: Upstash Redis (free tier) — editable via admin UI at `/admin`
- **Calendar API**: `@googleapis/calendar` — FreeBusy for availability, events.insert for bookings
- **No database** — Google Calendar IS the booking database

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | Auth.js v5 config with Google provider, JWT token refresh |
| `src/lib/availability.ts` | Core slot computation algorithm |
| `src/lib/google-calendar.ts` | Google Calendar API wrapper (FreeBusy + event creation) |
| `src/lib/config.ts` | Read/write config from Upstash Redis with defaults fallback |
| `src/lib/timezone.ts` | Timezone conversion utilities using @date-fns/tz |
| `src/lib/validators.ts` | Zod schemas for config and booking validation |
| `src/lib/types.ts` | TypeScript interfaces for config, events, slots |
| `src/app/page.tsx` | Landing page — shows event type cards |
| `src/app/book/[slug]/page.tsx` | Booking page for a specific event type |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/app/api/availability/route.ts` | GET: returns available time slots |
| `src/app/api/book/route.ts` | POST: creates Google Calendar event |
| `src/app/api/admin/config/route.ts` | GET/PUT: admin config CRUD |
| `calendez.config.defaults.ts` | Default config (seeds Redis on first run) |

## Routes

- `/` — Public: event type selection
- `/book/[slug]` — Public: booking page with calendar + time slots
- `/book/[slug]/confirmed` — Public: booking confirmation
- `/admin` — Protected: admin dashboard (requires OWNER_EMAIL match)
- `GET /api/availability?event=slug&date=YYYY-MM-DD&tz=IANA_TZ` — Available slots
- `POST /api/book` — Create booking
- `GET /api/config` — Public config (event types, owner name, branding)
- `GET/PUT /api/admin/config` — Full config (admin-only)

## Setup Instructions for New Deployments

### Prerequisites
- Node.js 18+, Google account, Vercel account

### Google Cloud Console Setup
1. Create project at console.cloud.google.com
2. Enable Google Calendar API (APIs & Services > Library)
3. Create OAuth 2.0 credentials (Web application type)
4. Authorized redirect URI: `{DOMAIN}/api/auth/callback/google`
5. Configure OAuth consent screen (External, add owner as test user)
6. Copy Client ID and Client Secret

### Environment Variables

```
GOOGLE_CLIENT_ID=     # From Google Cloud Console
GOOGLE_CLIENT_SECRET= # From Google Cloud Console
AUTH_SECRET=          # Generate: openssl rand -base64 32
OWNER_EMAIL=          # Google email for admin access
KV_REST_API_URL=      # From Vercel Storage / Upstash dashboard
KV_REST_API_TOKEN=    # From Vercel Storage / Upstash dashboard
```

KV variables are optional for local dev (app falls back to `calendez.config.defaults.ts`).

### Vercel Deployment
1. Connect repo to Vercel
2. Add KV store: Vercel dashboard > Storage > Create > KV (Upstash Redis)
3. Set all env vars in Vercel > Settings > Environment Variables
4. Add production redirect URI to Google Cloud Console
5. Deploy
6. Visit `/admin`, connect Google Calendar, configure event types

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| "Access denied" on /admin | OWNER_EMAIL doesn't match signed-in Google email | Check OWNER_EMAIL env var |
| No time slots showing | Google Calendar not connected, or no working hours configured | Visit /admin, ensure Google is connected |
| Token errors after a while | Google OAuth token expired, refresh failed | Sign out and sign back in at /admin |
| KV errors locally | KV env vars not set | Set KV_REST_API_URL and KV_REST_API_TOKEN, or leave unset to use defaults |
| "Slot no longer available" on booking | Someone booked the same slot (race condition) | Expected behavior — user picks a different time |

## Commands

```bash
npm run dev   # Local development (port 3000)
npm run build # Production build
npm run lint  # ESLint
```

## Admin Auth

The admin is protected by checking `session.user.email === OWNER_EMAIL`. No separate password system. The Google OAuth login used for calendar access doubles as the admin login.
