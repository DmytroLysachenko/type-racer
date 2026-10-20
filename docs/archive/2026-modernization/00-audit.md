# Repository audit (2026-10-11)

> Historical record. For current guidance, see the [product roadmap](../../roadmap.md).

## Current application

- Next.js 15.4.6 App Router, React 19.1, TypeScript 5, Tailwind 4, Pusher Channels. Node 24.18 and pnpm 11.11 are installed; the repository has both `pnpm-lock.yaml` and an untracked `package-lock.json`. README says pnpm, so pnpm is the intended package manager.
- `app/page.tsx` composes a 20 second wall-clock round, typing input, Pusher presence scoreboard, and browser-stored guest profile. All visitors share a sentence selected by the epoch round number. There is no login, database, or durable server session.
- `lib/hooks/useRound.ts` polls wall time every 250 ms in each consumer. `useTypingProgress.ts` owns input, metrics, progress broadcasts and finish POST. `lib/store.ts` stores names and lifetime aggregates in process memory; `/players` renders those records with raw JSON. Pusher presence authorization trusts identity from query parameters and client events provide displayed scores.
- React escapes user text in rendering. Strict TypeScript is on. A small set of Jest tests and one Playwright file exist. The baseline production build, TypeScript check and `next lint` pass. Jest coverage could not be measured: `jest.config.ts` imports `next/jest` without the `.js` extension and Jest fails to load it. The baseline build reports 121 kB first load JS for `/`.
- Existing uncommitted edits affect 23 tracked files; an untracked `/players` page and npm lock also exist. They predate this modernization and must be preserved where possible.

## Strengths to retain

- Small codebase, clear page/component split, client-side immediate typing feedback, presence scoreboard, accessible native input, sensible 20 second shared-round concept, strict TypeScript, and both unit and E2E harnesses.

## Findings

| Priority | Area                  | Current limitation and effect                                                                                                                                                                                                                                                  |
| -------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P0       | Score integrity       | `/api/finish` passes `(playerId, roundId, wpm)` into `finishRound(playerId, wpm, accuracy)`. The store records the epoch round ID as WPM and user WPM as accuracy. Scores are entirely client supplied; there is no authenticated identity or score verification.              |
| P0       | API and presence      | Routes cast unvalidated JSON; malformed JSON can throw. `/api/pusher/auth` authorizes arbitrary channel names and accepts spoofable query identity. `/players` exposes process-memory player IDs and names. Pusher credentials are assumed even for solo use.                  |
| P0       | Typing correctness    | WPM counts whole words instead of standard five-character units. Input permits paste, text beyond target, and editing at arbitrary positions. A round may start with little time left; finish can post without any typing. Round boundary resets the input and clears results. |
| P1       | Lifecycle and time    | `Date.now()` is read in render calculations, WPM starts at component mount, and no immutable completion snapshot exists. Each `useRound` consumer creates an interval. Hidden tabs and clock changes can affect the countdown and score.                                       |
| P1       | Persistence           | Guest identity is unvalidated JSON in localStorage. Server data disappears on restart and may differ between instances. No race history or personal best survives locally. There is no authentication, so server scores cannot be trusted.                                     |
| P1       | Tooling               | Jest config is broken; ESLint disables `no-explicit-any`; test fixtures and Pusher types use `any`. Two lockfiles cause drift. `npm audit` reports 27 vulnerabilities (1 critical, 7 high, 19 moderate) against the npm lock baseline, including the pinned Next version.      |
| P2       | UI/accessibility      | Default styling has weak hierarchy, little focus styling, no prominent caret, no results view, and no responsive structure. Timer copy is misleading. Scoreboard gives no trust or connection status. Metadata is generic; `/players` should not be indexed.                   |
| P2       | Tests                 | Five metric cases and five scoreboard cases, no transition/input/API tests. Playwright uses the wrong localStorage key and a fixed round ID, so its score test is unreliable. Coverage baseline unavailable until Jest is repaired.                                            |
| P3       | Performance/dead code | Live metric work and broadcasts occur on typing events, multiple polling intervals run, and `useRound` is duplicated. Unused starter SVGs, `CHANNEL`/finish broadcast plumbing, and verbose generated comments add noise. Need measure before wider optimization.              |

## Security boundary

This is a guest application. Local history is a convenience, not a competitive record. Pusher client events and all browser-submitted stats are untrusted. A trustworthy global leaderboard would require authenticated server identity plus server-observed input/session validation and durable storage; that is outside this modernization.
