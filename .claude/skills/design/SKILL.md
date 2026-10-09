---
name: design
description: Design system of the Family Budget SPA (Material 3 look, OKLCH tokens from one user-chosen hue, gradients, themed SVG illustrations). Load before any UI, styling or visual work in budget-app-front — new screens, dialogs, forms, colours, illustrations.
---

# Design (`budget-app-front`)

**Reference:** the frontend repo's `docs/colors.md` (every token). **Plan:** the workspace's
`.docs/redesign.md` (M17). Load the `frontend` skill too.

## Colour
- **One input:** the user's primary hue, default 150 (a "dollar" green).
  `core/theme/palette.ts` turns it into the CSS inputs, and `ThemeService.useHue` sets
  them on `<html>`. Everything else is derived from them in `src/styles/theme.css`.
- **Tokens only:**
  - Use `--color-*`, `--gradient-*`, `--radius-*`, `--elevation-*`, `--state-*` and
    `--type-*`.
  - Never use hex, `rgb()`, `oklch()` or named colours outside `theme.css`.
    `colors.spec.ts` enforces this, `.svg` files included.
  - A colour you need that doesn't exist yet goes into `theme.css` (see colors.md §6).
- **M3 roles:**
  - primary, for fills behind white text and links;
  - `--color-primary-soft`, for selected states;
  - secondary container, for tonal buttons and chips;
  - tertiary (hue + 60), for the second gradient stop;
  - surface containers, lowest (cards, dialogs) to highest (wells, tracks);
  - status colours, which keep fixed hues.
- **Text on the primary or a gradient** uses `--color-on-primary`.
  `palette.spec.ts` keeps it at AA for every hue.

## Components (global classes in `src/styles.css`)
- **Buttons:**
  - `.btn-filled` (on a gradient) for the main action;
  - `.btn-tonal` for "Add" in page headers and secondary actions;
  - `.btn-outlined` and `.btn-text` for cancel and minor actions;
  - `.btn-danger` for destructive actions.
- **Containers:**
  - `.card`: a surface with a gradient wash and elevation 1; add `.interactive` for a
    hover lift;
  - `.field`: the label above, an outlined input, select or textarea;
  - `.chip`;
  - `.empty-state`;
  - `.panel-header` (small art + `h2`/`h3`).
- **Dialogs:** a native `<dialog>` gets the M3 shape, elevation, backdrop blur and an
  entry animation.
- **Motion:** keep it subtle. `prefers-reduced-motion` turns it off globally.

## Every screen
- **Page:** `<app-page-header [title] [subtitle]>`, with `<button actions class="btn-tonal">`
  and `<app-<page>-art art />`. Subtitles are `<page>.subtitle` keys in EN and UK.
- **Form panel or dialog:** a `.panel-header` with its small art.
- **Empty list:** `<div class="empty-state"><app-empty-art /><p>…</p></div>`.
- **Registration:** add the template to `shared/ui/illustrations/screens.spec.ts`.

## Drawing a new illustration
- **Files:**
  - `shared/ui/illustrations/<name>.svg`;
  - `<name>-art.ts` (selector `app-<name>-art`, `templateUrl: './<name>.svg'`,
    `styleUrl: './illustration.css'`, host `aria-hidden="true"`, `class="art"`).
- **SVG rules:**
  - `viewBox="0 0 320 200"`, no width or height, no `<text>`;
  - no `fill`, `stroke` or `stop-color` attributes; colour only through the `.a-*`
    classes (colors.md §7);
  - a gradient is `<linearGradient id="<name>-grad">` with `.a-stop-1`/`.a-stop-2` stops,
    used as `style="fill: url(#<name>-grad)"`;
  - flat style: a soft `.a-glow` backdrop, a `.a-shadow` ground ellipse, a few
    sparkles, and gold (`.a-gold`) for money;
  - it must show what the screen is about.
- **Registration:** add the component to `illustrations.spec.ts`.
- **Check it** in both themes, on a white surface and in a page header (where it sits on
  a frosted panel), and at a couple of hues: render it in headless Chrome or the running
  app.

## Checks before you finish
- `npx ng test --watch=false` (palette, colours, illustrations, screens).
- **Browser:** light and dark, hues 150, 257, 70 and 350, and a 375px width (no
  sideways page scroll; the header art hides).
