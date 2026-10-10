import { Language } from '../core/i18n/languages';
import { Theme } from '../core/theme/theme';

// The current user's own settings (more to come). language is ISO 639-1 and
// defaultCurrency ISO 4217, both picked from the region at sign-up; usedCurrencies
// are what currency pickers offer and always include defaultCurrency; theme 'system'
// follows the device; primaryHue (0–359) is the OKLCH hue the UI palette derives from.
export interface IUserSettings {
  language: Language;
  defaultCurrency: string;
  usedCurrencies: string[];
  theme: Theme;
  primaryHue: number;
}

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

// A pending invitation as the inviting family sees it. The email is the key:
// whoever signs in with it (verified by Google) can accept.
export interface IInvitation {
  id: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

// A pending invitation addressed to the current user's email.
export interface IReceivedInvitation {
  id: string;
  familyId: string;
  familyName: string;
  invitedBy: string;
  memberCount: number;
  expiresAt: Date;
}

// The current user's own open request to join someone else's family.
export interface IJoinRequest {
  id: string;
  // Whose family: the email the user named, and that family's name.
  email: string;
  familyName: string;
  createdAt: Date;
  expiresAt: Date;
}

// An open request to join the current user's family, as its admins see it.
export interface IIncomingJoinRequest {
  id: string;
  requesterId: string;
  displayName: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IFamily {
  id: string;
  name: string;
  members: IFamilyMember[];
  // Whether the admin has chosen which categories the family sees: asked once, on the
  // first other member.
  categoriesReviewed: boolean;
}

//TODO add Map monthYear is key and amount is value - plan and fact (fact for caching)
// Family ('shared') categories are the family's: every member uses them, only the admin
// changes them.
export interface ICategory {
  id: string;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
  visibility: Visibility;
  // Someone else's personal category, seen through a payment on a shared account: only
  // id and type are given, and the UI shows "Unknown category".
  unknown?: boolean;
}

// A family category a member other than the admin added, as the admin is told about it.
export interface IAddedCategory {
  category: ICategory;
  addedBy: string;
}

// Every account has one owner, who gives family members access per person:
// 'visible' = sees it, 'shared' = also records transactions on it. Members
// without a grant don't see it (docs/ARCHITECTURE.md §3.2).
export type GrantLevel = 'visible' | 'shared';

// The current user's access; 'none' only appears on the other side of a
// transaction they can see through another account.
export type AccountAccess = 'owner' | GrantLevel | 'none';

export interface IAccountGrant {
  userId: string;
  displayName: string;
  level: GrantLevel;
}

export interface IAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  owner: { id: string; displayName: string };
  access: AccountAccess;
  // Only sent to the owner.
  grants?: IAccountGrant[];
  closed: boolean;
}

// What the owner sends on create/update; grants replace the whole list.
export interface AccountInput {
  name: string;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  grants: { userId: string; level: GrantLevel }[];
}

// How a transaction shows the accounts it touches: no balance, since a
// transaction can be visible through one account while the other one isn't.
// inTransit marks a transient account between family members (see IInTransit);
// the backend always sends it, regular accounts picked in a form just lack it.
export type IAccountRef = Pick<IAccount, 'id' | 'name' | 'currency' | 'icon' | 'color' | 'access' | 'closed'> & {
  inTransit?: boolean;
};

// Money sent to a family member that they haven't collected yet. Each ordered pair
// (sender -> recipient) and currency has its own transient account; id is that
// account's. It still counts for the sender until collected.
export interface IInTransit {
  id: string;
  counterpart: { id: string; displayName: string };
  currency: string;
  amount: number;
}

export interface IFamilyTransfers {
  outgoing: IInTransit[];
  incoming: IInTransit[];
}

// Only open accounts the user owns or has shared access to take transactions.
export function canRecordOn(account: Pick<IAccount, 'access' | 'closed'>): boolean {
  return !account.closed && (account.access === 'owner' || account.access === 'shared');
}

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
  // Whether the current user may delete it (decided by the backend).
  editable: boolean;
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

// What the form records; the backend decides id and editable.
export type NewTransaction = Omit<Transaction, 'id' | 'editable'>;

export function isTransferTransaction(transaction: Transaction): transaction is TransferTransaction {
  return transaction.fromAccount !== undefined;
}

// A transfer moves money between accounts in the same currency (no FX in v1).
export function transactionCurrency(transaction: Transaction): string {
  return isTransferTransaction(transaction) ? transaction.fromAccount.currency : transaction.account.currency;
}

const ACCESS_RANK: Record<AccountAccess, number> = { none: 0, visible: 1, shared: 2, owner: 3 };

// A transaction has no owner of its own: it's shown with the most limited
// access the user has among the accounts it touches that they can see.
export function getTransactionAccess(transaction: Transaction): AccountAccess {
  const accounts = isTransferTransaction(transaction)
    ? [transaction.fromAccount, transaction.toAccount]
    : [transaction.account];
  const seen = accounts.map((a) => a.access).filter((access) => access !== 'none');
  return seen.reduce((lowest, access) => (ACCESS_RANK[access] < ACCESS_RANK[lowest] ? access : lowest), 'owner');
}
