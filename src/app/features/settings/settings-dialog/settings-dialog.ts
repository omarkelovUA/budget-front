import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { form, FormField, pattern, required } from '@angular/forms/signals';
import { SettingsRepository } from '../data/settings-repository';

// Offered in the picker; any other ISO 4217 code can still be typed in.
export const COMMON_CURRENCIES = ['UAH', 'EUR', 'USD', 'PLN', 'GBP', 'CZK', 'CHF', 'HUF', 'RON', 'GEL'];

@Component({
  selector: 'app-settings-dialog',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings-dialog.html',
  styleUrl: './settings-dialog.css',
})
export class SettingsDialog {
  private readonly settingsRepository = inject(SettingsRepository);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  protected readonly currencies = COMMON_CURRENCIES;
  private readonly model = signal({ defaultCurrency: '' });
  protected readonly form = form(this.model, (f) => {
    required(f.defaultCurrency);
    pattern(f.defaultCurrency, /^[A-Z]{3}$/);
  });
  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Loads the current values each time, so a change made elsewhere (e.g. the mobile
  // app) shows up.
  open() {
    this.errorMessage.set(null);
    this.loading.set(true);
    this.dialog().nativeElement.showModal();
    this.settingsRepository.getSettings().subscribe({
      next: (settings) => {
        this.loading.set(false);
        this.model.set({ defaultCurrency: settings.defaultCurrency });
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

  save() {
    if (!this.form().valid()) return;
    this.pending.set(true);
    this.errorMessage.set(null);
    this.settingsRepository.updateSettings(this.form().value()).subscribe({
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
