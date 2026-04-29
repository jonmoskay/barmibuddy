# BarmiBuddy

Monorepo for the BarmiBuddy app. The marketing site (barmibuddy.com) lives in a separate repo — this repo is the app and its supporting backend.

## Layout

```
apps/
  mobile/          Expo + React Native app (iOS, Android, web fallback)
  web/             Next.js (currently scaffold; future destination for in-app web flows)
packages/
  db/              Shared Supabase client + DB types (used by mobile and web)
supabase/
  functions/
    coach-feedback # Edge Function — holds OPENAI_API_KEY server-side
```

## Setup

```bash
# 1. Install everything (workspaces)
npm install --legacy-peer-deps

# 2. Configure env
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env.local
# Fill in Supabase URL + anon key from supabase.com (Settings → API)

# 3. Set OpenAI key as a Supabase secret (one-time, never in code)
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase secrets set OPENAI_API_KEY=sk-...
npx supabase functions deploy coach-feedback
```

## Run

```bash
npm run dev:mobile       # Expo dev server
npm run dev:web          # Next.js dev server
```

## Notes

- **Auth session** persists via `AsyncStorage` on mobile, cookies on web.
- **OpenAI key never ships to the client** — all calls route through `supabase/functions/coach-feedback`.
- **RLS** is enabled on every public table; users can only read/write their own rows.
- **App Store submission**: still requires native audio port (`expo-av`) and native pitch extraction — see `apps/mobile/HANDOVER.md` §6.
