import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_HUE, isHue, paletteFor } from './palette';

export const THEMES = ['light', 'dark', 'system'] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'theme';
const HUE_STORAGE_KEY = 'primaryHue';

// Maps to the CSS color-scheme that src/styles/theme.css's light-dark() tokens follow.
const COLOR_SCHEME: Record<Theme, string> = { light: 'light', dark: 'dark', system: 'light dark' };

export function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

// The active theme and primary colour: before sign-in the ones last used on this device,
// else the device's own preference and the default green; once signed in, the account's
// settings win (SettingsState).
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly active = signal<Theme>('system');
  readonly current = this.active.asReadonly();

  private readonly committedHue = signal(DEFAULT_HUE);
  readonly hue = this.committedHue.asReadonly();

  init(): void {
    this.use(this.saved() ?? 'system');
    this.useHue(this.savedHue() ?? DEFAULT_HUE);
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

  useHue(hue: number): void {
    this.committedHue.set(hue);
    this.applyHue(hue);
    try {
      localStorage.setItem(HUE_STORAGE_KEY, String(hue));
    } catch {
      // As for the theme: the account setting still applies after sign-in.
    }
  }

  // Shows a colour without keeping it, e.g. while the settings dialog is open.
  previewHue(hue: number): void {
    this.applyHue(hue);
  }

  restoreHue(): void {
    this.applyHue(this.committedHue());
  }

  // Sets the inputs src/styles/theme.css derives every colour token from.
  private applyHue(hue: number): void {
    const palette = paletteFor(hue);
    const style = this.document.documentElement.style;
    style.setProperty('--primary-h', String(palette.h));
    style.setProperty('--primary-c', String(palette.c));
    style.setProperty('--tertiary-c', String(palette.tertiaryC));
    style.setProperty('--primary-l', `${Math.round(palette.l * 100)}%`);
  }

  private savedHue(): number | null {
    try {
      const value = Number(localStorage.getItem(HUE_STORAGE_KEY) || NaN);
      return isHue(value) ? value : null;
    } catch {
      return null;
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
