# Web interface review

Reviewed the race, room, profile and global styles on 2026-10-11 against the [current Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) and the UI/UX Pro Max interaction priorities. This is a source and automated-browser review, not a manual screen-reader or device certification.

## Resolved findings

- `components/TypingArea.tsx` — paste was cancelled at the DOM level. The browser may now paste; the pure race rule rejects a bulk change while preserving the current value.
- `components/TypingArea.tsx` — progress animated `width`; it now animates `transform` and stops under reduced motion.
- `components/Profile.tsx` — the display-name input lacked a stable `name` and autocomplete choice; both are explicit through the shared `TextField`.
- `components/ScoreTable.tsx` — standings headers lacked explicit column scope; all have `scope="col"`.
- `styles/primitives.css` — buttons and fields now share token-driven focus, hover, disabled and busy styling.
- `app/globals.css` — mobile shell insets did not account for landscape device safe areas; side padding now respects `env(safe-area-inset-*)`.

## Verification and remaining manual review

- Desktop and mobile Chromium flows pass, including 375px portrait, 667×375 landscape, reduced motion, light/dark and results axe checks.
- Before owner release, manually test keyboard-only flow, 200% zoom, a screen reader and actual touch devices. Automated checks cannot prove reading order or real-device ergonomics.
