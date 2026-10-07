export type Visibility = 'private' | 'shared';

// Ids are UUID strings issued by the backend.
export interface IUser {
  id: string;
  email: string;
  displayName: string;
  // v1 simplification: a user belongs to at most one family at a time (see docs/ARCHITECTURE.md §3.2).
  familyId: string | null;
}

export type FamilyRole = 'admin' | 'member';

export interface IFamilyMember {
  user: IUser;
  role: FamilyRole;
  joinedAt: Date;
}

export interface IInvite {
  code: string;
  expiresAt: Date;
}

export interface IFamily {
  id: string;
  name: string;
  members: IFamilyMember[];
}

//TODO add Map monthYear is key and amount is value - plan and fact (fact for caching)
export interface ICategory {
  id: string;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
  visibility: Visibility;
}

export interface IAccount {
  id: string,
  name: string,
  balance: number,
  currency: string,
  icon: string,
  color: string,
  visibility: Visibility,
}

// How a transaction shows the accounts it touches: no balance, since a family
// member can see a transfer from someone's private account without seeing the
// account itself (docs/ARCHITECTURE.md §3.2).
export type IAccountRef = Omit<IAccount, 'balance'>;

export interface IBudget {
  id: string;
  category: ICategory;
  period: string; // 'YYYY-MM'
  plannedAmount: number;
  factAmount: number;
  visibility: Visibility;
}

// One currency's payments in a month (transfers excluded). Amounts in different
// currencies are never added together - there's no FX in v1.
export interface IMonthSummary {
  currency: string;
  income: number;
  expense: number;
}

interface BaseTransaction {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

interface PaymentTransaction extends BaseTransaction {
  account: IAccountRef;
  category: ICategory;
  fromAccount?: never;
  toAccount?: never;
}

interface TransferTransaction extends BaseTransaction {
  account?: never;
  category?: never;
  fromAccount: IAccountRef;
  toAccount: IAccountRef;
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
