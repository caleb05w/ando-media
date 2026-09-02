# Affiliate page — landing-system style reference

Extracted from `/landing-page` + `landing-ui/design-system`. Build every
new affiliate section against this, not ad-hoc hexes.

## Type

Components, not raw tags: `Heading`, `Hero`, `Text` from
`@repo/design-system-ui/text` (polymorphic via `as`).

- **Faces** — `sans` Suisse Intl (Geist fallback): body & UI, the default.
  `display` Test Signifier (serif): editorial headings, the landing page's
  voice. `mono` Geist Mono: eyebrows, overlines, keycaps.
- **Scale** — `--text-size-*` tokens: 2xs 10/12 · xs 12/18 · sm 14/21 ·
  md 16/24 · lg 18/27 · xl 20/30 · 2xl 24/30 · 2-5xl 28/33.6 · 3xl 32/35.2 ·
  4xl 48/48 · 5xl 60/60 · 6xl 72/72.
- **Body prose** — `TEXT_BODY_SIZE` = sm on mobile, md from `md:` up. The
  landing page's literal class string:
  `font-sans text-size-sm text-text-primary md:text-size-md`.
- **Section headings** — the landing `ContentHeading`: `Heading as h2`,
  size `Large → XXL`, weight regular (display face), `scroll-mt-24` + `id`.
- **Weights** — regular (400) and medium (500) only.

## Color

Token utilities, not hexes:

- `text-text-primary` #282828 — headings, primary body
- `text-text-secondary` #676767 — captions, supporting text
- `text-text-tertiary` (40% black) — meta, inactive nav
- `text-text-strong` — opaque-black headings
- `text-text-inverse*` — labels on dark surfaces (the graduation card)

Product-UI mockups (the mini shell) keep the app's own palette:
`#1a1817` ink, `#58524e` secondary, `#f0efee` stroke, `#f5f5f4` ground.

## Layout

- `content-frame` utility: centered, `max-width: var(--container-canvas)`,
  responsive inline padding (20 → 32 → 48px).
- The landing prose grid, for any page with a section sidebar:
  `grid grid-cols-1 gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,640px)_minmax(0,1fr)]`
  — sticky `TableOfContents` in the left column, 640px prose center.
- `TableOfContents` from `@repo/design-system-ui/table-of-contents`:
  `items={[{ id, label }]}`, `sticky top-16`, landing passes
  `rootMargin="-80px 0px -55% 0px"` and `linkWidth="fit"`.
- Sections: `pt-20 md:pt-24`, heading then `mt-6` content.

## Controls

- `Button` from `@repo/design-system-ui/button`: `variant` primary (dark
  pill) / secondary (subtle pill), `size` small/medium/large, renders as an
  anchor via the Base-UI `render` prop.

## Motion

- `--ease-fast: cubic-bezier(0.2, 0, 0, 1)` — registered as the `ease-fast`
  Tailwind utility. Leaves immediately, settles softly. Default for hover
  and small transitions.

## Register

The landing page is editorial: serif display headings over sans prose, one
accent blue (#2563eb) spent sparingly, dark surfaces (#1b1b1b) reserved for
product artifacts. Media sits in bands or cards; captions are quiet
(`text-text-secondary`, sm).
