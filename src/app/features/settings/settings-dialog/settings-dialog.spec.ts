import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { LanguageService } from '../../../core/i18n/language';
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
            getSettings: () => of({ language: 'uk', defaultCurrency: 'UAH', usedCurrencies: ['UAH', 'EUR'] }),
            updateSettings: (settings: IUserSettings) => {
              saved.push(settings);
              return of(settings);
            },
          },
        },
      ],
    });
  });

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
    fixture.componentInstance.save();
    await fixture.whenStable();

    expect(chips()).toEqual(['UAH ×', 'EUR · default', 'USD ×']);
    expect((el.querySelector('#settings-new-currency') as HTMLInputElement).value).toBe('');
    expect(saved).toEqual([{ language: 'en', defaultCurrency: 'EUR', usedCurrencies: ['UAH', 'EUR', 'USD'] }]);
    expect(TestBed.inject(LanguageService).current()).toBe('en');
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
});
