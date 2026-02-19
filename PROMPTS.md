# Prompts Used to Build Calendez

A chronological record of every prompt used during development, so others can see how this project was built with Claude Code.

---

## Session 1: Initial Build

### Prompt 1 — The Initial Vision
> Go to calendly and look around. I basically want people to be able to book times with me on my google calendar, and i don't want to make a big hosting set up. I just want to use vercel or something simple to make this whole thing work.

*Context: Starting from scratch. Claude browsed Calendly's website to understand the UX patterns (3-panel layout, event types, etc.), then designed and built the entire app.*

### Prompt 2 — Clarifying Questions (answered via UI)
- **Event types?** → "Multiple event types" (15min, 30min, 60min)
- **Google credentials?** → "Need guidance"
- **Domain?** → "Default Vercel URL"

### Prompt 3 — Admin & Settings
> just checking. if someone were to go to /admin, or read this repo, would that be a problem?

*Context: User wanted to confirm the repo is safe to be public. Discussed OWNER_EMAIL auth approach and that no secrets are in code.*

### Prompt 4 — Settings Management (answered via UI)
- **Settings approach?** → "Admin UI + Vercel KV (Recommended)"
- **Post-booking management?** → "Nothing for now"

### Prompt 5 — Documentation for Others
> Awesome, can you document this in a way to allow other people who have claudecode to spin up their own version of this themselves? Can you add information into the github repo to make it very easy for the claude agent that reads this to deploy it?

*Context: This led to creating README.md, CLAUDE.md, and .env.example — making the repo self-documenting for both humans and AI agents.*

### Prompt 6 — Commit & Push
> I think you're ready to commit

*Context: 57 files changed, 9,480 insertions. Initial commit of the entire app.*

### Prompt 7 — Create GitHub Repo
> whats the name of the repo? I dont see it in my github

> sure yes please

*Context: Repo didn't exist yet. Created https://github.com/rbfyfe/calendez (public).*

### Prompt 8 — Google Cloud Console Setup
> Is there an easy way to do this google cloud console thing? Like can you call an API or something for me?

> ok

*Context: No API exists for Google Cloud Console setup. Claude walked through the steps manually in the user's browser using Chrome automation.*

---

## Session 2: Google Cloud Console (Browser)

### Prompt 9 — Resume Setup
> oh man, can pick this up from where we left off, can you do this for me by going into my browser and pulling the api keys you need?

*Context: Previous session's browser connection had dropped mid-setup. Claude reconnected and continued the Google Cloud Console configuration — created project "Calendez", enabled Calendar API, configured OAuth consent screen, created OAuth credentials, added test user.*

---

## Session 3: Finish .env.local & Test

### Prompt 10 — Continue from Context Compaction
*(Automatic continuation after context window compaction)*

*Context: Claude completed the OAuth consent screen setup (audience → contact info → finish), created OAuth client with correct redirect URIs, added rbfyfe@gmail.com as test user, then asked user to paste the client secret.*

### Prompt 11 — Client Secret (answered via UI)
> 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

*Context: User pasted the Google OAuth client secret so Claude could write it to .env.local.*

---

## Session 4: QA & Bug Fixes

### Prompt 12 — QA Findings + Prompts File Request
> i'm going a little qa and it seems like it's not working when i try to book an appointment as not an admin. I also don't get why it says "your name" at the top of the screen. Seems odd.
>
> Before we continue, I would like to make a file that has all the prompts I used. Can you arrange that?

*Context: Two bugs found during QA testing: (1) Public booking completely broken because API routes use `auth()` which only works for the admin's session, (2) "Your Name" placeholder showing because the default config hasn't been updated. Also requested this PROMPTS.md file.*

### Prompt 13 — Prompts File Preferences (answered via UI)
- **What to include?** → "Reconstruct from history"
- **File location?** → "PROMPTS.md in repo root. Also every prompt i make going forward should update that file"

---

## Session 5: Testing & Commit

### Prompt 14 — Commit Request
> yes

*Context: After end-to-end testing confirmed the public booking fix works (admin re-signed in → tokens persisted → curl test showed 19 time slots → booking page loaded slots for public visitors), user approved committing all changes.*

### Prompt 15 — Push to Remote
> yes

*Context: User confirmed pushing commit `09b4a67` to origin/main on GitHub.*

---

## Session 6: Agent-Friendly README & CLAUDE.md Rewrite

### Prompt 16 — Make the Repo Shareable via LinkedIn
> Alright, so I want to introduce this app to the world, but I want to do it in a way that allows anyone with Claude, to install this really easily. Here's what I am thinking, and let's talk through it to make something great.
>
> I'll make a LinkedIn post that says "I just vibe coded a replacement to Calendly and you can too in just one prompt w/ Claude!"
>
> I would then share "Download Claude for desktop, and tell Claude to read this URL and help me set it up!"
>
> I then would expect claude code to go to the github repo, and i'm not sure what claude would do first, but i would expect it to read the readme. If so, have the readme guide the agent reading this (if they are one) to tell the user what this is, and that you can set up everything for them including creating an account. I want you to tell the agent it is preferred to take over the users browser to set it up. that it should explain the tools to the user and if possible, find a way to ensure the user feels safe in this whole process.

*Context: User wants to share the project on LinkedIn. Rewrote README.md as a marketing-first document with Claude Code as the primary setup path, and transformed CLAUDE.md into a complete agent execution playbook with phased browser automation workflows for Google Cloud Console and Vercel deployment. Added a screenshot of the booking page.*

### Prompt 17 — Hosting Clarification
> do you need to help set-up vercel or a hosting as well?

*Context: User wanted to confirm the docs cover Vercel deployment. They do — Phase 5 of CLAUDE.md covers the full Vercel deployment flow including browser automation.*

### Prompt 18 — Screenshot Preference
> Add a screenshot

*Context: User chose to include a screenshot of the booking UI in the README rather than going text-only.*

---

## Session 7: Deploy to Vercel

### Prompt 19 — Deploy Request
> *(Continued from previous session that ran out of context)*

*Context: Resumed mid-deployment. The plan was already approved — deploy Calendez to Vercel with full browser automation. Picked up from the Google OAuth consent summary page where "calendez.vercel.app wants access to your Google Account" was showing.*

**What happened in this session (and the tail end of the previous one):**

1. **First deploy failed** — `lightningcss-darwin-arm64` was a direct dependency in `package.json` (macOS ARM64 only), causing `EBADPLATFORM` on Vercel's linux-x64 build. Fixed by removing it from dependencies and regenerating `package-lock.json`. Committed as `6861c52`.
2. **Second deploy succeeded** — App live at **calendez.vercel.app**.
3. **Created Vercel KV store** — Upstash Redis (`upstash-kv-aquamarine-mirror`), free plan, iad1 region. Connected to the project (auto-sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`).
4. **Redeployed** with KV env vars.
5. **Added production redirect URI** — `https://calendez.vercel.app/api/auth/callback/google` added to Google Cloud Console OAuth client.
6. **Connected Google Calendar on production** — Clicked through Google OAuth consent flow. Admin page shows "Connected as rbfyfe@gmail.com".
7. **Verified public booking page** — Event types load, date selection works, time slots appear from Google Calendar FreeBusy API.

### Prompt 20 — Upstash Terms Acceptance
> I clicked it

*Context: User confirmed they clicked "Accept and Create" on the Upstash terms & conditions page during Vercel KV store setup.*
