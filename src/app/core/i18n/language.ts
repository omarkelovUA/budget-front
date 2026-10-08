import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { FALLBACK_LANGUAGE, isLanguage, Language, matchLanguage } from './languages';

const STORAGE_KEY = 'language';

// The active UI language. Before sign-in it's the one last used on this device, else
// the browser's; once signed in, the account's setting wins (SettingsState).
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);
  private readonly document = inject(DOCUMENT);

  private readonly active = signal<Language>(FALLBACK_LANGUAGE);
  readonly current = this.active.asReadonly();

  private requests = 0;

  // Awaited at startup, so the first screen already renders translated.
  init(): Promise<void> {
    const browser = matchLanguage(this.document.defaultView?.navigator.languages ?? []);
    return this.use(this.saved() ?? browser ?? FALLBACK_LANGUAGE);
  }

  // Switches once the translations are loaded, so the UI never shows bare keys.
  // If calls overlap, the last one wins.
  async use(language: Language): Promise<void> {
    const request = ++this.requests;
    await firstValueFrom(this.transloco.load(language));
    if (request !== this.requests) return;
    this.transloco.setActiveLang(language);
    this.active.set(language);
    this.document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Storage can be blocked; the account setting still applies after sign-in.
    }
  }

  private saved(): Language | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return isLanguage(value) ? value : null;
    } catch {
      return null;
    }
  }
}
