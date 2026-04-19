
//TODO add Map monthYear is key and amount is value - plan and fact (fact for caching)
export interface ICategory {
  id: number;
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
}

export interface IAccount {
  id: number,
  name: string,
  balance: number,
  currency: string,
  icon: string,
  color: string,
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
