import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, required } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { Language, LANGUAGES } from '../../../core/i18n/languages';
import { DEFAULT_HUE } from '../../../core/theme/palette';
import { Theme, THEMES } from '../../../core/theme/theme';
import { SettingsState } from '../settings-state';

// Offered when adding a used currency; any other ISO 4217 code can still be typed in.
export const COMMON_CURRENCIES = ['UAH', 'EUR', 'USD', 'PLN', 'GBP', 'CZK', 'CHF', 'HUF', 'RON', 'GEL'];

// Same limit as the backend.
export const MAX_USED_CURRENCIES = 20;

const CURRENCY_CODE = /^[A-Z]{3}$/;

@Component({
  selector: 'app-settings-dialog',
  imports: [FormField, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
})
export class SettingsDialog {
  private readonly settingsState = inject(SettingsState);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly languages = LANGUAGES;
  protected readonly themes = THEMES;
  protected readonly maxUsedCurrencies = MAX_USED_CURRENCIES;
  private readonly model = signal<{ language: Language; theme: Theme; defaultCurrency: string }>({
    language: 'en',
    theme: 'system',
    defaultCurrency: '',
  });
  protected readonly hue = signal(DEFAULT_HUE);
  protected readonly form = form(this.model, (f) => {
    required(f.language);
    required(f.defaultCurrency);
  });
  // The default currency is picked from these, so it's always one of them.
  protected readonly usedCurrencies = signal<string[]>([]);
  // Its own small form, so the field's DOM value always follows the model (cleared after adding).
  private readonly addModel = signal({ code: '' });
  protected readonly addForm = form(this.addModel, (f) => maxLength(f.code, 3));
  protected readonly newCurrency = computed(() => this.addModel().code.trim().toUpperCase());
  protected readonly suggestions = computed(() =>
    COMMON_CURRENCIES.filter((c) => !this.usedCurrencies().includes(c)),
  );
  protected readonly newCurrencyError = computed(() => {
    const code = this.newCurrency();
    if (code === '' || this.usedCurrencies().includes(code)) return null;
    if (!CURRENCY_CODE.test(code)) return 'settings.invalidCode';
    if (this.usedCurrencies().length >= MAX_USED_CURRENCIES) return 'settings.tooMany';
    return null;
  });
  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Loads the current values each time, so a change made elsewhere (e.g. the mobile
  // app) shows up.
  open() {
    this.errorMessage.set(null);
    this.addModel.set({ code: '' });
    this.loading.set(true);
    this.dialog().nativeElement.showModal();
    this.settingsState.load().subscribe({
      next: (settings) => {
        this.loading.set(false);
        this.model.set({
          language: settings.language,
          theme: settings.theme,
          defaultCurrency: settings.defaultCurrency,
        });
        this.usedCurrencies.set(settings.usedCurrencies);
        this.hue.set(settings.primaryHue);
      },
      error: (err: Error) => {
        this.loading.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }

  close() {
    this.dialog().nativeElement.close();
  }

  addCurrency() {
    const code = this.newCurrency();
    if (this.newCurrencyError() || code === '') return;
    this.usedCurrencies.update((codes) => (codes.includes(code) ? codes : [...codes, code]));
    this.addModel.set({ code: '' });
  }

  removeCurrency(code: string) {
    if (code === this.model().defaultCurrency) return;
    this.usedCurrencies.update((codes) => codes.filter((c) => c !== code));
  }

  save() {
    if (!this.form().valid()) return;
    this.pending.set(true);
    this.errorMessage.set(null);
    // The new language applies as soon as the server has accepted it.
    const settings = { ...this.form().value(), usedCurrencies: this.usedCurrencies(), primaryHue: this.hue() };
    this.settingsState.update(settings).subscribe({
      next: () => {
        this.pending.set(false);
        this.close();
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
