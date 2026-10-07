import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
            getSettings: () => of({ defaultCurrency: 'UAH' }),
            updateSettings: (settings: IUserSettings) => {
              saved.push(settings);
              return of(settings);
            },
          },
        },
      ],
    });
  });

  it('loads the current settings on open and saves the new default currency', async () => {
    const fixture = TestBed.createComponent(SettingsDialog);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    fixture.componentInstance.open();
    await fixture.whenStable();
    const input = el.querySelector('#settings-currency') as HTMLInputElement;
    expect(input.value).toBe('UAH');
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(true);

    input.value = 'EUR';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.componentInstance.save();

    expect(saved).toEqual([{ defaultCurrency: 'EUR' }]);
    expect((el.querySelector('dialog') as HTMLDialogElement).open).toBe(false);
  });

  it('rejects something that is not a currency code', async () => {
    const fixture = TestBed.createComponent(SettingsDialog);
    fixture.componentInstance.open();
    await fixture.whenStable();
    const input = (fixture.nativeElement as HTMLElement).querySelector('#settings-currency') as HTMLInputElement;

    input.value = 'euro';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance.save();

    expect(saved).toEqual([]);
  });
});
