import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoCurrencyPipe } from '@jsverse/transloco-locale';
import { IAccount } from '../../../model/types';
import { AccessBadge } from '../../../shared/ui/access-badge/access-badge';
import { AccountRepository } from '../data/account-repository';
import { AccountClose } from '../account-close/account-close';
import { AccountForm } from '../account-form/account-form';
import { FamilyTransfers } from '../../family-transfers/family-transfers/family-transfers';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { PageHeader } from '../../../shared/ui/page-header/page-header';
import { DragHandle } from '../../../shared/ui/drag-handle/drag-handle';
import { AccountsArt } from '../../../shared/ui/illustrations/accounts-art';
import { EmptyArt } from '../../../shared/ui/illustrations/empty-art';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Icon,
    AccountForm,
    Modal,
    AccountClose,
    AccessBadge,
    NgTemplateOutlet,
    FamilyTransfers,
    TranslocoDirective,
    TranslocoCurrencyPipe,
    PageHeader,
    CdkDropList,
    CdkDrag,
    DragHandle,
    AccountsArt,
    EmptyArt,
  ],
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
      { key: 'mine', accounts: accounts.filter((a) => a.access === 'owner') },
      { key: 'shared', accounts: accounts.filter((a) => a.access === 'shared') },
      { key: 'visible', accounts: accounts.filter((a) => a.access === 'visible') },
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

  dropAccount(groupKey: string, event: Pick<CdkDragDrop<unknown>, 'previousIndex' | 'currentIndex'>) {
    this.moveAccount(groupKey, event.previousIndex, event.currentIndex);
  }

  // Within its group (mine, shared, visible); shown at once and saved as the whole order.
  moveAccount(groupKey: string, from: number, to: number) {
    const groups = this.groups().map((group) => ({ ...group, accounts: [...group.accounts] }));
    const accounts = groups.find((group) => group.key === groupKey)!.accounts;
    if (from === to || to < 0 || to >= accounts.length) return;
    moveItemInArray(accounts, from, to);
    const ordered = groups.flatMap((group) => group.accounts);
    this.actionError.set(null);
    this.accountsResource.set(ordered);
    this.accountRepository.reorderAccounts(ordered.map((account) => account.id)).subscribe({
      error: (err: Error) => {
        this.actionError.set(err.message);
        this.accountsResource.reload();
      },
    });
  }

  sharedWith(account: IAccount): string {
    return (account.grants ?? []).map((g) => g.displayName).join(', ');
  }

  onClosed() {
    this.closingAccount.set(null);
    this.accountsResource.reload();
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.selectedAccount.set(null);
  }

  onEdited() {
    this.closeForm();
    this.accountsResource.reload();
  }
}
