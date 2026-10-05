export type Visibility = 'private' | 'shared';

//TODO add Map monthYear is key and amount is value - plan and fact (fact for caching)
export interface ICategory {
  id: number;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
  visibility: Visibility;
}

export interface IAccount {
  id: number,
  name: string,
  balance: number,
  currency: string,
  icon: string,
  color: string,
  visibility: Visibility,
}

export interface IBudget {
  id: number;
  category: ICategory;
  period: string; // 'YYYY-MM'
  plannedAmount: number;
  factAmount: number;
  visibility: Visibility;
}

interface BaseTransaction {
  id: number;
  amount: number;
  date: Date;
}

interface PaymentTransaction extends BaseTransaction {
  account: IAccount;
  category: ICategory;
  fromAccount?: never;
  toAccount?: never;
}

interface TransferTransaction extends BaseTransaction {
  account?: never;
  category?: never;
  fromAccount: IAccount;
  toAccount: IAccount;
}

export type Transaction = PaymentTransaction | TransferTransaction;

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
  return transaction.fromAccount !== undefined;
}

// A transaction has no owner of its own - its visibility is derived from the
// account(s) it touches (shared if any touched account is shared).
export function getTransactionVisibility(transaction: Transaction): Visibility {
  if (isTransferTransaction(transaction)) {
    return transaction.fromAccount.visibility === 'shared' || transaction.toAccount.visibility === 'shared'
      ? 'shared'
      : 'private';
  }
  return transaction.account.visibility;
}
