# Product roadmap

TypeArena is a guest-first social typing race with private practice. Live standings are explicitly unverified because peers submit their own progress. Personal results and preferences stay in the browser. The [architecture](architecture.md) describes the current implementation.

## Release verification

- Run the full quality suite and inspect the hosted CI result for the release commit.
- Verify the deployed origin with the [release guide](release.md), including `SITE_URL`, HTTPS guest cookies, the live two-browser flow, reconnect, and round rollover.
- Review keyboard use, browser zoom, touch input, IME/autocorrection, and a screen reader on physical devices. Automated axe and emulated viewports do not establish WCAG 2.2 AA conformance.
- Compare field LCP, CLS, and INP only after choosing a privacy-preserving collection method. Do not transmit typed text or display names for telemetry.

## Maintenance

- `pnpm audit --prod --audit-level high` gates production advisories in CI. Recheck development dependencies when upstream fixes become available. The dated [dependency findings](archive/2026-modernization/audit.md) explain advisories observed during that audit.
- Keep published shared passages immutable. Add a content version and new room identity when changing them; see the [content guide](../lib/content/README.md).
- Review local-history migration before changing the record schema. A saved result must remain readable or be explicitly migrated.

## Future product choices

Verified public rankings would require server-observed attempts, replay protection, shared transactional storage, and an abuse and identity policy. Cross-device history would also require optional accounts, explicit import consent, retention, and deletion. These are separate product decisions; the [proposal](archive/2026-modernization/adr/0002-verified-results-proposal.md) records the tradeoffs. The current social race does not depend on them.

Additional exercises or languages should use rights-reviewed material and a clear learning purpose. Sound effects, achievements, and daily challenges are optional ideas, not release requirements.
