# Testing strategy and results

> Historical record. For current guidance, see the [product roadmap](../../roadmap.md).

## Baseline and scope

Jest originally failed before running tests because `jest.config.ts` could not resolve `next/jest`. There were five metric and five scoreboard tests, plus two Playwright tests; one browser test used an obsolete storage key and fixed round ID. A valid baseline coverage percentage was unavailable.

Jest explicitly collects coverage for `lib/game`, `lib/hooks`, `components`, and API routes. The earlier modernization baseline was 45.8% statements overall and 91.54% for pure game code. The multiplayer pass added round, progress, guest-cookie and browser coverage; its final measured coverage belongs in `03-progress.md`. UI/hook coverage in Jest excludes Playwright flows, so the total is not a product-quality score.

## Automated checks

UI tests locate controls by accessible role when that expresses the interaction, and use stable `data-testid` hooks for race phase, passage, input, connection state, results, and statistics. These hooks expose state through `data-phase` or `data-status` without tying tests to headings, helper copy, CSS classes, or element nesting. Assertions still check meaningful player names, typed characters, rankings and calculated scores: those values are the behavior under test. Keep test IDs local to stable interaction boundaries rather than adding one to every decorative element.

- Pure tests cover five-character speed, CPM, Unicode, punctuation, whitespace, zero time, mistakes/corrections, deadline behavior, invalid edits, and restart.
- History tests cover malformed storage and the 50-record cap.
- Round tests cover lobby/race/results boundaries and automatic rollover. Progress tests reject malformed and implausible peer events, stale snapshots and post-completion regressions, and check calculated ranking.
- Presence table tests cover waiting, connection state, seeding, peer validation, delayed updates, results ranking and departed racers. Guest-session tests cover cookie signing, expiry, tampering and origin/name validation. Pusher auth tests cover signed identity, channel restrictions and request abuse. A separate body-reader test covers omitted `Content-Length` and UTF-8 byte caps.
- Credential-free Playwright tests run in desktop and mobile Chromium. They cover guest name persistence, an unsaved profile draft across round rollover, shared phase transitions, completed race/history, backspace/bulk paste, overflow, small landscape, reduced motion, and axe accessibility in light/dark schemes and results.
- The opt-in live Pusher test uses two browser contexts. One device clock is skewed by 90 seconds. It checks same-room presence, peer progress, reload snapshot recovery, offline/online connection feedback, results and the next lobby.
- Portable UI module tests check the button's pending/duplicate-action behavior and the text field's accessible label and help text. The room view tests still exercise Pusher handlers through the new hook seam.
- `pnpm test:coverage` enforces a realistic floor for `lib/game`: 80% statements, branches and functions, and 85% lines. Whole-app Jest coverage is reported for context; hooks exercised in Playwright are not fully counted there.

## Local verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
pnpm exec playwright install chromium  # first time only
pnpm test:e2e
LIVE_E2E=1 pnpm exec playwright test e2e/multiplayer.spec.ts --project=chromium  # with local Pusher credentials
pnpm audit --prod
pnpm audit
```

Playwright starts a local server on port 3100 with Pusher values empty by default, so CI needs no external credentials. `LIVE_E2E=1` lets Next load local Pusher credentials and enables the two-browser suite. Do not put credentials in CI until the owner provisions them. Manual screen-reader, keyboard-only, zoom and real-device checks should accompany a public release; axe cannot replace them. No remote deployment was tested by these local commands.
