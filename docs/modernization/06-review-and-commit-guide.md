# Commit history and review guide

At the user's later request, the modernization was divided into 20 focused commits on `main`. Author and committer timestamps were explicitly set to four commits per day on 2026-10-11 through 2026-10-15 (Europe/Warsaw, UTC+02:00). Some dates follow the actual preparation time; they are requested presentation dates, not evidence that the work occurred on those future days.

| #   | Subject                                          | Primary files                                                                        |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1   | `chore: align runtime and upgrade dependencies`  | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.nvmrc`, `next.config.ts`  |
| 2   | `chore: strengthen static checks and formatting` | `eslint.config.mjs`, `tsconfig.json`, editor and Prettier configuration              |
| 3   | `test: repair Jest and browser test setup`       | Jest and Playwright configuration                                                    |
| 4   | `feat(game): define typing rules and metrics`    | Pure game config, metrics, session rules and focused tests                           |
| 5   | `feat(race): sync rounds to server time`         | Round rules, time route and round tests                                              |
| 6   | `feat(history): save bounded local results`      | Local history module and tests                                                       |
| 7   | `fix(api): remove untrusted score endpoints`     | Remove `/api/finish`, `/api/join` and process-local store                            |
| 8   | `feat(auth): issue signed guest sessions`        | Guest cookie, route, player hook and tests                                           |
| 9   | `fix(auth): validate presence requests`          | Limited request reader, Pusher authorization and tests                               |
| 10  | `fix(race): reject stale and invalid progress`   | Peer progress parser, merge rules and tests                                          |
| 11  | `style(ui): extract semantic design tokens`      | Shared token and primitive stylesheets                                               |
| 12  | `feat(ui): add reusable form controls`           | Button and text field modules and tests                                              |
| 13  | `feat(multiplayer): recover room connections`    | Pusher client transport, snapshots and reconnect behavior                            |
| 14  | `refactor(multiplayer): isolate room standings`  | Standings hook, table and component tests                                            |
| 15  | `feat(race): integrate shared typing lifecycle`  | Round/typing hooks, race owner, page, typing/profile UI and obsolete module removal  |
| 16  | `feat(ui): polish responsive race views`         | Global race styles and error view                                                    |
| 17  | `feat(web): improve metadata and app assets`     | Metadata, robots, icon and starter asset removal                                     |
| 18  | `test(e2e): cover race and live multiplayer`     | Desktop/mobile and two-browser Playwright flows                                      |
| 19  | `ci: gate quality checks and browser tests`      | GitHub Actions quality workflow                                                      |
| 20  | `docs: document architecture and development`    | README, contributor guide, environment example, design system and modernization docs |

The commits group changes by concern. Commits 13–16 form one application integration sequence; the final tree, rather than each intermediate point in that sequence, received the full lint, type, unit, browser and build verification. Inspect the final GitHub Actions run after pushing. The workflow has no deployment job, and a connected Vercel project may deploy from `main` independently.

Secrets and generated output were excluded: `.env`, `.env.local`, `.next`, `coverage`, `playwright-report`, `test-results`, browser screenshots and Next.js-generated `AGENTS.md`. The pre-existing untracked npm lock was not included. No force push, branch, tag or direct deployment command was used.
