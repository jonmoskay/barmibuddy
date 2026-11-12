# Legacy web pilot audit

Read-only check of the Expo/Supabase pilot still served at https://app.barmibuddy.com. The canonical product is the separate Flutter iOS app. This note is so Jonathan can decide whether to keep this pilot temporarily, restrict it, or retire it after a backup.

Checked 12 November 2026. Nothing in production was changed: no deploy, no DNS edit, no database write, and the paused Supabase project was not resumed. No production rows were queried.

## 1. Repo and deploy

**Verified live.** https://app.barmibuddy.com returns HTTP 200 from `server: Vercel` (`x-vercel-cache: HIT`). The document is an Expo web shell: title `barmibuddy`, an `#root` div, and one script, `/_expo/static/js/web/index-36936fd394f909531e09166748493a08.js` (about 1.4 MB). There is no Netlify header and no Expo Hosting header. `app.json` does name an Expo Updates URL (`https://u.expo.dev/32d50847-431b-45f9-9bc0-b1acdf3d4c5c`); that is the native update service, and it is not what answers this hostname.

Static-asset `Last-Modified` was `Thu, 12 Nov 2026 02:37:03 GMT` for the HTML and `02:41:09 GMT` for the JavaScript. Response headers and the bundle contain no git SHA. This repo's `main`, including `origin/main`, is `50abd72cd472ead1dda843c8130a6da30f73107d` (6 July 2026, "Mark repo as historical BarmiBuddy reference"). That commit is older than the asset timestamp, so the timestamp is a Vercel publish time. The deployed SHA was not recoverable without the Vercel API, which was not called.

The live bundle does match this repo's Expo client. It throws the same sentence as `apps/mobile/src/lib/supabase.ts`, including the path `apps/mobile/.env.example`, and it contains `coach-feedback`, `transcribe-audio`, and the on-device keys `bb:pitchAttempts` and "Send progress to teacher".

**From the repo.** Root `vercel.json` builds this app and nothing else:

- install: `npm install --legacy-peer-deps`
- build: `npm run build:web --workspace=apps/mobile`, which is `expo export --platform web`
- output: `apps/mobile/dist`
- every path rewrites to `/index.html`

`apps/web` is a Next.js teacher-setup screen (in-memory React state, plus a Sefaria text fetch). It is not the Vercel build in `vercel.json`, and the live HTML is the Expo shell. `HANDOVER.md` names the Vercel project `barmibuddy` under `mail-jonathankryws-projects`. That account name was not re-checked against the Vercel API.

`barmibuddy.com` and `www.barmibuddy.com` are a different Vercel deployment (same etag, about 1.0 MB, `Last-Modified: Tue, 10 Nov 2026 03:38:53 GMT`). The title is "Barmi Buddy — Practice. Battle. Crush It." It is a single static HTML page using Plus Jakarta Sans. It is the marketing site, which this repo's README keeps in a separate project. This audit did not inventory that other repo.

## 2. DNS

Lookups were `dig` plus registry RDAP. A `whois` client was not installed; RDAP is the registry record for registrar, dates, and nameservers.

| Name | Nameservers | Address records | What answers HTTP |
| --- | --- | --- | --- |
| `barmibuddy.com` | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` | A `216.198.79.65`, `64.29.17.65`. No AAAA, no CNAME | Vercel, marketing page above |
| `www.barmibuddy.com` | (inherited) | A `216.198.79.65`, `216.198.79.1`. No CNAME | Same marketing page (same etag) |
| `app.barmibuddy.com` | (inherited) | A `216.198.79.65`, `64.29.17.1`. No CNAME | Vercel, Expo pilot |
| `barmibuddy.info` and `www` | `ns1`–`ns3.nameserver.net.au` | A `103.42.108.46` (PTR `redirection.synergywholesale.com`) | VentraIP parking page over HTTP. HTTPS fails with a TLS alert |

Vercel DNS publishes A records for the `.com` names. Those addresses had no PTR. The HTTP `server: Vercel` header is what identifies the host.

**Registrar (RDAP).** Both domains are `active`, registrar Synergy Wholesale Accreditations Pty Ltd (IANA 1609). Registered 28 April 2026, expiry 28 April 2027. `.com` last changed 10 August 2026, which is when the nameservers show as moved to Vercel. `.info` last changed 12 August 2026 and is still on the `nameserver.net.au` nameservers. The `.info` SOA serial on the day of this check was `2026111201`.

**Mail.** No MX on either apex. No TXT on `barmibuddy.com`, `app.barmibuddy.com`, or `barmibuddy.info`. No `_dmarc` on `.com`. `_dmarc.barmibuddy.info` is `v=DMARC1; p=none;`. No Resend DKIM or send-subdomain records (`resend._domainkey`, `send`) on either domain. `.com` CAA allows `sectigo.com`, `letsencrypt.org`, and `pki.goog`. `.info` has no CAA.

**What serves `barmibuddy.com` now.** Vercel serves the marketing page. VentraIP is not in the `.com` DNS path. `barmibuddy.info` is the VentraIP page titled "Domain Parked With VentraIP".

## 3. Backend, and whether the live site works

**Verified live.** The pilot does not work. Headless Chrome loaded https://app.barmibuddy.com on 12 November 2026. The page fired this uncaught exception and left the document body empty:

> Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy apps/mobile/.env.example → apps/mobile/.env and fill in values from your Supabase project (Settings → API).

The shipped JavaScript throws that at module load. Metro has already constant-folded the missing env, so there is no URL left to read. The bundle contains no `supabase.co` host and no JWT-shaped key. It never reaches the network.

**Which Supabase project.** The only ref in this repo is `tvplzwbkfesqtvtebsdd`, in `CLAUDE.md`. The client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` at build time (`.env.example` is a placeholder). `apps/web` reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` the same way. `supabase/config.toml` sets `project_id = "barmibuddy"`, which is a local CLI name, not a cloud ref. This repo does not mention `xrryaceahppytfaobttj` (People), `xcyolqozfmvwqchxjtgi` (Dash), or `nmpgyustqhdzhiqpycdr` (Aix-proposals). Those projects were not opened.

**Paused.** The Supabase management API describes `tvplzwbkfesqtvtebsdd` as "jonmoskay's Project", region `ap-southeast-1`, created 29 April 2026, Postgres 17, status `INACTIVE`. That is the paused state. Public DNS for `tvplzwbkfesqtvtebsdd.supabase.co` and `db.tvplzwbkfesqtvtebsdd.supabase.co` is NXDOMAIN (Cloudflare SOA for `supabase.co`). The project was not resumed, and its tables were not listed or queried. Supabase's current pausing guide says a paused project can be restored for 90 days after the pause. This check did not read the pause timestamp, so the remaining window is unknown. The project still exists.

**From the repo — what the code expects.**

Auth is a Supabase client with a persisted session (`AsyncStorage` on the mobile adapter; the web export still loads that module). `detectSessionInUrl` is false. No screen calls `signIn`, `signUp`, or an OAuth provider. `CLAUDE.md` already records that auth is not wired into screens. Dashboard auth providers were not read.

Edge functions in the repo, both with `verify_jwt = true`:

- `coach-feedback` — `gpt-4o-mini` chat, secret `OPENAI_API_KEY`
- `transcribe-audio` — Whisper, same secret

`PitchPractice` calls both. The live bundle includes those call sites and still dies while importing the client, so they do not run. Whether the functions are actually deployed on the paused project was not read.

Tables the TypeScript client knows (`packages/db/src/types.ts`): `profiles`, `progress`, `sessions`, `teacher_profiles`, `student_setups`, `practice_sections`, `teacher_student_messages`. The only migration, `supabase/migrations/202605250001_teacher_student_setup.sql`, creates the four teacher tables and enables RLS so `auth.uid() = teacher_id` (or `= id` on `teacher_profiles`). There is no migration here for `profiles`, `progress`, or `sessions`. No application code inserts into any of these tables. The teacher screen keeps students in React state. No storage bucket is named anywhere in the repo.

Other services in application code: OpenAI, only inside those two functions; Sefaria, only from `apps/web/app/api/sefaria-text/route.ts`. No Stripe, no Resend client, and no analytics SDK. The word `resend` in the live bundle is the Supabase realtime client's `resend()` method.

## 4. What data it could be holding

Not measured. No production query was run, and the paused API hostname does not resolve.

**On the device, if an older build was used before this crash.** `apps/mobile/src/storage.ts` stores everything in AsyncStorage, which on web is the browser's localStorage:

- `bb:role`, `bb:profile` (username, city, synagogue, optional parsha and bar mitzvah date, team, character, teacher contact)
- `bb:lessons` (title, and the teacher recording as a URI, which can be a data URL)
- `bb:attempts`, `bb:pitchAttempts` (scores, transcripts, feedback)
- `bb:streak`

That data is per browser. This repo has no export of it, and the current bundle crashes before those screens load. Old keys can still be sitting in browsers that used an earlier deploy.

**In the paused Supabase project, if anything was ever written.** The migration's columns can hold a teacher's auth user, a student's name and Hebrew name, father and mother names, lineage, bar mitzvah date, service and section, Hebrew and transliteration text, a guide-audio URL, and message bodies. `auth.users` could hold emails if accounts were created outside this UI. Storage objects are possible only if a bucket was created in the dashboard; this repo does not define one. Row counts are unknown. Because no screen writes these tables, an empty database is plausible, and it is not proven.

The OpenAI key, if it was set as a function secret, lives only on that project. It is not in git. Deleting the project removes it.

## 5. Keeping it safe before any retirement

Do this before deleting the Vercel project, the domain, or the Supabase project. None of it was done in this audit.

1. Keep access to GitHub `jonmoskay/barmibuddy`, the Vercel project that serves `app.barmibuddy.com`, the Supabase org that owns `tvplzwbkfesqtvtebsdd`, and the Synergy Wholesale / VentraIP account for both domains. Domains expire 28 April 2027. Dropping `.com` DNS would also take down the marketing site on the apex.
2. Save the public deployment as a file snapshot (the HTML and the `/_expo/static/js/web/` bundle already downloaded during this check). The source matching that client is this git repo. Keep the marketing-site repo as well; it is a separate Vercel deployment.
3. Treat the Supabase project as possibly holding the personal data in section 4 until a dump says otherwise. Restoring it is a production change. Supabase documents a 90-day restore window after a pause, and this audit did not see the pause date, so restore it deliberately and soon if a dump is wanted. On resume, dump every schema including `auth` (Postgres 17), download any Storage objects, and note whether `OPENAI_API_KEY` is set. Function source is already in `supabase/functions/`. Pause again, or delete, only after that dump is stored somewhere durable. A dashboard visit after restore counts as activity; leaving it running will keep the Free-plan project awake.
4. There is no mailbox to export: neither domain publishes MX. There is no Resend DNS to preserve.
5. Student practice from the working period of the pilot is in browsers under the `bb:*` keys. A server backup will not contain it. Anyone who still has a browser profile from that period would need to export localStorage themselves.
6. Restricting the pilot without a backup is low urgency for new data entry: the live page already crashes, and the API host does not resolve. Restricting DNS or deleting the project is what would make a later dump impossible.

People, Dash, and Aix-proposals were left untouched.
