import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoCurrencyPipe } from '@jsverse/transloco-locale';
import { canRecordOn, IAccount } from '../../../model/types';
import { AccountRepository } from '../data/account-repository';
import { AccountCloseArt } from '../../../shared/ui/illustrations/account-close-art';

// Closing moves the remaining balance to another account as a transfer, then
// archives the account. Only its owner sees this.
@Component({
  selector: 'app-account-close',
  imports: [TranslocoDirective, TranslocoCurrencyPipe, AccountCloseArt],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-close.html',
  styleUrl: './account-close.css',
})
export class AccountClose {
  private readonly accountRepository = inject(AccountRepository);

  readonly account = input.required<IAccount>();
  // All accounts the user can see; the dialog picks valid targets itself.
  readonly accounts = input.required<IAccount[]>();
  readonly closed = output();
  readonly cancelled = output();

  protected readonly targetId = signal<string>('');
  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly needsTarget = computed(() => this.account().balance !== 0);
  protected readonly amount = computed(() => Math.abs(this.account().balance));

  // Same currency (no FX) and an account the user may record on.
  protected readonly targets = computed(() =>
    this.accounts().filter(
      (a) => a.id !== this.account().id && a.currency === this.account().currency && canRecordOn(a),
    ),
  );

  protected readonly canConfirm = computed(
    () => !this.pending() && (!this.needsTarget() || this.targets().some((t) => t.id === this.targetId())),
  );

  confirm() {
    if (!this.canConfirm()) return;
    this.pending.set(true);
    this.errorMessage.set(null);
    this.accountRepository.closeAccount(this.account().id, this.needsTarget() ? this.targetId() : null).subscribe({
      next: () => {
        this.pending.set(false);
        this.closed.emit();
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
