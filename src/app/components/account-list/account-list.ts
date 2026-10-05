import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { IAccount } from '../../model/types';
import { AccountService } from '../../services/account-service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './account-list.html',
  styleUrl: './account-list.css',
})
export class AccountList {
  private readonly accountService = inject(AccountService);
  protected readonly selectedAccount = signal<IAccount | null>(null);

  protected readonly accountsResource = rxResource<IAccount[], undefined>({
    stream: () => this.accountService.getAccounts(),
  });

  selectAccount(account: IAccount) {
    this.selectedAccount.set(account);
  }
}
