import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { form, FormField, min, required } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AuthState } from '../../../core/auth/auth-state';
import { IAccount, IInTransit } from '../../../model/types';
import { FamilyRepository } from '../../family/data/family-repository';
import { FamilyTransferRepository } from '../data/family-transfer-repository';

type WithdrawMode = 'collect' | 'takeBack';

// "In transit" on the accounts page: send money to a family member, collect what's
// waiting for you, take back what you sent and wasn't collected yet.
@Component({
  selector: 'app-family-transfers',
  imports: [FormField, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './family-transfers.html',
  styleUrl: './family-transfers.css',
})
export class FamilyTransfers {
  private readonly transferRepository = inject(FamilyTransferRepository);
  private readonly familyRepository = inject(FamilyRepository);
  private readonly currentUser = inject(AuthState).currentUser;

  // The accounts the user can see; money only moves from/to their own open ones.
  readonly accounts = input.required<IAccount[]>();
  readonly changed = output();

  protected readonly transfersResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.transferRepository.getInTransit(),
  });

  private readonly familyResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyRepository.getCurrentFamily(),
  });

  protected readonly recipients = computed(() => {
    const userId = this.currentUser()?.id;
    return (this.familyResource.value()?.members ?? []).map((m) => m.user).filter((u) => u.id !== userId);
  });

  protected readonly ownAccounts = computed(() => this.accounts().filter((a) => a.access === 'owner' && !a.closed));

  private readonly sendModel = signal({ fromAccountId: '', recipientId: '', amount: 0 });
  protected readonly sendForm = form(this.sendModel, (f) => {
    required(f.fromAccountId);
    required(f.recipientId);
    min(f.amount, 0.01);
  });

  // The row whose collect / take back panel is open.
  protected readonly withdrawing = signal<{ transfer: IInTransit; mode: WithdrawMode } | null>(null);
  protected readonly targetId = signal('');
  // Empty = everything waiting.
  protected readonly withdrawAmount = signal('');

  protected readonly pending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  // Same currency as the transfer: there's no FX.
  targetsFor(transfer: IInTransit): IAccount[] {
    return this.ownAccounts().filter((a) => a.currency === transfer.currency);
  }

  send() {
    if (!this.sendForm().valid()) return;
    const { fromAccountId, recipientId, amount } = this.sendForm().value();
    this.run(this.transferRepository.send(fromAccountId, recipientId, amount), () =>
      this.sendModel.set({ fromAccountId: '', recipientId: '', amount: 0 }),
    );
  }

  startWithdraw(transfer: IInTransit, mode: WithdrawMode) {
    this.errorMessage.set(null);
    this.withdrawing.set({ transfer, mode });
    this.targetId.set(this.targetsFor(transfer)[0]?.id ?? '');
    this.withdrawAmount.set('');
  }

  confirmWithdraw() {
    const active = this.withdrawing();
    if (!active || !this.targetId()) return;
    const amount = this.withdrawAmount().trim() === '' ? null : Number(this.withdrawAmount());
    const request$ =
      active.mode === 'collect'
        ? this.transferRepository.collect(active.transfer.id, this.targetId(), amount)
        : this.transferRepository.takeBack(active.transfer.id, this.targetId(), amount);
    this.run(request$, () => this.withdrawing.set(null));
  }

  private run(request$: Observable<void>, onSuccess: () => void) {
    this.pending.set(true);
    this.errorMessage.set(null);
    request$.subscribe({
      next: () => {
        this.pending.set(false);
        onSuccess();
        this.transfersResource.reload();
        this.changed.emit();
      },
      error: (err: Error) => {
        this.pending.set(false);
        this.errorMessage.set(err.message);
      },
    });
  }
}
