import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { TranslocoDirective } from '@jsverse/transloco';
import { IconPicker } from '../../../shared/ui/icon-picker/icon-picker';
import { TAG_COLORS, tagColor } from '../../../shared/ui/colors/colors';
import { ACCOUNT_ICONS } from '../../../shared/ui/icon-picker/icons';
import { AuthState } from '../../../core/auth/auth-state';
import { GrantLevel, IAccount } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { SettingsState } from '../../settings/settings-state';
import { AccountRepository } from '../data/account-repository';
import { AccountFormArt } from '../../../shared/ui/illustrations/account-form-art';

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
  imports: [FormField, TranslocoDirective, IconPicker, AccountFormArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-form.html',
  styleUrl: './account-form.css',
})
export class AccountForm {
  private readonly accountRepository = inject(AccountRepository);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly settings = inject(SettingsState).settings;
  private readonly currentUser = inject(AuthState).currentUser;
  private readonly familyFrozen = inject(AuthState).familyFrozen;

  protected readonly colors = TAG_COLORS;
  protected readonly tagColor = tagColor;
  protected readonly icons = ACCOUNT_ICONS;
  protected readonly accessLevels: MemberAccess[] = ['hidden', 'visible', 'shared'];
  // Offered in the currency field; any other code can still be typed in.
  protected readonly usedCurrencies = computed(() => this.settings()?.usedCurrencies ?? []);

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
  readonly cancelled = output();

  private readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
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
    // New accounts start in the user's default currency (settings).
    effect(() => {
      const currency = this.settings()?.defaultCurrency;
      if (!currency || untracked(this.account)) return;
      // Only while the user hasn't picked a currency themselves.
      this.model.update((m) => (m.currency === DEFAULT_MODEL.currency ? { ...m, currency } : m));
    });
  }

  accessOf(userId: string): MemberAccess {
    return this.memberAccess()[userId] ?? 'hidden';
  }

  // While the family is frozen, sharing may shrink but not grow past what the account had.
  canPick(userId: string, access: MemberAccess): boolean {
    if (!this.familyFrozen()) return true;
    const saved = this.account()?.grants?.find((g) => g.userId === userId)?.level ?? 'hidden';
    return this.accessLevels.indexOf(access) <= this.accessLevels.indexOf(saved);
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
