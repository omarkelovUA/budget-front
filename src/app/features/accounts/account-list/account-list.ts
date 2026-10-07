import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { IAccount } from '../../../model/types';
import { AccessBadge } from '../../../shared/ui/access-badge/access-badge';
import { AccountRepository } from '../data/account-repository';
import { AccountClose } from '../account-close/account-close';
import { AccountForm } from '../account-form/account-form';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountForm, AccountClose, AccessBadge, NgTemplateOutlet],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css',
})
export class AccountList {
  private readonly accountRepository = inject(AccountRepository);
  protected readonly selectedAccount = signal<IAccount | null>(null);
  protected readonly closingAccount = signal<IAccount | null>(null);
  protected readonly isFormOpen = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly accountsResource = rxResource<IAccount[], undefined>({
    stream: () => this.accountRepository.getAccounts(),
  });

  // Mine / shared with me / visible to me.
  protected readonly groups = computed(() => {
    const accounts = this.accountsResource.value() ?? [];
    return [
      { title: 'Мої рахунки', accounts: accounts.filter((a) => a.access === 'owner') },
      { title: 'Спільні зі мною', accounts: accounts.filter((a) => a.access === 'shared') },
      { title: 'Доступні для перегляду', accounts: accounts.filter((a) => a.access === 'visible') },
    ].filter((group, index) => index === 0 || group.accounts.length > 0);
  });

  selectAccount(account: IAccount) {
    if (account.access !== 'owner') return;
    this.closingAccount.set(null);
    this.selectedAccount.set(account);
    this.isFormOpen.set(true);
  }

  openCreateForm() {
    this.closingAccount.set(null);
    this.selectedAccount.set(null);
    this.isFormOpen.set(true);
  }

  startClosing(account: IAccount) {
    this.isFormOpen.set(false);
    this.selectedAccount.set(null);
    this.closingAccount.set(account);
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

  sharedWith(account: IAccount): string {
    return (account.grants ?? []).map((g) => g.displayName).join(', ');
  }

  onClosed() {
    this.closingAccount.set(null);
    this.accountsResource.reload();
  }

  onEdited() {
    this.isFormOpen.set(false);
    this.selectedAccount.set(null);
    this.accountsResource.reload();
  }
}
