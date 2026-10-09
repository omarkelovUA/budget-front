import { inject, Injectable, signal } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { LanguageService } from '../../core/i18n/language';
import { isLanguage } from '../../core/i18n/languages';
import { isHue } from '../../core/theme/palette';
import { isTheme, ThemeService } from '../../core/theme/theme';
import { IUserSettings } from '../../model/types';
import { SettingsRepository } from './data/settings-repository';

// The signed-in user's settings, loaded when the session starts (AuthState) and
// kept here so forms can read them without fetching. Applying them switches the UI
// to the account's language, theme and primary colour.
@Injectable({ providedIn: 'root' })
export class SettingsState {
  private readonly settingsRepository = inject(SettingsRepository);
  private readonly languageService = inject(LanguageService);
  private readonly themeService = inject(ThemeService);

  private readonly value = signal<IUserSettings | null>(null);
  readonly settings = this.value.asReadonly();

  load(): Observable<IUserSettings> {
    return this.settingsRepository.getSettings().pipe(switchMap((settings) => this.apply(settings)));
  }

  update(settings: IUserSettings): Observable<IUserSettings> {
    return this.settingsRepository.updateSettings(settings).pipe(switchMap((saved) => this.apply(saved)));
  }

  clear(): void {
    this.value.set(null);
  }

  private apply(settings: IUserSettings): Observable<IUserSettings> {
    this.value.set(settings);
    if (isTheme(settings.theme)) this.themeService.use(settings.theme);
    if (isHue(settings.primaryHue)) this.themeService.useHue(settings.primaryHue);
    const language = isLanguage(settings.language) ? this.languageService.use(settings.language) : Promise.resolve();
    return from(language).pipe(map(() => settings));
  }
}
