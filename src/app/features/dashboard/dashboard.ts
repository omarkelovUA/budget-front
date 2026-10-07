import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthState } from '../../core/auth/auth-state';
import { IAccount, IBudget, isTransferTransaction, Transaction } from '../../model/types';
import { AccountRepository } from '../accounts/data/account-repository';
import { BudgetRepository } from '../budgets/data/budget-repository';
import { TransactionRepository } from '../transactions/data/transaction-repository';

// By the user's access: their own accounts, shared with them, only visible.
export interface CurrencyBalance {
  currency: string;
  total: number;
  owner: number;
  shared: number;
  visible: number;
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
export function balancesByCurrency(accounts: IAccount[]): CurrencyBalance[] {
  const byCurrency = new Map<string, CurrencyBalance>();
  for (const account of accounts) {
    const entry = byCurrency.get(account.currency) ?? {
      currency: account.currency,
      total: 0,
      owner: 0,
      shared: 0,
      visible: 0,
    };
    entry.total += account.balance;
    if (account.access !== 'none') entry[account.access] += account.balance;
    byCurrency.set(account.currency, entry);
  }
  return [...byCurrency.values()].sort((a, b) => a.currency.localeCompare(b.currency));
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly accountRepository = inject(AccountRepository);
  private readonly budgetRepository = inject(BudgetRepository);
  private readonly transactionRepository = inject(TransactionRepository);

  protected readonly currentUser = inject(AuthState).currentUser;
  protected readonly isTransfer = isTransferTransaction;

  private readonly thisMonth = toPeriod(new Date());
  protected readonly period = signal(this.thisMonth);
  protected readonly isCurrentMonth = computed(() => this.period() === this.thisMonth);
  protected readonly periodLabel = computed(() => {
    const [year, month] = this.period().split('-').map(Number);
    return new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(
      new Date(year, month - 1, 1),
    );
  });

  protected readonly accountsResource = rxResource({
    stream: () => this.accountRepository.getAccounts(),
  });
  protected readonly balances = computed(() => balancesByCurrency(this.accountsResource.value() ?? []));

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

  money(amount: number, currency: string): string {
    return new Intl.NumberFormat('uk-UA', { style: 'currency', currency }).format(amount);
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
  signedAmount(tx: Transaction): string {
    if (this.isTransfer(tx)) return `${tx.amount} ${tx.fromAccount.currency}`;
    const sign = tx.category.type === 'income' ? '+' : '−';
    return `${sign}${tx.amount} ${tx.account.currency}`;
  }
}
