# RunningQuest — Project Report

## What it is

A gamified running web app that pulls data from Strava, awards XP for runs, predicts race times, and has a social layer built around QR code pairing for running with friends.

Live at: **https://benevolent-mousse-33546e.netlify.app**

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth | Strava OAuth (custom, no Supabase Auth) |
| Charts | Recharts |
| QR Codes | qrcode npm package |
| Hosting | Netlify (auto-deploys from GitHub: adam01see/QRrun) |

Session cookie (`rq_session`) stores the Supabase profile UUID. All DB access uses the service role key server-side.

---

## Database Schema

### `profiles`
Stores one row per user. Created/updated on Strava OAuth callback.
- `strava_id`, `strava_access_token`, `strava_refresh_token`, `token_expires_at`
- `total_xp`, `level`, `current_streak`, `longest_streak`, `last_run_date`

### `activities`
Synced from Strava. Only `type=Run` activities stored.
- `strava_id` (unique), `distance` (meters), `moving_time` (seconds), `average_speed` (m/s)
- `workout_type`: 0=default, 1=race, 2=long run, 3=workout
- `xp_earned`, `is_pr`

### `user_achievements`
Junction table: which achievements a user has earned and when.

### `quests` + `user_quests`
Quest definitions and per-user completion state. Side quests are currently hardcoded client-side in `QuestsSection.tsx` (not DB-driven).

### `run_pairings`
Active QR pairings. One row per (user1, user2, date). Status: `active` → `used`.
- Valid for one calendar day only
- Created when someone scans a QR and hits "Let's run together"

### `friendships`
One row per unique pair (user1_id < user2_id always).
- `total_km`, `total_time_seconds`, `run_count`
- `friendship_xp`, `friendship_level` (1–6)

### `shared_runs`
Log of each time two friends ran together. Prevents double-processing on re-sync.

---

## Key Files

```
app/
  page.tsx                        — Landing/login page
  dashboard/page.tsx              — Main dashboard
  profile/page.tsx                — QR code display
  scan/[userId]/page.tsx          — QR scan landing (handles unauthenticated)
  friends/page.tsx                — Friendships list with stats
  achievements/page.tsx           — All achievements grid
  api/
    auth/strava/route.ts          — Initiates Strava OAuth (supports ?returnTo=)
    auth/strava/callback/route.ts — Handles OAuth callback, sets session cookie
    sync/route.ts                 — Pulls Strava activities, calculates XP, processes pairings
    scan/route.ts                 — POST to create a run pairing
    quests/complete/route.ts      — POST to manually complete a side quest

lib/
  supabase.ts     — getSupabaseClient() and getSupabaseAdmin()
  strava.ts       — OAuth, token refresh, activity fetch
  auth.ts         — Session cookie helpers (setSession, getSession, getCurrentProfile)
  xp.ts           — XP calculation, level thresholds, formatting helpers
  predictor.ts    — Riegel formula race time prediction
  achievements.ts — Achievement definitions + unlock checker
  friendship.ts   — Friendship XP/level helpers

components/
  XPBar.tsx         — Level + XP progress bar
  ActivityCard.tsx  — Single run card
  RacePredictor.tsx — Prediction cards + improvement graph (Recharts)
  QuestCard.tsx     — Individual quest with complete button
  QuestsSection.tsx — All side quests (client component)
  SyncButton.tsx    — Triggers POST /api/sync
  QRDisplay.tsx     — Renders QR code client-side using qrcode package
  ScanConfirm.tsx   — Confirm pairing button on scan page
  FriendshipCard.tsx — (used inline in friends/page.tsx)

types/index.ts      — All shared TypeScript interfaces + LEVEL_THRESHOLDS
```

---

## XP System

**Per run:**
- Base: 10 XP per km
- Long run (>15km): 1.5x multiplier
- Race (workout_type=1): 2x multiplier
- PR bonus: +100 XP flat

**Level thresholds:**
| Level | XP | Title |
|---|---|---|
| 1 | 0 | Couch Potato |
| 2 | 500 | Jogger |
| 3 | 1,500 | Runner |
| 4 | 3,500 | Athlete |
| 5 | 7,500 | Road Warrior |
| 6 | 15,000 | Beast |
| 7 | 30,000 | Legend |

**Social (QR pairing):**
- Both users get 2x XP on their run that day
- Friendship XP = min(km1, km2) * 10 per shared run
- Processed automatically during sync (whoever syncs second triggers it)

---

## Race Time Predictor

Uses the **Riegel formula**: `T2 = T1 × (D2/D1)^exponent`

Improvements over naive implementation:
- Per-distance bracket reference runs (5K predicted from 3–7km runs, not random recent run)
- Prefers race-effort runs (workout_type=1) over training runs within bracket
- Picks fastest pace run in bracket, not most recent
- Personal fatigue exponent derived from actual race results (clamped 1.0–1.15), falls back to 1.06
- Improvement graph only plots points where predicted time actually improves

---

## Friendship / QR System

**Flow:**
1. User A opens `/profile` → sees QR encoding `APP_URL/scan/[userA_id]`
2. User B scans with phone camera → lands on `/scan/[userA_id]`
3. If not logged in → redirected through Strava auth then back to scan page (via `rq_return_to` cookie)
4. User B taps "Let's run together" → POST `/api/scan` → pairing created for today
5. Both run, either syncs → system matches runs from both users on pairing date → 2x XP, friendship updated

**Friendship levels:**
| Level | XP | Title |
|---|---|---|
| 1 | 0 | Strangers |
| 2 | 300 | Running Mates |
| 3 | 800 | Training Partners |
| 4 | 2,000 | Run Crew |
| 5 | 5,000 | Pacer for Life |
| 6 | 12,000 | Legendary Duo |

---

## Achievements (15 total)

Categories: Distance, Consistency, Special
Examples: First Step, 5K Club, Marathon Legend, Week Warrior (7-day streak), Iron Legs (30-day streak), Early Bird, Night Owl, PR Crusher, Hill Climber

---

## Side Quests (7, manually completable)

Explorer (new route), Pack Runner (run club), Social Runner (run with friend), Signed Up (race entry), Natural Roots (barefoot run), On the Track (interval workout), Off-Road (trail run)

---

## Known Issues / Next Session Ideas

- Strava sync only pulls 200 activities (2 pages) — needs pagination for heavy users
- Side quests are hardcoded client-side, not DB-driven — can't add new ones without code change
- No push notifications when friend syncs and pairing is processed
- No way to see pending pairings (did my friend scan yet?)
- Sync is manual — could add Strava webhook for auto-sync on new activity
- No logout button implemented yet
- Mobile PWA manifest not set up (can't "Add to Home Screen" cleanly yet)
- Supabase URL in .env.local keeps getting `/rest/v1/` appended accidentally — watch for this

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://cnjxbculmwmktkprwezc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
STRAVA_CLIENT_ID=244754
STRAVA_CLIENT_SECRET=...
NEXT_PUBLIC_APP_URL=https://benevolent-mousse-33546e.netlify.app
```

Strava callback domain: `benevolent-mousse-33546e.netlify.app`
