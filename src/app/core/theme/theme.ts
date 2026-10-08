import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'theme';

// Maps to the CSS color-scheme that src/styles/theme.css's light-dark() tokens follow.
const COLOR_SCHEME: Record<Theme, string> = { light: 'light', dark: 'dark', system: 'light dark' };

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

// The active theme: before sign-in the one last used on this device, else the device's
// own preference; once signed in, the account's setting wins (SettingsState).
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly active = signal<Theme>('system');
  readonly current = this.active.asReadonly();

  init(): void {
    this.use(this.saved() ?? 'system');
  }

  use(theme: Theme): void {
    this.active.set(theme);
    this.document.documentElement.style.colorScheme = COLOR_SCHEME[theme];
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked; the account setting still applies after sign-in.
    }
  }

  private saved(): Theme | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return isTheme(value) ? value : null;
    } catch {
      return null;
    }
  }
}
