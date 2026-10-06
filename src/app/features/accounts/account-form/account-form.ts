import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { disabled, form, FormField, required } from '@angular/forms/signals';
import { IAccount } from '../../../model/types';
import { AccountRepository } from '../data/account-repository';

type AccountFormModel = Omit<IAccount, 'id' | 'balance'>;

const DEFAULT_MODEL: AccountFormModel = {
  name: '',
  currency: 'UAH',
  icon: 'assets/card.svg',
  color: 'green',
  visibility: 'private',
};

@Component({
  selector: 'app-account-form',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-form.html',
  styleUrl: './account-form.css',
})
export class AccountForm {
  private readonly accountRepository = inject(AccountRepository);
  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly icons = ['card', 'wallet'];
  protected readonly visibilities: IAccount['visibility'][] = ['private', 'shared'];

  private readonly model = signal<AccountFormModel>({ ...DEFAULT_MODEL });
  protected readonly form = form(this.model, (f) => {
    required(f.name);
    required(f.currency);
    // The backend rejects moving an existing account between private and shared.
    disabled(f.visibility, () => this.account() !== undefined);
  });

  readonly account = input<IAccount>();
  readonly edited = output();

  constructor() {
    effect(() => {
      const data = this.account();
      this.model.set(
        data
          ? { name: data.name, currency: data.currency, icon: data.icon, color: data.color, visibility: data.visibility }
          : { ...DEFAULT_MODEL },
      );
    });
  }

  submit() {
    if (!this.form().valid()) return;

    const value = this.form().value();
    const accountId = this.account()?.id;
    const balance = this.account()?.balance ?? 0;
    const request$ =
      accountId
        ? this.accountRepository.updateAccount({ ...value, balance, id: accountId })
        : this.accountRepository.createAccount({ ...value, balance });

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err) => console.error('Save failed:', err),
    });
  }
}
