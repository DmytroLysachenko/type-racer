# Reusable UI foundation

The shared visual foundation is intentionally small. It can be copied into another React project without Next.js, Pusher or game code. Keep race-specific views such as `TypingArea` and `ScoreTable` in this application.

## Tokens

`styles/tokens.css` defines semantic colors, font stacks, spacing, radii, elevation and focus width. Components use tokens such as `--color-surface` and `--color-text` rather than choosing a light or dark value themselves. The same names map to dark-theme values through `prefers-color-scheme`.

To reuse the theme, import `styles/tokens.css` before `styles/primitives.css` in the destination app's global CSS. Change the token values for that product; preserve the semantic names so shared controls continue to work. The app-specific `app/globals.css` contains the race layout and should not be copied as a generic library.

## UI modules

`components/ui` exports two React modules with no Next.js imports:

- `Button` forwards native button attributes and adds `pending`, which disables repeat actions and sets `aria-busy` while a request is active. Callers still choose the action and visible loading label.
- `TextField` forwards native input attributes and connects a visible label and optional description to the input. Pass `className` for the field wrapper and `inputClassName` for input-specific styling. The caller owns validation and data flow.

Both use classes from `styles/primitives.css`. Their interface stays close to native HTML so keyboard, autofill and form submission keep their normal behavior. The small barrel file `components/ui/index.ts` is the import surface. Tests in `__tests__/ui-primitives.test.tsx` exercise the accessible behavior.

Do not extract a separate npm package until a second project actually consumes these modules. At that point, move `components/ui` and the two CSS files together, add a versioned package interface and verify the destination's CSS import order. The game, Pusher hooks and API routes are product-specific and should stay here.
