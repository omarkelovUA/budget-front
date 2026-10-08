import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { LanguageService } from './language';
import { matchLanguage } from './languages';

describe('matchLanguage', () => {
  it('picks the first supported language, or a country that stands for one', () => {
    expect(matchLanguage(['de-DE', 'uk', 'en'])).toBe('uk');
    expect(matchLanguage(['en-US'])).toBe('en');
    expect(matchLanguage(['ru-UA'])).toBe('uk');
    expect(matchLanguage(['de-DE', 'pl'])).toBeNull();
  });
});

describe('LanguageService', () => {
  let browserLanguages: string[];

  beforeEach(() => {
    localStorage.clear();
    browserLanguages = ['de-DE'];
    vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => browserLanguages);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('starts in English when nothing else matches', async () => {
    await TestBed.inject(LanguageService).init();

    expect(TestBed.inject(LanguageService).current()).toBe('en');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it("prefers the browser's language over the fallback", async () => {
    browserLanguages = ['uk-UA', 'en'];

    await TestBed.inject(LanguageService).init();

    expect(TestBed.inject(LanguageService).current()).toBe('uk');
  });

  it('prefers the language last used on this device over the browser', async () => {
    browserLanguages = ['uk-UA'];
    localStorage.setItem('language', 'en');

    await TestBed.inject(LanguageService).init();

    expect(TestBed.inject(LanguageService).current()).toBe('en');
  });

  it('remembers a switch for the next start', async () => {
    await TestBed.inject(LanguageService).use('uk');

    expect(localStorage.getItem('language')).toBe('uk');
    expect(TestBed.inject(TranslocoService).translate('nav.logout')).toBe('Вийти');
  });
});
