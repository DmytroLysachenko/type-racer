# Development guide

## Setup and checks

Use the Node and pnpm versions declared in `package.json`. Run `pnpm install --frozen-lockfile`, copy `.env.example` to an ignored local environment file, and run `pnpm dev`. Pusher credentials enable live multiplayer; without them, the race is still usable locally.

Before sharing changes, run `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test:coverage`, `pnpm test:e2e`, and `pnpm build`. The opt-in configured Pusher test uses `LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium`. Never place secret values in tests, documentation or committed files.

GitHub Actions repeats credential-free checks on pushes and pull requests. It has no deployment job. Configure branch protection in the remote repository if these checks should be required before merging; that remote setting is outside this local project work.

## Where changes belong

- Put pure typing rules, round timing and score calculations in `lib/game`. Keep them independent of React, Pusher and browser storage where possible.
- Put original exercise text in `lib/content`. Published shared passage sets are immutable; follow [the content guide](lib/content/README.md) and the [architecture](docs/architecture.md) before editing them.
- Put browser lifecycle and external event wiring in `lib/hooks` or the relevant adapter. `useRoomStandings` owns Pusher subscription state; `ScoreTable` renders it.
- Keep Next.js routes in `app/api`, with shared request/session helpers under `lib/http` and `lib/guest-session.ts`.
- Use `components/ui` and `styles/tokens.css` for controls and styles that are useful across screens or projects. Keep race-specific layouts in application views and `app/globals.css`. See [design-system.md](docs/design-system.md) before extracting a new primitive.
- Add behavioral tests at the module interface. Unit tests cover pure rules and result migration; browser tests cover the race, personal practice, accessibility and responsive interaction. The live Pusher suite covers cross-browser delivery and reconnection.

Use native HTML semantics and current tokens before adding a dependency or abstraction. A new reusable module should hide a repeated behavior or accessibility requirement; avoid wrappers that only rename a single HTML element.
