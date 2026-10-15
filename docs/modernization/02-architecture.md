# Implemented architecture

TypeArena remains a small Next.js App Router application with React, Tailwind and Pusher Channels. The main product flow is multiplayer. Game rules, round scheduling and untrusted peer-event parsing are pure modules under `lib/game`; hooks connect them to the browser. There is no database, account provider or verified leaderboard.

```text
app/page.tsx
  -> useRound.ts -> GET /api/time -> shared lobby/race/results timeline
  -> RaceRound (keyed by round ID) -> useTypingProgress -> lib/game/session + metrics + local history
                                            -> lib/pusher.client (progress broadcast)
       -> TypingArea (receives typing state)
       -> ScoreTable (receives local progress) -> useRoomStandings -> lib/game/progress (parse/rank peers)
                                                       -> lib/pusher.client (presence/snapshots/status)
  -> Profile (outside keyed race) -> usePlayer -> POST /api/guest (signed guest cookie)
app/api/pusher/auth -> signed guest cookie + recent round -> Pusher server
components/ui + styles/tokens.css + styles/primitives.css -> reusable React UI foundation
```

## Shared timeline

`getCurrentRound(serverNow)` is the single interface for a 31-second cycle: five-second lobby, 20-second race and six-second results. The room ID and passage stay stable through all three phases. `/api/time` returns an uncached server timestamp. `useRound` estimates network travel time and projects that sample with `performance.now()`, resampling on tab visibility and every minute. The page waits for the first sample, with a four-second device-clock fallback if the request fails. The same phase controls input eligibility, countdown, Pusher presence and results. A browser that joins during a race gets the remaining time; the next lobby gives everyone a shared start.

`inputRace` accepts one Unicode code point at the end or one final-character deletion. Bulk paste/drop changes are rejected by that rule while the browser's paste action remains available. `performance.now()` measures the typing attempt, bounded by the remaining round. On completion or the transition to results, statistics freeze and a device-local history record is saved. History is capped at 50 results.

## Multiplayer data flow and trust

A guest obtains a server-generated UUID in a signed, HttpOnly, SameSite cookie with a signed 30-day expiry. `/api/pusher/auth` reads that cookie rather than accepting an ID from query parameters. A separate `SESSION_SECRET` may sign the cookie; otherwise the server uses `PUSHER_SECRET` with a distinct HMAC context. Display names remain editable. The server authorizes recent `presence-round-{id}` channels only; both server routes cap request bytes and reject cross-origin writes.

The browser sends bounded progress through Pusher client events. `parseProgress` checks its shape, size, round, elapsed time and simple physical plausibility. `ScoreTable` compares the claimed ID with [Pusher's presence-event `user_id` metadata](https://pusher.com/docs/channels/using_channels/events/), which comes from the server-issued channel authorization, and recomputes WPM and accuracy from typed text and reported elapsed time. Presence supplies displayed names, and the room asks peers to resend their latest snapshot when a visitor reconnects. Completed attempts remain in the current results table when someone leaves. The table states connection health and labels standings as unverified.

`mergeProgress` accepts only monotonic elapsed time and lifetime counters and freezes completed snapshots. This keeps delayed network events and presence rejoins from visibly rewinding a racer. It is a deep, pure module seam shared by the room and tests; it does not make client-submitted scores trustworthy.

**Trust limit:** a connected guest can still fabricate their own progress or elapsed time in a Pusher client event. Pusher sender metadata prevents payload-level impersonation, but does not prove human typing or prevent someone from creating multiple guest sessions. These rankings are social feedback, not verified competition. A trusted leaderboard would require server-observed input, durable cross-instance storage, replay/idempotency control and a stronger identity/abuse policy. No such leaderboard is claimed here.

## Deployment

Pusher credentials are required for multiplayer. Without them, typing and local history remain available, and the room reports that it is offline. Browser offline/online events immediately change the connection state and reconnect Pusher; a returning subscription requests peer snapshots. Server secrets stay server-side; public Pusher key/cluster must be present at build time. The server clock and signed-cookie routes are stateless and work across serverless instances sharing the same signing secret. No production infrastructure or database was changed by this modernization.

## Module structure and reuse

`lib/game` is the pure domain module for config, rounds, input state, metrics, progress validation and local history. `lib/hooks` owns browser lifecycle and external event wiring. `RaceRound` owns one typing session and passes its progress directly to both the input view and standings view; there is no hidden global progress event. Only that race subtree resets on the next round, so an unsaved profile edit survives rollover. `useRoomStandings` is the seam between Pusher and the table: it returns ranked rows, active member IDs and connection status, leaving `ScoreTable` to render. The hook remains app-specific; it is not part of the shared UI library.

`components/ui` and `styles/tokens.css`/`styles/primitives.css` form the portable foundation. Their interfaces depend on React and native HTML only, and the style tokens can be rethemed in another project. [Design system guidance](../design-system.md) describes the copy boundary. A monorepo package or generic repository layer would add maintenance before there is a second consumer, so neither was introduced.
