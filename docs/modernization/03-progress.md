# Progress and recovery

Last updated: 2026-10-11. The social multiplayer pass and additional local hardening are implemented and locally verified. Competitive score verification, shared storage and deployed-environment validation remain open production gates. A later user request authorized packaging the work into 20 commits and pushing `main`; the commit dates were explicitly assigned across 2026-10-11 through 2026-10-15. No production infrastructure was edited through this repository.

Current pass: reusable module seams, design tokens, UI primitives and CI coverage completed locally; history is organized into 20 focused commits. Competitive results and deployed-environment checks remain open gates.

## Completed

- [x] Audited the original Next.js/Pusher application, its score endpoint, dependencies, tests and initial behavior. Historical findings are in `00-audit.md`.
- [x] Modernized framework/tooling, typing metrics and input rules, local history, responsive design, accessibility, metadata, CI and developer docs in the earlier phases.
- [x] Restored and then strengthened the multiplayer-first flow: one shared room and passage per round; server-sampled clock projected with `performance.now()`; five-second lobby, 20-second race and six-second results phase.
- [x] Kept a room through its results phase. Added ordered standings, compact mobile results, clear phase countdown and connection feedback. Racers who leave after typing retain their current-round result.
- [x] Added Pusher progress snapshot requests on subscription, stale-state replacement on reconnect, and immediate browser offline/online handling. Limited snapshot responses to avoid amplification.
- [x] Replaced query-supplied Pusher identity with a signed HttpOnly guest cookie. The guest route validates name and origin; room authorization derives identity from the cookie. A dedicated `SESSION_SECRET` is optional, with `PUSHER_SECRET` as a compatible fallback.
- [x] Parse bounded peer events, compare claimed guest ID with Pusher's signed presence sender metadata, and recompute display scores from typed text and reported elapsed time. Mark peer standings unverified. Removed the old corruptible process-memory score endpoint and public debug page.
- [x] Added round, progress, guest-cookie, authorization, component and two-browser Pusher coverage. The live test deliberately skews one device clock by 90 seconds and exercises reload, network interruption, results and rollover.
- [x] Updated README, architecture, decision log, testing guide and suggested commit groups.
- [x] Rejected stale/out-of-order Pusher snapshots and preserved progress on presence rejoin. Expired signed guest sessions, capped request streams without relying on `Content-Length`, rejected duplicate auth fields and cross-origin auth requests.
- [x] Applied current Web Interface Guidelines to the live UI: paste remains available to the browser while bulk race input is rejected by game rules, progress uses a transform, form/input attributes and table headers are explicit, controls have hover/touch feedback, and safe-area/landscape/reduced-motion behavior is checked.
- [x] Added basic response security headers and verified a production build. Updated the roadmap so competitive and deployment gates are visibly unchecked.
- [x] Moved round/config rules into `lib/game` and Pusher standings lifecycle into `useRoomStandings`; `ScoreTable` now renders state supplied through that interface.
- [x] Added `RaceRound` as the keyed typing-session owner and passed local progress explicitly into the standings view. The profile now stays mounted through round rollover, preserving an unsaved name draft.
- [x] Extracted portable semantic tokens and shared `Button`/`TextField` controls. Added a design-system guide describing how to reuse them in another React app without copying race-specific code.
- [x] Added a game-rule coverage floor to Jest and GitHub Actions CI, plus least-privilege workflow permissions and concurrency control. CI remains test-only; inspect its remote result for the pushed revision.
- [x] Enabled TypeScript `noUncheckedIndexedAccess`, moved the Node requirement to 22+ to match pnpm 11 and CI, added `.nvmrc` and `CONTRIBUTING.md`, and verified an offline frozen-lockfile install.

## Verification

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`: pass.
- `.github/workflows/checks.yml` parses locally and contains one read-only quality job with lint, types, formatting, coverage, build and credential-free browser checks. A GitHub-hosted run must be checked separately after the push; no CD/deployment job was created.
- `pnpm test:coverage`: 33 tests in ten suites pass. Statement coverage is 49.08% across the explicitly listed source files; `lib/game` is 89.25%, metrics 100%. The enforced game-rule floor is 80% statements/branches/functions and 85% lines. Browser-tested UI/hooks are not fully represented in Jest's coverage count.
- `pnpm test:e2e`: twelve desktop/mobile Chromium flows pass; the two live Pusher cases are skipped without credentials. Automated axe checks cover light, dark and results views; the flows cover small landscape, reduced motion and profile draft survival across a round rollover.
- `LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium --reporter=list`: one real two-browser Pusher test passes with local credentials after the room-hook refactor, including device-clock skew, progress, reload snapshots, offline/online recovery, results and next lobby.
- `pnpm build`: pass after the explicit-progress refactor. Routes emitted: `/`, `/api/guest`, `/api/pusher/auth`, `/api/time`, icon and robots. An E2E navigation also asserted the `X-Content-Type-Options: nosniff` response header.
- `pnpm install --frozen-lockfile --offline`: pass with pnpm 11.11.0. The package engine, `.nvmrc`, README and workflow all target Node 22+.
- Mobile 390px light/dark screenshots were inspected after the UI extraction; form alignment and race layout remain intact. The screenshots were temporary and are not in the repository.
- `pnpm audit --prod`: no known production dependency vulnerabilities.
- Full `pnpm audit`: one high and one moderate advisory in development-only transitive packages (`braces` via ESLint tooling and `sprintf-js` via Jest tooling). The npm registry currently publishes [braces 3.0.3](https://www.npmjs.com/package/braces) and [sprintf-js 1.1.3](https://www.npmjs.com/package/sprintf-js); the advisory's requested patched versions are not published. Recheck when upstream releases appear.
- Mobile 390px race and results screenshots inspected; the results view fits without page overflow. A real local offline/online browser probe also showed immediate offline feedback and successful reconnection.

## Architecture and trust limits

- Multiplayer requires a configured Pusher Channels app with presence and client events. Without it, the app still supports local typing and history.
- Guest IDs are server-signed for channel membership, and peer events must match Pusher's sender metadata. An authorized guest can still fabricate their own typed text or elapsed time and can create multiple guest sessions. A client-reported elapsed time is not proof of human typing. The displayed standings are social feedback, not a trusted leaderboard.
- Guest cookies have a signed 30-day expiry. Existing cookies without that signed expiry will become new guest sessions after this update. They cannot be silently migrated because their original issue time was not recorded.
- The owner has now set a nonempty `SESSION_SECRET` in the ignored local `.env`; only presence was checked, and the value was not printed or changed. This covers local dedicated cookie signing. Vercel environment configuration has not been checked or changed.
- A verified leaderboard or cross-device history requires server-observed race activity, durable shared storage, replay/idempotency controls and a stronger identity/abuse policy. No such infrastructure or production database was introduced.
- Server clock sampling limits ordinary device skew; network latency and temporary outages can still shift a boundary slightly. A joining visitor receives only the time left in the current race and can wait for the next lobby.
- Manual screen-reader and real-device checks, field Core Web Vitals, and the already deployed Vercel instance were not exercised in this local pass.

## Earlier baseline

- Before modernization, TypeScript, lint and build passed, but Jest could not start due to its `next/jest` import. The initial npm-lock audit reported 27 advisories against an untracked npm lock; the project now uses the tracked pnpm lock. The initial Next.js 15 page reported 121 kB first-load JavaScript.

## Final working-tree review

- The source changes were divided into 20 focused commits at the user's later request. The ignored `.env` was read only; no secrets were printed or added to tracked files.
- `git diff --check` passed before committing. The Next.js dev server's generated untracked `AGENTS.md` was removed after inspecting its local Next.js guide instruction. No credentials or unexpected generated files were staged. The ignored `.env` was not modified.

## Remaining release gates and next actions

1. Review the 20-commit history in `06-review-and-commit-guide.md` and the GitHub Actions result for the pushed revision.
2. Set a dedicated random `SESSION_SECRET` in the Vercel environment before deploying if separate cookie signing is desired. Keep it server-only and consistent across instances.
3. If competitive results are required, select and provision a shared datastore and decide the identity policy; then implement and exercise the server-observed scoring path in `01-roadmap.md`. No datastore credentials are currently present and remote infrastructure changes are outside authorization. Do not promote client events into a public leaderboard.
4. Check whether the owner's Vercel integration deployed the pushed `main` revision, then repeat the live two-device and cookie checks against that environment. No direct deployment command or production infrastructure change was made in this work.
