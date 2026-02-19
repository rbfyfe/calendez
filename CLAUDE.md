# CLAUDE.md

## If You're an AI Agent Helping Someone Set Up Calendez

Welcome! This file is your playbook. Follow the phases below to get a user from zero to a fully deployed booking page. The setup takes about 10 minutes.

### Your Approach

- **Be friendly and conversational.** Explain things in plain language. The user may not be technical.
- **Always explain before you act.** Tell the user what you're about to do and why before doing it.
- **Ask permission before browser automation.** Before opening tabs, clicking buttons, or navigating in the user's browser, explain what you'll do and ask "Ready?" or "Sound good?"
- **Prefer browser automation.** When you can do something in the browser for the user (like Google Cloud Console setup), offer to do it rather than giving them manual steps.
- **Verify each phase.** Confirm each step worked before moving to the next one.
- **Celebrate wins.** When something works, say so! "Your booking page is live!" goes a long way.

---

## Setup Phases

### Phase 0 — Greet & Assess

Before touching anything, orient the user.

**Introduce Calendez:**
> "Calendez is your own personal booking page — like Calendly, but free and self-hosted. People will be able to visit your URL, pick a time that works, and it automatically creates an event on your Google Calendar and sends them an invitation."

**Check prerequisites:**
1. "Do you have a Google account?" (Required — Google Calendar is how bookings work)
2. Check Node.js: run `node --version` — need 18+. If not installed, direct to https://nodejs.org/
3. Ask: "What's the Google email you want to use for this? (This is the calendar people will book time on.)" — this becomes `OWNER_EMAIL`

**Explain the plan:**
> "Here's what we'll do:
> 1. Install the project on your computer
> 2. Set up Google Cloud so it can access your calendar — I'll do this in your browser for you
> 3. Test it locally to make sure everything works
> 4. Deploy it to the internet when you're ready
>
> I'll handle most of the clicking and configuring. Sound good?"

---

### Phase 1 — Install

```bash
git clone https://github.com/rbfyfe/calendez.git
cd calendez
npm install
```

If the user wants to eventually deploy this (Phase 5), they should **fork** the repo first so they have their own copy:
- Help them fork at https://github.com/rbfyfe/calendez/fork
- Then clone their fork instead

**Verification:** `npm install` completes without errors. If there's a `lightningcss` native binary error, run: `npm install lightningcss-$(node -e "console.log(process.platform+'-'+process.arch)")@1.30.2`

Tell the user: *"Project installed. Next up: Google Cloud Console setup. This is the part where I'll use your browser."*

---

### Phase 2 — Google Cloud Console (Browser Automation)

This is the most complex phase. Explain it clearly before starting:

> "I'm going to open Google Cloud Console in your browser and set up the Calendar API. This means I'll be opening tabs and clicking buttons — you'll see everything I do. I'll explain each step. You just need to be signed into your Google account. Ready?"

**Pre-check:** Make sure the user is signed into Google in their browser. If not, direct them to https://accounts.google.com/ first.

#### Step 2a — Create a Google Cloud project
- Navigate to https://console.cloud.google.com/
- If the user has never used Google Cloud, they'll see a Terms of Service screen. Tell them: *"Google Cloud has a free tier — the Calendar API doesn't cost anything. You just need to accept the terms."*
- Click the project dropdown (top bar) → "New Project"
- Project name: **Calendez**
- Click "Create", wait for it to finish (~10-30 seconds)
- Select the new "Calendez" project from the dropdown

#### Step 2b — Enable Google Calendar API
- Navigate directly to: `https://console.cloud.google.com/apis/library/calendar-json.googleapis.com`
- Click "Enable"
- Wait for it to enable

#### Step 2c — Configure OAuth consent screen
- Navigate to: `https://console.cloud.google.com/apis/credentials/consent`
- Select **External** (the only option for personal Google accounts)
- Click "Create"
- Fill in:
  - **App name:** Calendez
  - **User support email:** {OWNER_EMAIL}
  - **Developer contact email:** {OWNER_EMAIL}
- Click "Save and Continue"
- **Scopes page:** Click "Add or Remove Scopes", search for and add:
  - `https://www.googleapis.com/auth/calendar.freebusy`
  - `https://www.googleapis.com/auth/calendar.events`
- Click "Update", then "Save and Continue"
- **Test users page:** Click "Add Users", add {OWNER_EMAIL}
- Click "Save and Continue", then finish/back to dashboard

#### Step 2d — Create OAuth credentials
- Navigate to: `https://console.cloud.google.com/apis/credentials`
- Click "Create Credentials" → "OAuth 2.0 Client ID" (or "OAuth client ID")
- **Application type:** Web application
- **Name:** Calendez
- **Authorized redirect URIs:** Add `http://localhost:3000/api/auth/callback/google`
- Click "Create"
- **IMPORTANT:** A modal appears with the Client ID and Client Secret. Capture both values before closing the modal. If you can't read them from the DOM, ask the user to copy-paste the Client Secret.

**Verification:** You have a Client ID (looks like `xxx.apps.googleusercontent.com`) and a Client Secret (starts with `GOCSPX-`).

Tell the user: *"Google Cloud is all set. I've got the credentials. Next I'll create your configuration file."*

---

### Phase 3 — Environment Configuration

```bash
# Generate a random secret for session encryption
openssl rand -base64 32
```

Create `.env.local` in the project root:

```env
GOOGLE_CLIENT_ID={Client ID from Phase 2}
GOOGLE_CLIENT_SECRET={Client Secret from Phase 2}
AUTH_SECRET={generated secret}
OWNER_EMAIL={user's Google email from Phase 0}
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

The `KV_` variables are intentionally left empty for local development. The app falls back to `calendez.config.defaults.ts` for default configuration (3 event types, M-F 9am-5pm working hours).

**Verification:** Read back the .env.local file (with secrets partially redacted) and confirm with the user.

Tell the user: *"Configuration done. Let's fire up the app and make sure everything works."*

---

### Phase 4 — Local Testing

1. Start the dev server in the background:
   ```bash
   npm run dev
   ```
2. Wait for "Ready" to appear in the output
3. Open `http://localhost:3000/admin` in the user's browser

The admin page will show a "Sign in with Google" button. Tell the user:

> "You'll need to sign in with Google. When the login page appears, go ahead and click through — I can't enter passwords for you, but I can handle the rest. You might see a 'Google hasn't verified this app' warning — that's normal for apps in testing mode, just click 'Continue'."

4. After sign-in, verify the admin page shows **"Connected as {email}"**
5. Navigate to `http://localhost:3000` — verify event type cards are visible
6. Click an event type, select a date, confirm time slots load

**Verification:** Time slots appear on the booking page. This proves the Google Calendar API is working and tokens are persisted correctly.

Tell the user: *"Everything works! Your booking page is live locally. Want to deploy this to the internet so anyone can use it?"*

---

### Phase 5 — Deploy to Vercel (Optional)

Only proceed if the user wants to deploy. If they just want to run locally, skip to Phase 6.

#### Step 5a — Ensure the user has their own repo
If they cloned `rbfyfe/calendez`, they need their own GitHub repo:
- Create a new repo on GitHub (can use `gh repo create` if GitHub CLI is installed)
- Push the code to their repo

#### Step 5b — Deploy via Vercel
- Ensure the user is signed into https://vercel.com
- Navigate to https://vercel.com/new in their browser
- Import their GitHub repo
- Set environment variables in the Vercel UI:
  - `GOOGLE_CLIENT_ID` — same as .env.local
  - `GOOGLE_CLIENT_SECRET` — same as .env.local
  - `AUTH_SECRET` — same as .env.local
  - `OWNER_EMAIL` — same as .env.local
- Click Deploy

#### Step 5c — Create Vercel KV store
After deployment:
- Go to the project in Vercel dashboard
- Storage → Create → KV (Upstash Redis)
- Connect it to the project (this auto-sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`)
- Redeploy for the env vars to take effect

#### Step 5d — Add production redirect URI
Go back to Google Cloud Console:
- Navigate to `https://console.cloud.google.com/apis/credentials`
- Click the "Calendez" OAuth client to edit it
- Under Authorized redirect URIs, add: `https://{vercel-domain}/api/auth/callback/google`
- Save

#### Step 5e — Connect Google Calendar on production
- Navigate to `https://{vercel-domain}/admin`
- Sign in with Google (same consent flow as local)
- Verify "Connected as {email}"
- Visit the public URL and verify the booking page works

**Verification:** The public booking page loads, event types are visible, and time slots appear when a date is selected.

Tell the user: *"You're live! Your booking page is at https://{vercel-domain}. Share this link with anyone who needs to book time with you."*

---

### Phase 6 — Customization (Optional)

Guide the user through the admin dashboard at `/admin`:
- **Event Types tab:** Add, edit, or remove event types (name, duration, description, location)
- **Availability tab:** Set working hours for each day, buffer time between meetings, max days in advance
- **Branding tab:** Change accent color, owner name, add a logo URL

The admin dashboard has a "Save Changes" button that persists config to Upstash Redis (or in-memory for local dev).

---

## Edge Cases & Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| User doesn't have Node.js | Required for local dev | Direct to https://nodejs.org/ (LTS version) |
| User doesn't have a Google account | Fundamental requirement | Explain Google Calendar integration requires it |
| Google Cloud ToS screen | First-time Google Cloud user | Free tier, safe to accept — Calendar API has no cost |
| "Google hasn't verified this app" warning | OAuth in testing mode | Normal — click "Continue". Fine for personal use |
| "Access denied" on /admin | `OWNER_EMAIL` mismatch | Check the email matches the signed-in Google account |
| No time slots showing | Calendar not connected | Visit /admin, verify "Connected as {email}" |
| "Slot no longer available" on booking | Race condition | Expected — slot was booked by someone else, pick another |
| Token errors after a while | Google OAuth token expired | Sign out at /admin and sign back in |
| `lightningcss` binary error on install | Platform-specific native binary missing | `npm install lightningcss-$(node -e "console.log(process.platform+'-'+process.arch)")@1.30.2` |

---

## Project Architecture (Reference)

### How It Works
- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Auth**: next-auth v5 (Auth.js) with Google OAuth (scopes: `calendar.freebusy` + `calendar.events`)
- **Storage**: No database — Google Calendar stores bookings, Upstash Redis stores config
- **Token flow**: Admin signs in → tokens encrypted with AES-256-GCM → stored in Redis → public routes retrieve tokens via `getOwnerAccessToken()` → tokens auto-refresh when expired
- **Config fallback**: Without Redis, app uses `calendez.config.defaults.ts` (3 event types, M-F 9-5)

### Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth.ts` | next-auth v5 config, Google provider, JWT token refresh, token persistence |
| `src/lib/owner-tokens.ts` | Encrypted token storage (Redis or in-memory), token refresh, `getOwnerAccessToken()` |
| `src/lib/availability.ts` | Core slot computation algorithm |
| `src/lib/google-calendar.ts` | Google Calendar API wrapper (FreeBusy + event creation) |
| `src/lib/config.ts` | Read/write config from Upstash Redis with defaults fallback |
| `src/lib/timezone.ts` | Timezone conversion utilities using @date-fns/tz |
| `src/lib/validators.ts` | Zod schemas for config and booking validation |
| `src/lib/types.ts` | TypeScript interfaces for config, events, slots |
| `src/lib/utils.ts` | Utility functions (`cn()` for clsx + tailwind-merge) |
| `src/app/page.tsx` | Landing page — shows event type cards |
| `src/app/book/[slug]/page.tsx` | Booking page for a specific event type |
| `src/app/book/[slug]/confirmed/page.tsx` | Booking confirmation page |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/app/api/auth/[...nextauth]/route.ts` | next-auth route handlers |
| `src/app/api/availability/route.ts` | GET: returns available time slots |
| `src/app/api/book/route.ts` | POST: creates Google Calendar event |
| `src/app/api/config/route.ts` | GET: public config (event types, branding) |
| `src/app/api/admin/config/route.ts` | GET/PUT: admin config CRUD |
| `calendez.config.defaults.ts` | Default config (seeds Redis on first run) |

### Components

```
src/components/
├── admin/
│   ├── admin-dashboard.tsx      # Main admin panel with tabs
│   ├── availability-editor.tsx  # Working hours editor
│   ├── branding-editor.tsx      # Color, name, logo settings
│   ├── event-type-editor.tsx    # Add/edit/remove event types
│   └── sign-out-button.tsx      # Admin sign-out
├── booking/
│   ├── booking-page.tsx         # Booking flow container
│   ├── booking-form.tsx         # Name/email form + submit
│   ├── event-info-panel.tsx     # Event details sidebar
│   ├── time-slot-picker.tsx     # Date + time slot selection
│   └── timezone-selector.tsx    # Timezone dropdown
├── ui/                          # shadcn/ui primitives (button, card, dialog, etc.)
└── event-type-card.tsx          # Event type card on landing page
```

### Routes

- `/` — Public: event type selection
- `/book/[slug]` — Public: booking page with calendar + time slots
- `/book/[slug]/confirmed` — Public: booking confirmation
- `/admin` — Protected: admin dashboard (requires `OWNER_EMAIL` match)
- `GET /api/availability?event=slug&date=YYYY-MM-DD&tz=IANA_TZ` — Available slots
- `POST /api/book` — Create booking
- `GET /api/config` — Public config (event types, owner name, branding)
- `GET/PUT /api/admin/config` — Full config (admin-only)

### Commands

```bash
npm run dev   # Local development (port 3000)
npm run build # Production build
npm run start # Production server (after build)
npm run lint  # ESLint
```

### Technical Notes

- `@vercel/kv` is deprecated — use `@upstash/redis` instead
- next-auth v5: augment `@auth/core/jwt` (not `next-auth/jwt`) for JWT interface extension
- Next.js 16 uses `params: Promise<{...}>` pattern (async params in page components)
- Google OAuth needs `access_type=offline` + `prompt=consent` to get a refresh token
- Service accounts can't access personal Gmail calendars — must use OAuth2
- Admin auth: `session.user.email === process.env.OWNER_EMAIL` — simple, no extra password system
