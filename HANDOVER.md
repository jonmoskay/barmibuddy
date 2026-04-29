# BarmiBuddy — Handover for Codex

**Repo root:** `/Users/jonathankrywicki/Claude/barmibuddy`
**Live URL:** https://app.barmibuddy.com (deployed via Vercel, project `barmibuddy`)
**Marketing site (design reference):** https://barmibuddy.com

---

## 1. Product

BarmiBuddy is a **gamified Bar Mitzvah practice app** for boys (~age 12) learning their Parsha. They get a recording from their teacher, upload it into the app, then sing along while the app records them, extracts the pitch curve, compares it to the teacher's, scores it, and gives coaching feedback. Streaks, levels, XP, and (eventually) head-to-head "BarmiBattle" challenges keep them engaged between weekly lessons.

The brand pivot mid-project: original Duolingo-flavoured pitch evolved into the "Practice. Battle. Crush it." identity on barmibuddy.com — gamified, footy-team-coloured, dark UI.

---

## 2. Stack

- **Expo SDK 54** + **React Native 0.81** + **React 19** (`expo-router` not used — `@react-navigation/native-stack`).
- **TypeScript**, strict.
- **AsyncStorage** for all local persistence — no backend yet (pilot v1).
- **Web target only** in production. iOS/Android builds work but aren't shipped (`eas.json` exists).
- **Audio pipeline** is web-only: `expo-document-picker` for upload, `WebRecorder` (`src/lib/recorder.ts`) wraps `MediaRecorder`, and `extractPitch` (`src/lib/pitch.ts`) does autocorrelation pitch extraction in-browser.
- **OpenAI** (`gpt-4o-mini`) generates per-attempt coaching feedback. Key in `EXPO_PUBLIC_OPENAI_API_KEY` (`.env`).
- **Deploy:** `npx expo export --platform web` → `dist/` → `vercel --prod`. `vercel.json` already configured.

---

## 3. File map

```
src/
  theme.ts                  # colors, radii, spacing, shadows, type tokens
  types.ts                  # Profile, Lesson, PitchAttempt, StreakState, MILESTONES
  storage.ts                # AsyncStorage wrappers + storage.reset()
  scoring.ts                # (legacy word-by-word scoring, unused by pitch flow)
  lib/
    teams.ts                # 18 AFL teams + primary/secondary hex codes
    recorder.ts             # WebRecorder, fileToDataUrl, uriToDataUrl
    pitch.ts                # extractPitch — autocorrelation FFT
  components/
    PitchGraph.tsx          # SVG graph of teacher vs student pitch
  screens/
    Onboarding.tsx          # 2-step: name+city → AFL team picker. Background orbs re-tint to team colors.
    StudentHome.tsx         # Greeting + streak pill + XP bar + Today's Practice + Latest Badge + Weekly Leaderboard (mocked)
    Lesson.tsx              # Play teacher recording + Sing along CTA + history
    PitchPractice.tsx       # Sing-along screen — records, scores, generates feedback
    ParentHome.tsx          # Read-only progress dashboard
    Settings.tsx            # Switch role, Reset all data (uses window.confirm on web)
App.tsx                     # Stack navigator + role-based root
```

---

## 4. Design system (matches barmibuddy.com)

Defined in `src/theme.ts`:

- **Background:** `#08090D` (near black). Card `#141820`, cardAlt `#1C2030`.
- **Primary:** `#7C3AED` purple. Light `#A78BFA`. Dark `#4C1D95`.
- **Accents:** sky `#0EA5E9` / `#38BDF8`, orange `#FB923C` / `#EA580C`, amber `#FBBF24`.
- **Status:** good `#4ADE80`, bad `#F87171`.
- **Border:** `rgba(255,255,255,0.07)` (subtle).
- **Radii:** sm 10, md 14, lg 20, **pill 999** (used on all CTAs).
- **Shadows:** `primaryGlow` is a purple shadow used on the main CTAs.
- **Typography:** website uses Plus Jakarta Sans (700–900, tight letter-spacing). The app uses System for now — switching to PJS via `expo-font` is a clean follow-up.

The website uses radial-gradient "orbs" behind the hero. We approximated this in `Onboarding.tsx` with three positioned circular Views that re-colour to the selected AFL team's primary + secondary.

---

## 5. AFL team theming

When a student picks their footy team in onboarding, the team's `primary` and `secondary` hex codes are stored on the Profile and used everywhere as the accent: avatar, XP bar fill, "Start Session" button, leaderboard "you" highlight, and the onboarding background orbs.

Teams live in `src/lib/teams.ts`. Once chosen, **the team is permanent** (no UI to change it). To re-test, use Settings → Reset all data.

---

## 6. Known gaps / what Codex should pick up

1. **Native audio** — `WebRecorder` and `Lesson.tsx` use `new Audio(...)` and `HTMLAudioElement` directly. Won't work on iOS/Android. Needs `expo-av` (or successor) for native parity.
2. **Plus Jakarta Sans** — load via `expo-font` to fully match marketing site typography.
3. **BarmiBattle** — head-to-head card removed for now; design exists on barmibuddy.com mockups (Q-and-A duels, +XP/Critical Hit feedback). Backend + matchmaking required.
4. **Real leaderboard** — currently mocked in `StudentHome.tsx` (`fakeLeaderboard`). Needs a backend with shul-grouped users.
5. **Cloud sync / accounts** — everything is AsyncStorage on-device. Multi-device, teacher dashboards, push notifications all need a backend (Supabase or similar would be a fast pick).
6. **Cross-platform alerts** — `Alert.alert` on RN web doesn't render the buttons. Settings reset uses `window.confirm` as a workaround. Other `Alert.alert` confirm flows (delete section in `StudentHome.tsx`, etc.) should get the same treatment, or be replaced with an in-app modal.
7. **Pitch extraction** — only works in browsers that expose `AudioContext`. Native port needed.
8. **Asset pipeline** — favicon and metadata are minimal. No app icon for native builds.
9. **Tests** — none. Add Jest + React Native Testing Library.
10. **Plan vs reality drift** — original PRD targeted iOS first; current shipped product is web. Decide which surface is the real v1.

---

## 7. Build, run, deploy

```bash
# Local dev
cd barmibuddy
npx expo start --web                 # web preview at http://localhost:8081

# Production deploy
npx expo export --platform web       # builds to dist/
./node_modules/.bin/vercel --prod    # deploys dist/ to app.barmibuddy.com
```

`vercel.json` rewrites all routes to `index.html` (SPA). The Vercel project is `barmibuddy` under `mail-jonathankryws-projects`. Auth token must be valid — `vercel login` if needed.

---

## 8. How to hand this to Codex

The user is asking how to give Codex the full context. Three recommended ways, depending on which "Codex" is meant:

### A. **Codex CLI** (`@openai/codex`, the OpenAI coding-agent CLI — closest analogue to Claude Code)

```bash
npm i -g @openai/codex
cd /Users/jonathankrywicki/Claude/barmibuddy
codex
```

It'll read the working directory directly. To prime it with context, add an `AGENTS.md` (Codex's equivalent of `CLAUDE.md`) at the repo root — copy this `HANDOVER.md` into `AGENTS.md` and Codex picks it up automatically every session.

### B. **ChatGPT with Codex (cloud)** at https://chatgpt.com/codex

Connect the GitHub repo (push this project to GitHub first). ChatGPT's Codex environment will clone it. Paste this `HANDOVER.md` as the first task message so the agent has the product/design context the code alone doesn't carry.

### C. **Cursor / Copilot Chat / any other agent**

- Open the repo folder in the IDE.
- Make sure `HANDOVER.md` (this file) is in the root — most agents auto-include root markdown.
- Reference https://barmibuddy.com so the agent can look at the design source of truth.

### What's not in the code that Codex needs from you

- The OpenAI API key (`.env`) — don't commit it; share separately.
- Vercel auth — the agent will need its own `vercel login` to deploy.
- Access to the marketing repo (if you want it to keep app + site visually in sync).
- Decision on iOS/Android vs web-only for v1.

---

## 9. Prior conversations (for context, not required reading)

Two earlier Claude sessions covered the build:

- **"Barmibuddy"** session — original PRD ingest, scaffolding, scoring/pitch pipeline.
- **"BB - web audio"** session — audio recording fixes, teacher upload simplification.

Most decisions from those sessions are already reflected in the code. The PRD itself is not in the repo — if you want it, paste the original PRD text into a `docs/PRD.md` so future agents have it.
