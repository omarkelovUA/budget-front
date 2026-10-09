import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LanguageService } from '../../../core/i18n/language';
import { ThemeService } from '../../../core/theme/theme';
import { IUserSettings } from '../../../model/types';
import { SettingsRepository } from '../data/settings-repository';
import { SettingsDialog } from './settings-dialog';

describe('SettingsDialog', () => {
  let saved: IUserSettings[];

  beforeEach(() => {
    saved = [];
    // jsdom has no modal dialogs; opening/closing just toggles the attribute here.
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
    TestBed.configureTestingModule({
      imports: [SettingsDialog],
      providers: [
        {
          provide: SettingsRepository,
          useValue: {
            getSettings: () =>
              of({ language: 'uk', defaultCurrency: 'UAH', usedCurrencies: ['UAH', 'EUR'], theme: 'system', primaryHue: 150 }),
            updateSettings: (settings: IUserSettings) => {
              saved.push(settings);
              return of(settings);
            },
          },
        },
      ],
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('style');
  });

  const primaryHue = () => document.documentElement.style.getPropertyValue('--primary-h');

  async function open() {
    const fixture = TestBed.createComponent(SettingsDialog);
    fixture.componentInstance.open();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const chips = () => Array.from(el.querySelectorAll('.currency-chip')).map((c) => c.textContent?.replace(/\s+/g, ' ').trim());
    const type = async (selector: string, value: string) => {
      const input = el.querySelector(selector) as HTMLInputElement | HTMLSelectElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    return { fixture, el, chips, type };
  }

  it('loads the current settings on open', async () => {
    const { el, chips } = await open();

    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);
    expect((el.querySelector('#settings-language') as HTMLSelectElement).value).toBe('uk');
    expect((el.querySelector('#settings-currency') as HTMLSelectElement).value).toBe('UAH');
    expect(chips()).toEqual(['UAH · основна', 'EUR ×']);
  });

  it('saves the language, used currencies and default currency, then switches the language', async () => {
    const { fixture, el, chips, type } = await open();

    await type('#settings-new-currency', 'usd');
    fixture.componentInstance.addCurrency();
    await fixture.whenStable();
    await type('#settings-currency', 'EUR');
    await type('#settings-language', 'en');
    await type('#settings-theme', 'dark');
    fixture.componentInstance.save();
    await fixture.whenStable();

    expect(chips()).toEqual(['UAH ×', 'EUR · default', 'USD ×']);
    expect((el.querySelector('#settings-new-currency') as HTMLInputElement).value).toBe('');
    expect(saved).toEqual([
      {
        language: 'en',
        theme: 'dark',
        primaryHue: 150,
        defaultCurrency: 'EUR',
        usedCurrencies: ['UAH', 'EUR', 'USD'],
      },
    ]);
    expect(TestBed.inject(LanguageService).current()).toBe('en');
    expect(TestBed.inject(ThemeService).current()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(false);
  });

  it('keeps the default currency and rejects codes that are not ISO 4217', async () => {
    const { fixture, el, chips, type } = await open();

    expect(el.querySelector('.currency-chip .chip-remove')?.getAttribute('aria-label')).toBe('Прибрати EUR');
    fixture.componentInstance.removeCurrency('UAH');
    await type('#settings-new-currency', 'euro');
    fixture.componentInstance.addCurrency();
    await fixture.whenStable();

    expect(chips()).toEqual(['UAH · основна', 'EUR ×']);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Введіть трилітерний код ISO 4217');
  });

  it('saves unchanged settings unchanged when the default is not the first currency', async () => {
    TestBed.overrideProvider(SettingsRepository, {
      useValue: {
        getSettings: () => of({ language: 'uk', defaultCurrency: 'EUR', usedCurrencies: ['UAH', 'EUR'], theme: 'dark', primaryHue: 305 }),
        updateSettings: (settings: IUserSettings) => {
          saved.push(settings);
          return of(settings);
        },
      },
    });
    const { fixture, el } = await open();

    expect((el.querySelector('#settings-currency') as HTMLSelectElement).value).toBe('EUR');
    fixture.componentInstance.save();

    expect(saved).toEqual([
      { language: 'uk', theme: 'dark', primaryHue: 305, defaultCurrency: 'EUR', usedCurrencies: ['UAH', 'EUR'] },
    ]);
  });

  it('previews a preset colour without keeping it yet', async () => {
    const { fixture, el } = await open();

    const violet = el.querySelector('input[aria-label="Фіолетовий"]') as HTMLInputElement;
    violet.click();
    await fixture.whenStable();

    expect(violet.checked).toBe(true);
    expect(primaryHue()).toBe('305');
    expect(TestBed.inject(ThemeService).hue()).toBe(150);
  });

  it('saves a custom colour picked on the hue slider', async () => {
    const { fixture, type } = await open();

    await type('#settings-hue', '70');
    expect(primaryHue()).toBe('70');
    fixture.componentInstance.save();
    await fixture.whenStable();

    expect(saved[0].primaryHue).toBe(70);
    expect(TestBed.inject(ThemeService).hue()).toBe(70);
  });

  it('restores the saved colour when closed without saving, e.g. with Esc', async () => {
    const { fixture, el, type } = await open();
    TestBed.inject(ThemeService).useHue(150);

    await type('#settings-hue', '305');
    const dialog = el.querySelector('dialog') as HTMLDialogElement;
    dialog.close();
    dialog.dispatchEvent(new Event('close'));
    await fixture.whenStable();

    expect(primaryHue()).toBe('150');
  });
});
