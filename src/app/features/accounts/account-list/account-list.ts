import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IAccount } from '../../../model/types';
import { AccountRepository } from '../data/account-repository';
import { rxResource } from '@angular/core/rxjs-interop';
import { AccountForm } from '../account-form/account-form';
import { VisibilityBadge } from '../../../shared/ui/visibility-badge/visibility-badge';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountForm, VisibilityBadge],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css',
})
export class AccountList {
  private readonly accountRepository = inject(AccountRepository);
  protected readonly selectedAccount = signal<IAccount | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly accountsResource = rxResource<IAccount[], undefined>({
    stream: () => this.accountRepository.getAccounts(),
  });

  selectAccount(account: IAccount) {
    this.selectedAccount.set(account);
    this.isFormOpen.set(true);
  }

  openCreateForm() {
    this.selectedAccount.set(null);
    this.isFormOpen.set(true);
  }

  deleteAccount(account: IAccount) {
    this.actionError.set(null);
    this.accountRepository.deleteAccount(account.id).subscribe({
      next: () => {
        if (this.selectedAccount()?.id === account.id) this.onEdited();
        else this.accountsResource.reload();
      },
      error: (err: Error) => this.actionError.set(err.message),
    });
  }

  onEdited() {
    this.isFormOpen.set(false);
    this.selectedAccount.set(null);
    this.accountsResource.reload();
  }
}
