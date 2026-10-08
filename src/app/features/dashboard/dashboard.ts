import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { TranslocoDirective } from '@jsverse/transloco';
import { TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe } from '@jsverse/transloco-locale';
import { map } from 'rxjs';
import { AuthState } from '../../core/auth/auth-state';
import {
  IAccount,
  IBudget,
  IInTransit,
  isTransferTransaction,
  Transaction,
  transactionCurrency,
} from '../../model/types';
import { FamilyTransferRepository } from '../family-transfers/data/family-transfer-repository';
import { AccountRepository } from '../accounts/data/account-repository';
import { BudgetRepository } from '../budgets/data/budget-repository';
import { TransactionRepository } from '../transactions/data/transaction-repository';

// By the user's access: their own accounts, shared with them, only visible; plus
// money they sent to family members that hasn't been collected yet (still theirs).
export interface CurrencyBalance {
  currency: string;
  total: number;
  owner: number;
  shared: number;
  visible: number;
  inTransit: number;
}

const RECENT_COUNT = 5;

function toPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function shiftPeriod(period: string, months: number): string {
  const [year, month] = period.split('-').map(Number);
  return toPeriod(new Date(year, month - 1 + months, 1));
}

// Per currency, never summed across currencies (no FX in v1).
export function balancesByCurrency(accounts: IAccount[], sentInTransit: IInTransit[] = []): CurrencyBalance[] {
  const byCurrency = new Map<string, CurrencyBalance>();
  const entryFor = (currency: string) => {
    const entry = byCurrency.get(currency) ?? { currency, total: 0, owner: 0, shared: 0, visible: 0, inTransit: 0 };
    byCurrency.set(currency, entry);
    return entry;
  };
  for (const account of accounts) {
    const entry = entryFor(account.currency);
    entry.total += account.balance;
    if (account.access !== 'none') entry[account.access] += account.balance;
  }
  for (const transfer of sentInTransit) {
    const entry = entryFor(transfer.currency);
    entry.total += transfer.amount;
    entry.inTransit += transfer.amount;
  }
  return [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoDirective, TranslocoCurrencyPipe, TranslocoDatePipe, TranslocoDecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly accountRepository = inject(AccountRepository);
  private readonly budgetRepository = inject(BudgetRepository);
  private readonly transactionRepository = inject(TransactionRepository);
  private readonly familyTransferRepository = inject(FamilyTransferRepository);

  protected readonly currentUser = inject(AuthState).currentUser;
  protected readonly isTransfer = isTransferTransaction;
  protected readonly currencyOf = transactionCurrency;

  private readonly thisMonth = toPeriod(new Date());
  protected readonly period = signal(this.thisMonth);
  protected readonly isCurrentMonth = computed(() => this.period() === this.thisMonth);
  // Shown as month and year in the active language.
  protected readonly periodStart = computed(() => {
    const [year, month] = this.period().split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  protected readonly accountsResource = rxResource({
    stream: () => this.accountRepository.getAccounts(),
  });
  private readonly transfersResource = rxResource({
    params: () => this.currentUser()?.familyId ?? undefined,
    stream: () => this.familyTransferRepository.getInTransit(),
  });
  protected readonly balances = computed(() =>
    balancesByCurrency(this.accountsResource.value() ?? [], this.transfersResource.value()?.outgoing ?? []),
  );

  protected readonly summaryResource = rxResource({
    params: () => this.period(),
    stream: ({ params }) => this.transactionRepository.getMonthSummary(params),
  });

  // Over-budget first, then by how much of the plan is used.
  protected readonly budgetsResource = rxResource({
    params: () => this.period(),
    stream: ({ params }) =>
      this.budgetRepository
        .getBudgets(params)
        .pipe(map((budgets) => [...budgets].sort((a, b) => this.usage(b) - this.usage(a)))),
  });

  protected readonly recentResource = rxResource({
    stream: () =>
      this.transactionRepository.getTransactions(0).pipe(map((page) => page.items.slice(0, RECENT_COUNT))),
  });

  previousMonth() {
    this.period.update((p) => shiftPeriod(p, -1));
  }

  nextMonth() {
    this.period.update((p) => shiftPeriod(p, 1));
  }

  usage(budget: IBudget): number {
    if (budget.plannedAmount <= 0) return budget.factAmount > 0 ? Infinity : 0;
    return budget.factAmount / budget.plannedAmount;
  }

  progressPercent(budget: IBudget): number {
    return Math.min(100, Math.round(this.usage(budget) * 100));
  }

  isOverBudget(budget: IBudget): boolean {
    return budget.factAmount > budget.plannedAmount;
  }

  // Payments are signed by category type; transfers just move money, so they're neutral.
  sign(tx: Transaction): string {
    if (this.isTransfer(tx)) return '';
    return tx.category.type === 'income' ? '+' : '−';
  }
}
