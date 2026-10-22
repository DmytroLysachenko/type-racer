# Release guide

## Configuration

Use Node 22+, Corepack, and pnpm 11.11. Install with `pnpm install --frozen-lockfile`. Configure `PUSHER_APP_ID`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_KEY`, and `NEXT_PUBLIC_PUSHER_CLUSTER` for live rooms. Set a long server-only `SESSION_SECRET` if cookie signing should be separate from Pusher. Set `SITE_URL` to the stable HTTPS production origin at build and runtime for canonical URLs, sitemap, and social previews. See [.env.example](../.env.example) for the variable names.

Set `NEXT_PUBLIC_PROGRESS_INTERVAL_MS=1000` at build time for the default one-second peer update cadence. Values from `250` to `10000` are accepted; invalid values use `1000`. Changes to this public client setting require a new build. Review Pusher message usage after reducing the interval.

Guest play and personal practice remain available without Pusher. Do not expose `PUSHER_SECRET` or `SESSION_SECRET` through `NEXT_PUBLIC_` variables. A production deployment needs HTTPS for Secure guest cookies.

## Before release

1. Run `pnpm install --frozen-lockfile`, `pnpm audit --prod --audit-level high`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm test:coverage`, `pnpm build`, and `pnpm test:e2e`.
2. Review the hosted GitHub Actions run for the exact revision being released. Local results cannot substitute for a hosted run.
3. Confirm the deployment's build and runtime variables, domain, logs, and page availability.
4. Run `pnpm verify:deployment https://YOUR_ORIGIN --require-seo --require-cookie`. The command creates one stateless guest session and checks public routes, canonical URLs, icons, social preview images, server time, sitemap, and cookie flags. A missing `SITE_URL` fails the SEO checks.
5. With Pusher configured, run `LIVE_E2E=1 E2E_BASE_URL=https://YOUR_ORIGIN pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium --workers=1`. Repeat a manual two-device join, reconnect, result, and rollover; inspect logs if a peer is missing.
6. Check keyboard navigation, zoom, screen-reader output, virtual keyboard, and IME/autocorrection on representative real devices. Record any reproduction before changing input behavior.

The local performance probe is `pnpm measure:performance <origin> 5` against a running production build. It reports lab samples, not field INP or a Core Web Vitals pass. Historical baselines and method are in the [performance archive](archive/2026-modernization/performance.md).

## Data and trust

Results are saved in browser storage and can be exported or deleted from practice. A new device or cleared profile cannot recover them. Live standings are social feedback from client events; never publish them as verified rankings. The [roadmap](roadmap.md) describes the infrastructure needed for authoritative results.
