# RunningQuest Setup

## 1. Strava API App

1. Go to https://www.strava.com/settings/api
2. Create an app (name/description anything, category "Other")
3. Set **Authorization Callback Domain** to `localhost`
4. Copy your **Client ID** and **Client Secret**

## 2. Supabase Project

1. Create a free project at https://supabase.com
2. Go to **SQL Editor** and run the full contents of `supabase-schema.sql`
3. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` key
   - `service_role` key (under Service Role, not anon)

## 3. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

STRAVA_CLIENT_ID=12345
STRAVA_CLIENT_SECRET=abc...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Run

```bash
npm run dev
```

Open http://localhost:3000, click Connect with Strava, then hit Sync Strava on the dashboard.

## 5. Deploy to Vercel (for phone access)

```bash
npm i -g vercel
vercel
```

After deploy, update:
- `NEXT_PUBLIC_APP_URL` in Vercel env vars to your production URL
- Strava app: add your Vercel domain to **Authorization Callback Domain**
