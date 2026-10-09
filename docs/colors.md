# Colours

This is the colour reference for the Family Budget SPA. The tokens live in
`src/styles/theme.css`; this page explains where they come from and how to use them. The
plan behind it is the workspace's `.docs/redesign.md` (M17), and the rules for new
screens are in the workspace's `design` skill.

## 1. One input: the primary hue

The user picks one number in settings, `primaryHue` (0–359; default **150**, a "dollar"
green). It's stored on the account and cached on the device. Everything else is
calculated from it:

```
primaryHue ──► palette.ts paletteFor(hue) ──► --primary-h  --primary-c  --primary-l  --tertiary-c
                                                    │ (set on <html> by ThemeService)
                                                    ▼
                                      theme.css derives every --color-* / --gradient-*
```

`core/theme/palette.ts`:
- **Chroma:** a binary search for the highest chroma at which `oklch(L C hue)` still fits
  sRGB, capped at **0.18**. Every hue gets as vivid as it can without clipping, and none
  goes muddy. The result is rounded *down*, so it stays in gamut.
- **Tertiary chroma:** the same search, at hue + 60 (`--tertiary-c`).
- **Lightness:** it starts at **54%**. While white text on either gradient stop is under
  4.5:1, it drops 1% and recomputes. For today's cap no hue needs that, but the loop
  keeps the guarantee if the numbers change.

`ThemeService`:
- **`useHue(hue)`:** applies the hue, keeps it, and caches it in `localStorage`
  (`primaryHue`).
- **`previewHue(hue)`:** applies it only. The settings dialog uses this.
- **`restoreHue()`:** re-applies the kept hue, for example when the dialog closes
  unsaved.
- **Order of preference:** the account's setting, then the device cache, then 150.

`theme.css`'s defaults equal `paletteFor(150)`, so the first paint already matches.

## 2. Light and dark

Each token holds both values in `light-dark(light, dark)`. `ThemeService` switches
`color-scheme` on `<html>` (`light`, `dark`, or `light dark` to follow the device). No
component knows which theme is active.

## 3. Tokens

In the tables, `n` stands for `var(--neutral-c) var(--primary-h)`: neutrals with a faint
tint of the primary hue (`--neutral-c` is 6% of the primary chroma). `P` stands for
`var(--primary-c) var(--primary-h)` and `T` for `var(--tertiary-c) var(--tertiary-h)`.

### Inputs

| Token | Default | Set by |
|---|---|---|
| `--primary-h` | 150 | ThemeService (palette.ts) |
| `--primary-c` | 0.148 | ThemeService (palette.ts) |
| `--primary-l` | 54% | ThemeService (palette.ts) |
| `--tertiary-c` | 0.093 | ThemeService (palette.ts) |
| `--tertiary-h` | `--primary-h` + 60 | theme.css |
| `--neutral-c` | `--primary-c` × 0.06 | theme.css |

### Text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-text` | `oklch(26% n)` | `oklch(93% n)` | body text, headings |
| `--color-text-secondary` | `oklch(43% n)` | `oklch(82% n)` | labels, secondary info |
| `--color-text-muted` | `oklch(52% n)` | `oklch(70% n)` | hints, metadata |

### Surfaces (Material 3 surface containers)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `oklch(98.5% n)` | `oklch(15% n)` | the page, under `--gradient-soft` |
| `--color-surface-container-lowest` | `oklch(100% 0 0)` | `oklch(19% n)` | cards, dialogs, inputs |
| `--color-surface-container-low` | `oklch(97.5% n)` | `oklch(22% n)` | rows inside cards |
| `--color-surface-container` | `oklch(95.5% n)` | `oklch(25% n)` | dialog hero band |
| `--color-surface-container-high` | `oklch(93.5% n)` | `oklch(29% n)` | tracks, wells |
| `--color-surface-container-highest` | `oklch(91% n)` | `oklch(33% n)` | the strongest well |

### Lines and disabled

| Token | Light | Dark |
|---|---|---|
| `--color-border` | `oklch(90% n)` | `oklch(35% n)` |
| `--color-border-strong` | `oklch(80% n)` | `oklch(46% n)` |
| `--color-disabled` | `oklch(84.5% n)` | `oklch(38% n)` |
| `--color-on-disabled` | `oklch(100% 0 0)` | `oklch(65% n)` |

### Primary, secondary, tertiary

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-primary` | `oklch(var(--primary-l) P)` | same | fills behind white text |
| `--color-primary-hover` | L − 8%, C × 0.85 | same | hovered primary fills |
| `--color-primary-text` | `oklch(52% P)` | `oklch(75% C×0.7 H)` | primary-coloured text and links |
| `--color-primary-soft` | `oklch(95.5% C×0.15 H)` | `oklch(30% C×0.35 H)` | selected rows, hints, art panels |
| `--color-primary-border` | `oklch(86% C×0.3 H)` | `oklch(45% C×0.5 H)` | borders of soft areas |
| `--color-on-primary` | white | white | text and icons on primary and gradients |
| `--color-secondary-container` | `oklch(92% C×0.3 H)` | `oklch(32% C×0.3 H)` | tonal buttons, chips |
| `--color-on-secondary-container` | `oklch(28% C×0.5 H)` | `oklch(90% C×0.3 H)` | text on those |
| `--color-tertiary` | `oklch(var(--primary-l) T)` | same | second gradient stop, accents |
| `--color-tertiary-text` | `oklch(50% T)` | `oklch(78% Tc×0.6 Th)` | tertiary text |
| `--color-glow-primary` / `-tertiary` | primary/tertiary at α 0.16 | α 0.22 | soft light behind art and pages |
| `--color-gradient-start` / `-end` | primary / tertiary | L − 8%, C × 0.85 | gradient stops (deeper in dark mode) |

### Status (fixed hues, so their meaning never changes with the brand colour)

| Token | Light | Dark |
|---|---|---|
| `--color-danger` (+ `-soft`, `-border`, `--color-on-danger`) | `oklch(57% 0.19 25)` | `oklch(70% 0.16 22)` |
| `--color-success` (+ `-soft`) | `oklch(52.4% 0.14 150)` | `oklch(75% 0.15 150)` |
| `--color-warning` (+ `-soft`) | `oklch(55.7% 0.115 83)` | `oklch(80% 0.13 85)` |

Illustrations also draw their gold coins with `--color-warning`.

### Effects

`--color-focus` (the primary), `--color-shadow`, `--color-shadow-soft`, `--color-backdrop`, and
`--color-state-on-gradient` (a 14% black layer). Controls on the primary gradient (nav tabs,
header buttons) use it as their hover state: the usual light state layer would push their
white text below AA.

### Gradients

| Token | Value | Use |
|---|---|---|
| `--gradient-primary` | 135°, gradient-start → gradient-end | app bar, page headers, `.btn-filled`, auth panel, budget bars |
| `--gradient-soft` | two radial glows (primary top left, tertiary top right) | page background, dialog hero band |
| `--gradient-card` | glow-primary fading out over 120px | the top of every `.card` |
| `--hue-track` | every hue at L 54% | the colour picker's slider |

`.palette-swatch` (also in theme.css) paints a preview of *another* palette: the
element sets `--swatch-h/-c/-tertiary-c/-l`. The settings swatches use it.

### Shape, elevation, state, type

- **Radius:**
  - `--radius-sm` (8px): fields, chips;
  - `--radius-md` (12px): rows;
  - `--radius-lg` (16px): cards;
  - `--radius-xl` (28px): dialogs, page headers.
- **Elevation:**
  - `--elevation-0` to `--elevation-3`, built from the shadow tokens;
  - cards use 1, hovered cards and page headers 2, dialogs 3.
- **State layers:** `--state-hover` (8%) and `--state-press` (12%). They're the share of
  the content colour mixed over a control:
  `color-mix(in oklch, currentColor var(--state-hover), transparent)`.
- **Type:** `--type-headline`, `--type-title`, `--type-body` and `--type-label` (`font`
  shorthands on `--font-family`).

## 4. Presets

| Key | Hue | EN | UK |
|---|---|---|---|
| `dollar` (default) | 150 | Dollar green | Доларовий зелений |
| `teal` | 185 | Teal | Бірюзовий |
| `sky` | 230 | Sky | Небесний |
| `blue` | 257 | Blue | Синій |
| `indigo` | 280 | Indigo | Індиго |
| `violet` | 305 | Violet | Фіолетовий |
| `rose` | 350 | Rose | Рожевий |
| `red` | 25 | Red | Червоний |
| `amber` | 70 | Amber | Бурштиновий |

Any other hue can be picked on the "Custom colour" slider.

## 5. Contrast rules and how they're enforced

- **White text on the primary and on the tertiary gradient stop:** ≥ 4.5:1 for every
  hue. `palette.spec.ts` sweeps all 360 hues.
- **`--color-primary-text`** against the background: ≥ 4.5:1 in light and dark for every
  hue. Also in `palette.spec.ts`.
- **Text tokens** pass WCAG AA on the surfaces they're used on, in both themes. They've
  been audited in the browser.
- **No raw colours:** `colors.spec.ts` fails on any hex, `rgb()`/`hsl()`/`oklch()`/…
  or named colour outside `theme.css`, and on `fill`/`stroke`/`stop-color` attributes
  in `.svg` files.

## 6. Adding a token

1. Add it to `theme.css` in the right group, as `light-dark(light, dark)`, derived from
   the inputs (`P`, `T`, `n`). Never use a fixed hue unless it's a status colour.
2. Check its contrast against what it'll sit on, in both themes and at the extreme hues:
   about 70–110 (yellows, the lightest) and 260–300 (blues, the darkest). For text, add
   an assertion to `palette.spec.ts`.
3. Add a row to this page.

## 7. Illustrations

The illustrations are SVG files in `src/app/shared/ui/illustrations`. SVG paint
attributes can't take `var()`, so every shape takes a class from `illustration.css`:

| Class | Paint |
|---|---|
| `.a-primary` / `.a-tertiary` | primary / tertiary |
| `.a-secondary` / `.a-soft` | secondary container / primary-soft |
| `.a-surface` / `.a-muted` | surface-container-lowest / -high |
| `.a-ink` / `.a-on` | text / on-primary |
| `.a-gold` / `.a-success` / `.a-danger` | warning / success / danger |
| `.a-glow` / `.a-glow-2` / `.a-shadow` | glow-primary / glow-tertiary / shadow-soft |
| `.a-line`, `.a-stroke`, `.a-stroke-on`, `.a-stroke-muted` | strokes: border-strong / primary / on-primary / surface-high |
| `.a-stop-1` / `.a-stop-2` | gradient stops (primary / tertiary) |

A gradient fill is `style="fill: url(#<name>-grad)"`, using that SVG's own
`<linearGradient id="<name>-grad">`.

Art drawn on the primary gradient (page headers, the auth panel) sits on a frosted
surface panel, so its gradient shapes don't vanish into the background.
