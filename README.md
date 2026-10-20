# TypeArena

A live multiplayer typing racer with synchronized lobbies, 20-second races and shared results. Players type the same passage, see each other's progress through Pusher Channels, then move to the next lobby together. Personal results stay on your device.

## Features

- Server-synchronized round clock, shared lobby/race/results phases, rotating passage, presence room and live standings.
- Private practice with 15/30/60/120-second and 25/50/100-word tests, plus original short thoughts, punctuation, numbers, gentle/challenge and Polish exercises, and private custom text.
- Mode-specific personal bests, a small recent-results chart, accuracy-based next steps, and a retry of passages containing often-missed target characters.
- Connection status and progress recovery when a visitor reloads or rejoins a room.
- Five-character net/raw WPM and CPM, Unicode-aware character accuracy, and corrected/remaining error counts.
- Server-signed, expiring guest identity for room authorization, editable name and bounded device-local history with JSON export and deletion. The last practice mode is saved; custom text is not saved. No account or database is required for social races.
- Responsive light/dark/system themes with a saved preference, reusable semantic tokens, accessible controls, visible keyboard focus, and reduced-motion support.

## Stack and architecture

Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Pusher Channels, Jest/Testing Library, and Playwright. Pure rules live in `lib/game`; `lib/content` holds versioned original passages. The race shell is server-rendered, while `RaceClient` projects the clock and manages live browser state. `useRoomStandings` owns presence events and exposes room state to a rendering-only table. `/practice` runs typing calculations in the browser. `/api/guest` issues a signed HttpOnly guest cookie and `/api/pusher/auth` uses it to authorize recent presence rooms. Peer events remain **unverified** and must not be used for a trusted competitive leaderboard. See [architecture](docs/architecture.md) and the [portable design system](docs/design-system.md).

## Local setup

Use Node 22+ and pnpm 11.11 (Corepack recommended).

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000> for the live race or <http://localhost:3000/practice> for private practice. Configure `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, and `NEXT_PUBLIC_PUSHER_CLUSTER` in `.env.local` for multiplayer. An optional `SESSION_SECRET` can sign guest cookies separately; use a long random value. Set `SITE_URL` to the stable production origin, such as `https://example.com`, in both build and runtime environments; it enables canonical links, a two-page sitemap, and race/practice share previews. Keep `PUSHER_SECRET` and `SESSION_SECRET` server-only. The Pusher Channels app must support presence channels and client events. Without Pusher values, typing still works locally, but other players cannot appear.

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
| `E2E_BASE_URL=http://localhost:3000 pnpm test:e2e`                                | Run browser tests against an existing local server without starting another Next process        |
| `LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium` | Real two-browser Pusher presence, reload recovery and round results; requires local credentials |
| `pnpm audit`                                                                      | Dependency advisory report                                                                      |
| `pnpm measure:performance http://localhost:3200 5`                                | Repeatable Chromium lab probe against a running production server                               |
| `pnpm verify:deployment https://example.com --require-seo --require-cookie`       | Page, clock, metadata and guest-cookie smoke checks for a deployed origin                       |

GitHub Actions CI checks production dependency advisories, lint, typecheck, format, game coverage, build, and credential-free desktop/mobile browser flows on pushes and pull requests; it can also be started manually. It does not deploy. Check the GitHub Actions run for the pushed revision before treating remote CI as verified. Playwright starts a test server on port 3100. The opt-in live suite uses the local Pusher configuration and is excluded from CI unless credentials are supplied. Deployment remains owner-managed; no CD pipeline was added.

After deployment, run `pnpm verify:deployment <stable-production-origin> --require-seo --require-cookie` against the configured `SITE_URL`. The script creates one ordinary guest session but stores no result. It checks public pages, canonical URLs, sitemap/robots, server time and cookie flags; run the separate live two-browser test and manual device review for presence, input and assistive technology.

For the local performance probe, run `pnpm build`, start the production server with `pnpm exec next start -p 3200`, then run `pnpm measure:performance http://localhost:3200 5` in another terminal. Results are lab samples, not field Web Vitals.

## Deployment considerations

The practice page can export or delete all saved race and practice results. Custom text and its result stay in the current tab and are not added to device history.

The browser stores race and practice history locally; clearing storage or switching devices loses it. Multiplayer needs a configured Pusher Channels app. The server gives each guest a signed room identity and a clock sample; the browser projects that clock with monotonic time. The room checks Pusher's sender metadata against each progress payload, so a guest cannot claim another active guest's identity by editing the payload. A connected guest can still fabricate their **own** typing and elapsed time, even though malformed and implausible payloads are rejected. The standings are social and unverified. The app has no durable server score history or trusted leaderboard. Deploy with HTTPS, server-only secrets and public Pusher values available at build time. A verified competition would need server-observed race activity, durable shared storage, stronger abuse controls and an account or identity policy.

Guest cookies issued before the signed-expiry change receive a new identity because their issue time cannot be established. Browser-local history remains on that device. Older results stay readable and migrate into the current local schema when a new result is saved. Versioned room names may temporarily separate visitors during a content rollout.

## Further documentation

The [documentation index](docs/README.md) points to the current architecture, design system, roadmap, and release guide. [CONTRIBUTING.md](CONTRIBUTING.md) explains module placement and test expectations; the [domain glossary](CONTEXT.md) defines the product terms. Dated audit and performance reports are preserved in the [modernization archive](docs/archive/2026-modernization/README.md).
