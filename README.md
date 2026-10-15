# TypeArena

A live multiplayer typing racer with synchronized lobbies, 20-second races and shared results. Players type the same passage, see each other's progress through Pusher Channels, then move to the next lobby together. Personal results stay on your device.

## Features

- Server-synchronized round clock, shared lobby/race/results phases, rotating passage, presence room and live standings.
- Connection status and progress recovery when a visitor reloads or rejoins a room.
- Five-character net/raw WPM and CPM, Unicode-aware character accuracy, and corrected/remaining error counts.
- Server-signed, expiring guest identity for room authorization, editable name and bounded device-local history. No account or database is required for social races.
- Responsive light/dark interface built on reusable semantic tokens and accessible UI controls, with keyboard focus styles and reduced-motion support.

## Stack and architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Pusher Channels, Jest/Testing Library, and Playwright. Pure rules live in `lib/game`; `useRound` projects the server clock, while the race hook connects typing rules to local history and peer progress. `useRoomStandings` owns presence events and exposes room state to a rendering-only table. `/api/guest` issues a signed HttpOnly guest cookie and `/api/pusher/auth` uses it to authorize recent presence rooms. Peer events remain **unverified** and must not be used for a trusted competitive leaderboard. See [architecture](docs/modernization/02-architecture.md) and the [portable design system](docs/design-system.md).

## Local setup

Use Node 22+ and pnpm 11.11 (Corepack recommended).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>. Configure `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, and `NEXT_PUBLIC_PUSHER_CLUSTER` in `.env.local` for multiplayer. An optional `SESSION_SECRET` can sign guest cookies separately; use a long random value. Keep `PUSHER_SECRET` and `SESSION_SECRET` server-only. The Pusher Channels app must support presence channels and client events. Without Pusher values, typing still works locally, but other players cannot appear.

## Commands

| Command                                                                           | Purpose                                                                                         |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm dev`                                                                        | Local development server                                                                        |
| `pnpm build` / `pnpm start`                                                       | Production build / serve                                                                        |
| `pnpm lint` / `pnpm typecheck`                                                    | Static checks                                                                                   |
| `pnpm format:check` / `pnpm format`                                               | Prettier check / write                                                                          |
| `pnpm test:ci`                                                                    | Jest unit, component, and route tests                                                           |
| `pnpm test:coverage`                                                              | Jest suite with a maintained coverage floor for pure game rules                                 |
| `pnpm test:e2e`                                                                   | Desktop and mobile Chromium flows; first run `pnpm exec playwright install chromium`            |
| `LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium` | Real two-browser Pusher presence, reload recovery and round results; requires local credentials |
| `pnpm audit`                                                                      | Dependency advisory report                                                                      |

GitHub Actions CI runs lint, typecheck, format, game coverage, build, and credential-free desktop/mobile browser checks on pushes and pull requests; it can also be started manually. It does not deploy. Check the GitHub Actions run for the pushed revision before treating remote CI as verified. Playwright starts a test server on port 3100. The opt-in live suite uses the local Pusher configuration and is excluded from CI unless credentials are supplied. Deployment remains owner-managed; no CD pipeline was added.

## Deployment considerations

The browser stores race history locally; clearing storage or switching devices loses it. Multiplayer needs a configured Pusher Channels app. The server gives each guest a signed room identity and a clock sample; the browser projects that clock with monotonic time. The room checks Pusher's sender metadata against each progress payload, so a guest cannot claim another active guest's identity by editing the payload. A connected guest can still fabricate their **own** typing and elapsed time, even though malformed and implausible payloads are rejected. The standings are social and unverified. The app has no durable server score history or trusted leaderboard. Deploy with HTTPS, server-only secrets and public Pusher values available at build time. A verified competition would need server-observed race activity, durable shared storage, stronger abuse controls and an account or identity policy.

Guest cookies issued before the signed-expiry change cannot be migrated without a recorded issue time; affected visitors receive a new guest ID after this update. Their browser-local race history remains on that device. The release gates for competitive scoring and verification on the deployed Vercel instance are tracked in [the roadmap](docs/modernization/01-roadmap.md).

## Roadmap

The [modernization roadmap](docs/modernization/01-roadmap.md) and [progress tracker](docs/modernization/03-progress.md) describe completed work and deferred options. Daily challenges, multilingual passages, and a verified leaderboard remain future projects.

For module placement, test expectations and reuse guidance, see [CONTRIBUTING.md](CONTRIBUTING.md) and the [design system](docs/design-system.md).
