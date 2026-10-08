---
name: frontend
description: Essential facts about budget-app-front (Angular SPA). Load before reading, changing or testing frontend code, so you skip re-exploring the repo.
---

# Frontend (`budget-app-front`)

**Stack:** Angular 22 (standalone, signals, Signal Forms `@angular/forms/signals`,
`rxResource`), Vitest + jsdom, Transloco for i18n, Prettier (width 100, single quotes).
**Node 22** (nvm default).
- **Build:** `npm run build`
- **Test:** `npm test -- --watch=false`
- **Dev server:** `npm start` on :4200. It proxies `/api`, `/oauth2` and
  `/login/oauth2` to :8080 (`src/proxy.conf.json`).

## Layout (`src/app/`)
- `core/`: `auth/` (`AuthState` signals: token in memory only, refresh cookie;
  `start()` loads family and settings), `http/` (`authInterceptor`, `problem.ts`
  `withUserErrors()`), `i18n/` (`languages.ts`, `LanguageService`, loader), `theme/` (`ThemeService`).
- `features/<domain>/`: `data/` holds an abstract `XRepository` plus `HttpXRepository`,
  bound in `app.config.ts`. Components are `x-list`/`x-form`. `settings/settings-state.ts`
  caches the user's settings.
- Static files go in `public/`, the only folder the build copies. Icons are
  `public/assets/*.svg` (mostly Lucide, ISC), stored as `assets/<name>.svg`.
  - The offered lists and `iconPath()` are in `shared/ui/icon-picker/icons.ts`.
  - The backend also uses `family` and `transit`.
  - Never rename or remove a stored icon.
  - A new icon needs an `icons.<name>` label in both translation files.
- `shared/ui/` holds the badges and `IconPicker` (a Signal Forms control,
  `[formField]`). `model/types.ts` holds every wire type and helper
  (`canRecordOn`, `transactionCurrency`).

## Conventions
- **Components:** `OnPush`, `inject()`, `input()`/`output()`, `@if`/`@for`, and protected
  template members. State goes in signals and `computed`; no NgRx.
- **Repositories** pipe through `withUserErrors()`. Components show `err.message`.
- **i18n:**
  - No literal UI text. Keys live in `src/i18n/en.json` and `uk.json`, with identical
    keys; a spec checks this.
  - Templates use `*transloco="let t"`; TypeScript keeps keys, not strings.
  - Money, numbers and dates go through `translocoCurrency`/`translocoDecimal`/
    `translocoDate`. Never use Angular's `date`/`number` pipes or a fixed `Intl` locale.
  - Error text is `errors.<slug>`; a new slug goes into `KNOWN_PROBLEMS`.
- **Colours:**
  - Only use `var(--color-*)` tokens from `src/styles/theme.css` (OKLCH, `light-dark()`,
    derived from `--primary-h`/`--primary-c`). No hex, rgb or named colours; a spec
    enforces this.
  - The theme switches through `ThemeService` (`color-scheme`).
  - Draw icons with `<app-icon [src]>`, not `<img>`.
  - Keep text at WCAG AA in both themes.
- **Specs:**
  - Every spec gets the Ukrainian translations and a settings stub from
    `src/test-providers.ts`.
  - Stub repositories with `{ provide: XRepository, useValue: {...of(...)} }`.
  - Await `fixture.whenStable()`.
- **Performance:** keep `track` on every `@for`, routes lazy-loaded, no subscriptions
  without teardown (prefer `rxResource`/`toSignal`), and impure work out of templates.
- **Docs:** `docs/ARCHITECTURE.md` (§4.6 i18n, §4.7 theme).
