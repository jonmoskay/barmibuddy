# BarmiBuddy — Working Agreement

This file is the source of truth for decisions JK has already made. **Do not relitigate these. Do not suggest reversing them unless JK explicitly asks.** If a tangent would touch one of these, stop and ask first.

## Locked-in decisions

### Deployment surface — pilot is **web on Vercel**
- The pilot is a website that kids run on their phones in a browser. It is **hosted on Vercel** at the existing project. That is the deployment target right now.
- **App Store / Google Play submission is a FUTURE build. Not now. Not soon. Do not act on it.**
- `apps/mobile` is built for web via `expo export --platform web`. The fact that Expo *can* ship native does not mean we are.
- Native audio port, EAS Build, app icons for stores, push notifications — all FUTURE. Don't propose them as next steps unless JK raises them.
- `react-native-web` stays. Do not suggest dropping it.

### Marketing site is out of scope
- `barmibuddy.com` (the marketing site) lives in a **separate repo** that JK is happy with. **Do not touch it. Do not propose absorbing it into this monorepo. Do not propose rebuilding it in Next.js.**
- `apps/web` (the Next.js scaffold in this repo) is for *in-app* web flows / future use, **not** for replacing the marketing site.

### Backend = Supabase
- Project ref: `tvplzwbkfesqtvtebsdd`
- Auth, DB, RLS, Edge Functions all via Supabase. Don't suggest swapping to Clerk/Auth0/Firebase/Neon/etc.
- OpenAI key lives **only** as a Supabase secret on Edge Functions (`coach-feedback`, `transcribe-audio`). Never `EXPO_PUBLIC_OPENAI_*` again.

### Monorepo structure (committed)
```
apps/mobile/   → the actual app (Expo, web target via Vercel)
apps/web/      → Next.js scaffold, currently empty, future in-app web flows
packages/db/   → shared Supabase client + types
supabase/      → Edge Functions + config
```
npm workspaces + Turborepo. Don't propose pnpm/yarn migration.

### Vercel build config
- `vercel.json` is at **repo root** (not `apps/mobile/`). Build runs from monorepo root so workspace deps resolve.
- Root Directory in Vercel project settings must be `.`.

## Behavioural rules for any agent working here

1. **Re-read this file before suggesting architectural changes.** If your suggestion would change anything in "Locked-in decisions" above, stop and ask.
2. **Re-read the recent conversation before responding.** If JK just said something ("we're not building for iOS yet", "I'm happy with the marketing site", etc.), don't contradict it three messages later by inferring from file metadata.
3. **Do not invent future plans on JK's behalf.** Saying "the App Store build is coming" or "once we ship native" when JK never said that is fabrication. Stick to what JK has actually decided.
4. **Confirm before destructive moves on a working production deploy.** The pilot is live. File moves, restructures, or anything that breaks the Vercel build needs a snapshot commit first and a heads-up.
5. **OpenAI API keys never in client code.** Always Edge Function. No exceptions.
6. **Ask, don't assume**, when the project state is ambiguous (e.g. "is this still the active deploy target?").

## Current product state (pilot v1)

See `apps/mobile/HANDOVER.md` for the full file map. Short version:
- Expo SDK 54, RN 0.81, React 19, TypeScript strict.
- Web-only audio: `WebRecorder` (MediaRecorder), `extractPitch` (in-browser autocorrelation).
- Auth: Supabase Auth + AsyncStorage session adapter (set up, not yet wired into screens).
- Persistence: still mostly `AsyncStorage` on-device. **Migrating to Supabase tables is in-flight**.
- OpenAI calls: now route through Supabase Edge Functions (`coach-feedback`, `transcribe-audio`).

## Known not-yet-done (in roughly the right order)

1. Wire Supabase Auth into the app screens (sign-up / sign-in / persisted session).
2. Migrate `AsyncStorage` data (Profile, lessons, attempts, streak/XP) to Supabase tables defined in the SQL schema.
3. App icon — JK is sending one. Test on real device once received.
4. Pre-existing TypeScript errors in `Onboarding.tsx` (Character.yarmulke) and `StudentHome.tsx` (styles.pickHint) — unrelated to backend work but should be cleaned up.

**FUTURE (not now, do not start):** native audio port, EAS Build, App Store/Play Store submission.
