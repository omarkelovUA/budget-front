import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { from, Observable } from 'rxjs';
import { Language } from './languages';

// Bundled as lazy chunks: only the active language is downloaded, with the app's
// own cache-busting file names and no trip through the HTTP interceptor.
const FILES: Record<Language, () => Promise<{ default: Translation }>> = {
  en: () => import('../../../i18n/en.json'),
  uk: () => import('../../../i18n/uk.json'),
};

@Injectable({ providedIn: 'root' })
export class TranslationLoader implements TranslocoLoader {
  getTranslation(language: string): Observable<Translation> {
    return from(FILES[language as Language]().then((file) => file.default));
  }
}
