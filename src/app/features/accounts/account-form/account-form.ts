import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { AuthState } from '../../../core/auth/auth-state';
import { GrantLevel, IAccount } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { SettingsRepository } from '../../settings/data/settings-repository';
import { AccountRepository } from '../data/account-repository';

interface AccountFormModel {
  name: string;
  currency: string;
  icon: string;
  color: string;
}

const DEFAULT_MODEL: AccountFormModel = {
  name: '',
  currency: 'UAH',
  icon: 'assets/card.svg',
  color: 'green',
};

export type MemberAccess = GrantLevel | 'hidden';

// Only the owner opens this form: other members see the account read-only.
@Component({
  selector: 'app-account-form',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-form.html',
  styleUrl: './account-form.css',
})
export class AccountForm {
  private readonly accountRepository = inject(AccountRepository);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly settingsRepository = inject(SettingsRepository);
  private readonly currentUser = inject(AuthState).currentUser;

  protected readonly colors = ['green', 'yellow', 'blue', 'red'];
  protected readonly icons = ['card', 'wallet'];
  protected readonly accessLevels: { value: MemberAccess; label: string }[] = [
    { value: 'hidden', label: 'Прихований' },
    { value: 'visible', label: 'Перегляд' },
    { value: 'shared', label: 'Спільний' },
  ];

  private readonly model = signal<AccountFormModel>({ ...DEFAULT_MODEL });
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly form = form(this.model, (f) => {
    required(f.name);
    required(f.currency);
  });

  // Access per family member (by user id); anyone missing is hidden.
  protected readonly memberAccess = signal<Record<string, MemberAccess>>({});

  readonly account = input<IAccount>();
  readonly edited = output();

  private readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
  });

  // New accounts start in the user's default currency (settings).
  private readonly settingsResource = rxResource({
    stream: () => this.settingsRepository.getSettings(),
  });

  // Everyone in the family except the owner (the current user).
  protected readonly members = computed(() => {
    const userId = this.currentUser()?.id;
    return (this.familyResource.value()?.members ?? []).map((m) => m.user).filter((u) => u.id !== userId);
  });

  constructor() {
    effect(() => {
      const data = this.account();
      this.model.set(
        data ? { name: data.name, currency: data.currency, icon: data.icon, color: data.color } : { ...DEFAULT_MODEL },
      );
      this.memberAccess.set(Object.fromEntries((data?.grants ?? []).map((g) => [g.userId, g.level])));
    });
    effect(() => {
      const currency = this.settingsResource.value()?.defaultCurrency;
      if (!currency || untracked(this.account)) return;
      // Only while the user hasn't picked a currency themselves.
      this.model.update((m) => (m.currency === DEFAULT_MODEL.currency ? { ...m, currency } : m));
    });
  }

  accessOf(userId: string): MemberAccess {
    return this.memberAccess()[userId] ?? 'hidden';
  }

  setAccess(userId: string, access: MemberAccess) {
    this.memberAccess.update((current) => ({ ...current, [userId]: access }));
  }

  submit() {
    if (!this.form().valid()) return;
    this.errorMessage.set(null);

    const memberIds = new Set(this.members().map((m) => m.id));
    const grants = Object.entries(this.memberAccess())
      .filter((entry): entry is [string, GrantLevel] => entry[1] !== 'hidden' && memberIds.has(entry[0]))
      .map(([userId, level]) => ({ userId, level }));
    const input = { ...this.form().value(), balance: this.account()?.balance ?? 0, grants };
    const accountId = this.account()?.id;
    const request$ = accountId
      ? this.accountRepository.updateAccount(accountId, input)
      : this.accountRepository.createAccount(input);

    request$.subscribe({
      next: () => this.edited.emit(),
      error: (err: Error) => this.errorMessage.set(err.message),
    });
  }
}
