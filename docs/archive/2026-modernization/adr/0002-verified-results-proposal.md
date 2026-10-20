# Proposed: authoritative results and optional account sync

> Historical record. For current guidance, see the [product roadmap](../../../roadmap.md).

Status: **Proposed; not implemented** (2026-10-17)

## Context

The current product is a guest-first social race. Pusher client events give responsive peer feedback, but a guest can fabricate their own typed text and elapsed time. Personal results are device-local and may include imported legacy records. A verified public leaderboard or cross-device history changes the trust, privacy and infrastructure model. The repository has no provisioned shared datastore, account provider or identity policy. Local Pusher credentials do not solve those gaps.

## Proposed product contract

- Keep anonymous live racing and private practice available without registration.
- Label existing Pusher standings and imported local records **unverified** permanently. Never promote them into verified results during migration.
- Add an opt-in account only when cross-device history is a confirmed requirement. Imported local records need an explicit review and consent step, source marker, duplicate handling and deletion path.
- If public competition is approved, define what “verified” means: the server observed an ordered, plausible attempt for a specific round and identity. This does **not** prove a human typed it; automation resistance remains an abuse-control problem.

## Architecture to implement after provisioning

1. Issue a short-lived, single-round attempt token bound to the server-selected passage version, round ID and guest/account identity. Bind all writes to that token and an idempotency key.
2. Accept ordered append/backspace/composition events through a server-observed channel. The server timestamps receipt, checks sequence, text bounds, deadline and replay, and derives final metrics with the same pure rules used locally. Client-reported WPM is ignored. Batch/transport choices must be load-tested against the selected host; Pusher client events are not an authoritative transport.
3. Store attempt identity, passage version, derived result, verification level and retention/deletion state in a transactional shared datastore. Use atomic completion so two instances cannot both finalize the same attempt. Keep short-lived event evidence separately with a defined retention period; do not retain arbitrary custom text.
4. Apply distributed limits to guest creation, room authorization and attempt events using a shared limiter or provider edge controls. Partition limits by signed identity and privacy-reviewed network signals. Avoid process-memory counters on serverless instances.
5. Publish leaderboard rows only from server-finalized attempts. Keep the social Pusher table as low-latency unverified feedback. Show verification labels in the UI and API, and enforce ownership on private history and deletion endpoints.
6. Add an optional account provider only after choosing identity policy, recovery model, session/cookie settings and data residency. Require minimal scopes. Guest play stays available; the account is for sync and ownership, not a prerequisite for typing.

## Migration and tests

- Keep the current local history schema readable. Offer explicit import into an account as **self-reported history** with its original mode, timestamp and content version. Do not deduplicate silently or overwrite device data before confirming successful sync.
- Test cross-instance concurrent completion, duplicate/replayed events, disconnect/retry, token expiry, identity mismatch, forged speed, room rollover, quota abuse, deletion and account recovery against a provisioned staging datastore and transport.
- Measure write volume and latency during a full 20-second race before committing to a provider. Server-side processing must not block local input or delay the social room.
- Verify HTTPS cookies, secrets, retention jobs, backup/restore, privacy copy and deletion on the deployed environment before calling results authoritative.

## Decision needed

Select and provision the shared datastore, authoritative event transport and optional account provider; choose whether verified public competition and account sync are actual product requirements. Agree on retention and identity/abuse policy. Until then, the existing guest-first social release remains the supported architecture.
