import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IAccount } from '../../../model/types';
import { AccountRepository } from '../data/account-repository';
import { rxResource } from '@angular/core/rxjs-interop';
import { AccountForm } from '../account-form/account-form';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AccountForm],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css',
})
export class AccountList {
  private readonly accountRepository = inject(AccountRepository);
  protected readonly selectedAccount = signal<IAccount | null>(null);
  protected readonly isFormOpen = signal(false);

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

  onEdited() {
    this.isFormOpen.set(false);
    this.selectedAccount.set(null);
    this.accountsResource.reload();
  }
}
