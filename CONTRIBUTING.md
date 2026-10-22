# Development guide

## Setup and checks

Use the Node and pnpm versions declared in `package.json`. Run `pnpm install --frozen-lockfile`, copy `.env.example` to an ignored local environment file, and run `pnpm dev`. Pusher credentials enable live multiplayer; without them, the race is still usable locally.

Set `NEXT_PUBLIC_PROGRESS_INTERVAL_MS` in `.env.local` to tune the minimum time between progress broadcasts while typing (default `1000` ms; accepted range `250`–`10000` ms). The first input and completion send immediately. Next.js embeds public variables in the browser bundle, so production changes require a rebuild and redeploy. Keep real credentials in ignored environment files and use `.env.example` only for names and safe sample values.

Before sharing changes, run `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test:coverage`, `pnpm test:e2e`, and `pnpm build`. The opt-in configured Pusher test uses `LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium`. Never place secret values in tests, documentation or committed files.

GitHub Actions repeats credential-free checks on pushes and pull requests. It has no deployment job. Configure branch protection in the remote repository if these checks should be required before merging; that remote setting is outside this local project work.

## Where changes belong

- Put pure typing rules, round timing and score calculations in `lib/game`. Keep them independent of React, Pusher and browser storage where possible.
- Put original exercise text in `lib/content`. Published shared passage sets are immutable; follow [the content guide](lib/content/README.md) and the [architecture](docs/architecture.md) before editing them.
- Put browser lifecycle and external event wiring in `lib/hooks` or the relevant adapter. `useRoomStandings` owns Pusher subscription state; `ScoreTable` renders it.
- Keep progress cadence parsing in `lib/config/progress-interval.ts` and broadcasting in `useTypingProgress`. `TypingArea` renders the same validated room progress as passage markers; preserve the standings table as the accessible source of exact peer positions. Test first input, throttling, completion, and reconnect behavior when changing the broadcast path.
- Keep Next.js routes in `app/api`, with shared request/session helpers under `lib/http` and `lib/guest-session.ts`.
- Use `components/ui` and `styles/tokens.css` for controls and styles that are useful across screens or projects. Keep race-specific layouts in application views and `app/globals.css`. See [design-system.md](docs/design-system.md) before extracting a new primitive.
- Add behavioral tests at the module interface. Unit tests cover pure rules and result migration; browser tests cover the race, personal practice, accessibility and responsive interaction. The live Pusher suite covers cross-browser delivery and reconnection.

Use native HTML semantics and current tokens before adding a dependency or abstraction. A new reusable module should hide a repeated behavior or accessibility requirement; avoid wrappers that only rename a single HTML element.

The tracked `AGENTS.md` contains the Next.js development agent rules. Before changing Next.js APIs or route conventions, read the relevant installed guide in `node_modules/next/dist/docs/`, as that file requests. Keep it tracked so `next dev` does not leave a generated, uncommitted copy.
