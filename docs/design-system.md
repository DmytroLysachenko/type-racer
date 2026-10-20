# Reusable UI foundation

The shared visual foundation is intentionally small. It can be copied into another React project without Next.js, Pusher or game code. Keep race-specific views such as `TypingArea` and `ScoreTable` in this application.

## Tokens

`styles/tokens.css` defines semantic colors, font stacks, spacing, radii, elevation and focus width. Components use tokens such as `--color-surface` and `--color-text` rather than choosing a light or dark value themselves. The same names map to dark-theme values through `prefers-color-scheme` when the user selects System. Explicit Light and Dark choices are stored locally and applied by `data-theme` before paint; see [architecture.md](architecture.md).

The current TypeArena theme uses a cool slate canvas, cobalt for interactive emphasis, and a darker timing rail for the active round. `--color-passage` separates the text to type from the surrounding panel; `--color-on-contrast` and `--color-on-contrast-muted` keep rail text legible in both themes. Restrained corners and flat progress lanes make the race feel like a timing desk. Archivo is the body face and Oswald is used for large display numbers and headings. `app/layout.tsx` loads these through `next/font`; the portable token file retains system fallbacks for projects that do not use Next.js.

Use semantic color tokens in shared UI. Race-specific states, layout, and motion belong in `app/globals.css`. The phase rail is a compact overview of the 5-second lobby, 20-second race, and 6-second results window. It is a status display, not navigation. Keep the passage and input prominent, especially at narrow widths; the mobile layout places the input in the first viewport at 375px. Respect `prefers-reduced-motion` and retain visible keyboard focus.

To reuse the theme, import `styles/tokens.css` before `styles/primitives.css` in the destination app's global CSS. Change the token values for that product; preserve the semantic names so shared controls continue to work. The app-specific `app/globals.css` contains the race layout and should not be copied as a generic library.

## UI modules

`components/ui` exports two React modules with no Next.js imports:

- `Button` forwards native button attributes and adds `pending`, which disables repeat actions and sets `aria-busy` while a request is active. Callers still choose the action and visible loading label.
- `TextField` forwards native input attributes and connects a visible label and optional description to the input. Pass `className` for the field wrapper and `inputClassName` for input-specific styling. The caller owns validation and data flow.

Both use classes from `styles/primitives.css`. Their interface stays close to native HTML so keyboard, autofill and form submission keep their normal behavior. The small barrel file `components/ui/index.ts` is the import surface. Tests in `__tests__/ui-primitives.test.tsx` exercise the accessible behavior.

Before a release, review IME/autocorrection, screen-reader use, browser zoom, and the complete keyboard flow on physical devices. Automated axe and viewport checks are useful regressions but do not establish WCAG conformance; see the [release guide](release.md).

The practice page keeps timed and word-count choices at the top. Focused modes use a native disclosure after the typing area, preserving the first mobile viewport for the input. The recent-results bars are decorative; the adjacent ordered list contains exact WPM and accuracy. Export/delete controls use a second confirmation step and a status message. The compact mobile clock keeps the heading stable while fonts load.

Do not extract a separate npm package until a second project actually consumes these modules. At that point, move `components/ui` and the two CSS files together, add a versioned package interface and verify the destination's CSS import order. The game, Pusher hooks and API routes are product-specific and should stay here.
