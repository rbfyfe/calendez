# Calendez

A self-hosted Calendly alternative. Let people book meetings on your Google Calendar with a clean, simple interface. Deployed on Vercel with zero infrastructure to manage.

## Features

- Multiple event types (15 min, 30 min, 60 min, etc.)
- Google Calendar integration (reads your availability, creates events)
- Automatic email invitations (via Google Calendar)
- Admin dashboard to manage event types, working hours, and branding
- Timezone-aware scheduling
- No database needed (Google Calendar is the database, config in Upstash Redis)

## Prerequisites

- Node.js 18+
- A Google account
- A Vercel account (free tier works)

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/calendez.git
cd calendez
npm install
```

### 2. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project
2. Enable the **Google Calendar API**: APIs & Services > Library > search "Google Calendar API" > Enable
3. Configure the **OAuth consent screen**: APIs & Services > OAuth consent screen
   - User type: External
   - App name: "Calendez"
   - Add your email as a test user
   - Add scopes: `calendar.freebusy` and `calendar.events`
4. Create **OAuth credentials**: APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "Calendez"
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description | Where to get it |
|----------|-------------|-----------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Google Cloud Console > Credentials |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Google Cloud Console > Credentials |
| `AUTH_SECRET` | Random secret for session encryption | Run: `openssl rand -base64 32` |
| `OWNER_EMAIL` | Your Google email (for admin access) | Your Gmail address |
| `KV_REST_API_URL` | Upstash Redis URL | Vercel Storage or Upstash dashboard |
| `KV_REST_API_TOKEN` | Upstash Redis token | Vercel Storage or Upstash dashboard |

Note: KV variables are optional for local development. Without them, the app uses default config from `calendez.config.defaults.ts`.

### 4. Run locally

```bash
npm run dev
```

1. Visit `http://localhost:3000/admin` to connect your Google Calendar
2. Visit `http://localhost:3000` to see the booking page

### 5. Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com/new)
3. In Vercel dashboard, go to Storage > Create > KV (Upstash Redis)
4. Add all environment variables in Settings > Environment Variables
5. Add the production redirect URI to Google Cloud Console:
   `https://your-app.vercel.app/api/auth/callback/google`
6. Deploy!

## Customization

Visit `/admin` after signing in with your owner email to:

- Add, edit, or remove event types
- Set working hours for each day of the week
- Configure buffer time between meetings
- Set how far in advance people can book
- Change your accent color and logo

## Development

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # Run ESLint
```

## How It Works

1. You configure your event types and working hours in the admin dashboard
2. Visitors pick an event type, date, and time slot
3. The server checks your Google Calendar for conflicts via the FreeBusy API
4. When a visitor books, a Google Calendar event is created with them as an attendee
5. Google automatically sends them a calendar invitation email

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: Auth.js v5 with Google OAuth
- **Calendar**: Google Calendar API via `@googleapis/calendar`
- **Config storage**: Upstash Redis (via Vercel KV)
- **Deployment**: Vercel
