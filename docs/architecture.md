# TypeArena architecture

## Product model

The canonical terms live in [CONTEXT.md](../CONTEXT.md). A round has one shared passage and timeline. Each guest has a race attempt within that round. A practice attempt is private and ends by chosen duration or passage completion. A standing is a peer-submitted snapshot; a personal result is saved locally. They have different trust and persistence properties and should never share a generic `score` model.

## Runtime map

```text
Static race route / metadata / introduction / footer
  ├─ SiteHeader → client ThemePicker
  └─ client RaceClient
      ├─ useRound → GET /api/time → shared 31-second phase projection
      ├─ usePlayer → POST /api/guest → signed guest cookie
      ├─ RaceRound keyed by round ID
      │   ├─ useTypingProgress → pure session + metrics → local history
      │   ├─ TypingArea → visual passage, input, result
      │   └─ ScoreTable → useRoomStandings → Pusher presence and snapshots
/practice → server-rendered entry + client PracticeRun → pure session/metrics + versioned content → local history
POST /api/pusher/auth → signed guest cookie → versioned Pusher presence authorization
GET /share-image → two cached, original social preview variants
```

Personal practice also offers original short thoughts, number and punctuation exercises, gentle/challenge difficulty, Polish text, and custom text. The main timed/word controls remain prominent; the other modes live in a disclosure. `lib/content/practice-material.ts` is separate from shared-room passages. Custom text is normalized in memory, excluded from history, and never sent to the server. The last chosen mode is stored locally with defensive parsing. Device history can be exported as validated JSON or deleted, including legacy records.

`lib/content/passages.ts` holds an immutable, original v2 passage set. The shared round derives its passage from round ID and content version; Pusher room names include v2, while authorization also accepts legacy room names during rollout. `lib/game` is the pure rules module. Its interface is `getCurrentRound`, `inputRace`/`tickRace`/`finishRace`, `computeMetrics`, and progress parsing/ranking. This is the main test seam: callers receive outcomes without needing a browser, network, or React tree. `lib/hooks` adapts those rules to browser time, input events, local storage, and Pusher. `lib/pusher.client.ts` and `lib/pusher.server.ts` are external adapters. Routes validate and authorize requests; they do not calculate typing on the server. The static race shell is a Server Component; input and presence remain in `RaceClient` because they need browser state.

## Timing and scoring invariants

- One round is 5 seconds lobby, 20 seconds racing, 6 seconds results. `getCurrentRound` derives the ID from wall time. The client samples server time and projects it using `performance.now()`; network delay and tab suspension limit exact synchronization.
- The first accepted character starts a race attempt. Remaining round time caps it. Completion or the results phase freezes statistics and saves at most one personal result.
- One character means a visible Unicode grapheme cluster. `lib/game/characters.ts` uses a fast ASCII path for bundled English content and `Intl.Segmenter` for joined/combining input. Canonically equivalent characters compare equal. A bounded IME commit can append or replace the final grapheme; real-device behavior still needs review.
- Raw WPM = all inserted grapheme clusters ÷ 5 ÷ elapsed minutes. Net WPM = currently correct grapheme clusters ÷ 5 ÷ elapsed minutes. Accuracy = currently correct ÷ currently typed, with an empty input defined as 100%. Corrected errors = mistakes ever entered minus errors still present. Zero elapsed time yields zero speed. These definitions are in `lib/game/metrics.ts` and covered by deterministic tests.
- Personal history is capped at 50 records across modes, parsed defensively, and never sent to the server. Version 1 race records remain readable and are copied to version 2 on the next save. Storage failures show a dismissible alert without interrupting the result.
- Accepted mistakes also count the target grapheme that was missed. Saved records keep at most 16 non-whitespace character counts. Recent results show exact WPM in a list with a decorative bar chart, a recommendation derived from measured accuracy/corrections, and a retry of a passage that produced a repeated error. These are local coaching cues, not claims of learning or verified skill.
- Peer progress is shape-checked and bound to Pusher's sender identity. It is still self-reported, so standings remain unverified. Connection status distinguishes an open Pusher socket from a successfully subscribed round room.
- A successful room subscription requests peer snapshots immediately and twice more within three seconds. These bounded retries cover peers resubscribing at the same time; they do not establish deployed reconnection reliability without a live test.

## Theme and UI modules

`styles/tokens.css` maps semantic colors for light and dark. With no explicit attribute, `prefers-color-scheme` controls the theme. An explicit preference is stored in `localStorage` and a fixed inline script sets `data-theme` before styles paint; the HTML attribute is intentionally excluded from hydration comparison. The control is a native labeled select, and a `storage` listener handles changes in another tab. The CSS token names are the reusable interface. Race layout and phase states remain in `app/globals.css`.

`components/ui` contains a Button and TextField that depend on native React/HTML only. The module stays internal until a second project needs it. Race-specific views are not portable primitives. There is no hypothetical repository layer or package split: each extra seam needs a real second adapter or caller.

## Security and deployment

No account, database, or server score history exists. Guest identity is a signed HttpOnly cookie; the browser keeps a display name and local results. Secrets stay in server modules. Public Pusher key and cluster are client configuration. Pusher must be configured for multiplayer; local typing works without it. A verified leaderboard would be a new product and infrastructure decision, with server-observed events, durable storage, abuse limits, and an identity policy.

The committed pnpm lock, `packageManager`, Node 22+ engine, and Corepack CI provide repeatable installs. The small `pnpm-workspace.yaml` holds pnpm 11 build approvals; it is not a multi-package workspace. Vercel's [package-manager docs](https://vercel.com/docs/package-managers) describe Corepack selection, but production project settings and build logs still need owner verification before claiming deployment compatibility.

`SITE_URL` is an optional stable origin supplied at build and runtime. The metadata and sitemap helpers use it for canonical links, Open Graph URLs, `robots.txt`, and the two public sitemap entries, and original race/practice preview images. Search query modes canonicalize to `/practice`. With no origin, the app omits canonical and sitemap references rather than guessing a production domain.
