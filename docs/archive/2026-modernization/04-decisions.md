# Decision log

> Historical record. For current guidance, see the [product roadmap](../../roadmap.md).

## 2026-10-11: Preserve the existing stack

Next.js, React, Tailwind and Pusher already support the small application. A rewrite, full auth provider, database, or atomic-design hierarchy would increase cost without solving the immediate correctness failures. Use pure game helpers and small adapters instead.

## 2026-10-11: Guest scores are local and unverified

The present API accepts self-reported WPM and Pusher client events are forgeable. Do not publish server aggregates as competitive records. Keep bounded personal history in the browser, disclose that scope in the UI, and treat peer progress as informal. A verified leaderboard is a separate architecture project.

## 2026-10-11: Prefer standard five-character speed units

Whole-word counting varies with sentence vocabulary and suppresses useful partial progress. Raw WPM counts typed characters per five; net WPM counts correct characters per five, both divided by elapsed minutes. Accuracy is correct characters divided by typed characters. Report mistakes and corrections separately. Clamp zero/invalid elapsed time to zero speed instead of inventing a one-millisecond race.

## 2026-10-11: pnpm is the source of dependency truth

README and tracked lockfile already use pnpm. The untracked npm lock is likely a local install artifact. The modernization will use pnpm and remove the extra lockfile after ensuring no other work depends on it.

## 2026-10-11: Restore shared multiplayer rounds

This intermediate decision was superseded by the server-sampled clock below. The initial modernization briefly introduced personal timers and a fixed room. That weakened the existing multiplayer product, so it was reversed. A shared passage, countdown and Pusher room were restored before the later lobby/race/results model was implemented.

## 2026-10-11: Remove the score endpoint and public process store

`/api/finish` both called the store with the wrong argument order and accepted forged scores. The store was process-local and had no user authorization. Retiring the endpoint, store and `/players` debug route is safer and simpler than adding fake validation around untrusted client scores. Results now belong to bounded device-local history. Pusher auth remains guest-based and only validates channel/payload shape.

## 2026-10-11: Upgrade Next.js and keep ESLint 9

Next.js 16.4 and React 19.3 build and test with Node 22+ and the repo's Node 24 environment. Next 16 removes `next lint`, so the ESLint CLI and flat Next config are used. ESLint 10 currently conflicts with peer ranges of Next's React/accessibility plugins, so ESLint 9.39 is retained until those peers update. TypeScript is held at 5.9 rather than upgrading blindly to 7.

## 2026-10-11: Dependency advisory response

A lockfile refresh cleared production advisories. The remaining development-only `braces` and `sprintf-js` advisories lack published patched versions at the time of review. No unsupported override is applied. A published `diff` patch is pinned via pnpm overrides. Recheck periodically.

## 2026-10-11: Server-sampled round clock and visible phases

The previous shared rounds used each browser's wall clock. That separated visitors with skewed clocks and gave no clear common start or results. One pure round module now defines a five-second lobby, 20-second race and six-second results window. Browsers sample `/api/time` and project it with monotonic time; they resample after tab visibility changes. The first room waits for a sample, with a four-second fallback for an unavailable server clock. This stays stateless and works on Vercel without another service. It is synchronized to network precision, not a hard real-time guarantee.

## 2026-10-11: Keep social standings distinct from verified scores

Pusher client events do not attest to human typing. The standings parse bounded progress and recompute display metrics, but elapsed time and input are still submitted by clients. We explicitly label results unverified and do not persist them as public records. A trusted leaderboard would need a different server-observed event and storage architecture. Adding a client-only anti-cheat label or process-local score map would give false assurance.

For presence channels, [Pusher supplies the sender's authenticated `user_id` as event metadata](https://pusher.com/docs/channels/using_channels/events/). The room checks it against each payload's claimed player ID, preventing one subscribed guest from attributing their event to another guest. It still cannot establish that the submitted typing was real.

## 2026-10-11: Signed guest identity for presence

The former Pusher auth route accepted a guest ID and name from query parameters. The server now issues a signed HttpOnly cookie and derives Pusher presence identity from it. This prevents a visitor from authorizing a room membership by merely changing a query string. It does not prevent multiple guest accounts or forged Pusher client progress. `SESSION_SECRET` can separate cookie signing from Pusher credentials; the Pusher secret is a compatible fallback for the existing deployment.

## 2026-10-11: Minimal live-room design

The UI/UX design search suggested real-time monitoring cues but also surfaced a 3D gaming style with poor performance and accessibility fit. The application keeps its restrained visual system and adds a compact phase banner, connection state, shared results and responsive standings. Motion remains subordinate to typing; no animation or large visual dependency is added.

## 2026-10-11: Make progress monotonic and expire guest sessions

Late Pusher events and a member rejoin previously replaced newer progress with an empty or older snapshot. A pure `mergeProgress` module now accepts a peer update only when elapsed time and lifetime counts do not regress; a completed snapshot is final. Presence name updates preserve the existing row. This improves social results consistency but still cannot authenticate a racer's own text or timing.

Signed guest cookies now carry an expiry inside the authenticated payload, so a copied cookie cannot outlive the browser's `Max-Age` merely by being replayed. Cookies issued before this change lack the signed expiry and will be renewed as a new guest on first visit. Both guest and Pusher authorization routes cap actual streamed request bytes. A shared in-memory rate limiter was rejected because Vercel instances would not share its state.

## 2026-10-11: Keep competitive scoring behind a real storage decision

The existing product can be deployed as a social multiplayer racer with clearly unverified standings and device-local history. A public leaderboard, prizes or durable shared results require a new server-observed scoring path and atomic shared storage. The current environment provides Pusher credentials but no shared datastore credentials, and this task forbids changing remote infrastructure. This gate remains open in `01-roadmap.md`; no process-memory or client-only imitation is presented as protection.

## 2026-10-11: Extract only reusable interfaces with proven callers

The visual system previously lived in one app stylesheet with hardcoded colors, spacing and controls. Semantic tokens and primitive styles now live under `styles`; `Button` and `TextField` under `components/ui` are used by multiple views and have no Next.js dependency. Game-specific race and standings views stay in the app. The same rule applies to logic: `lib/game` owns pure round and typing rules, `useRoomStandings` owns Pusher lifecycle, and `ScoreTable` renders returned state. This creates useful seams without turning the repository into a premature monorepo or publishing a package before another project consumes it.

The GitHub workflow is CI only. It gates tested game logic and browser behavior; it cannot prove production Vercel settings. No deployment job was added. A later user request explicitly authorized pushing the prepared commits to `main`; any Vercel integration triggered by that push must be verified separately.

`noUncheckedIndexedAccess` is enabled alongside strict TypeScript checks. The bundled passage list has an explicit nonempty invariant; tests assert their indexed fixtures. This catches accidental missing array elements without introducing runtime branches for impossible paths.

The previous Node `>=20.9` engine range was inconsistent with pnpm 11, which requires Node 22+. The engine range, `.nvmrc`, README and CI now agree on Node 22+.

## 2026-10-11: Pass race progress through a keyed owner

The typing hook and standings previously shared local progress through a browser-wide custom event. A `RaceRound` component now owns the typing session for one round and passes progress as an explicit prop to both views. This makes the dependency visible in React and keeps the profile outside the keyed subtree, so a draft name is not lost on round rollover. Pusher remains the transport for other racers; local progress does not need to travel through that service to appear in the current browser.
