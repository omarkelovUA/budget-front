import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LoginArt } from './login-art';
import { RegisterArt } from './register-art';
import { DashboardArt } from './dashboard-art';
import { AccountsArt } from './accounts-art';
import { AccountFormArt } from './account-form-art';
import { AccountCloseArt } from './account-close-art';
import { CategoriesArt } from './categories-art';
import { CategoryFormArt } from './category-form-art';
import { TransactionsArt } from './transactions-art';
import { TransactionFormArt } from './transaction-form-art';
import { BudgetsArt } from './budgets-art';
import { BudgetFormArt } from './budget-form-art';
import { FamilyArt } from './family-art';
import { FamilyTransfersArt } from './family-transfers-art';
import { SettingsArt } from './settings-art';
import { EmptyArt } from './empty-art';

const ARTS: Type<unknown>[] = [
  LoginArt,
  RegisterArt,
  DashboardArt,
  AccountsArt,
  AccountFormArt,
  AccountCloseArt,
  CategoriesArt,
  CategoryFormArt,
  TransactionsArt,
  TransactionFormArt,
  BudgetsArt,
  BudgetFormArt,
  FamilyArt,
  FamilyTransfersArt,
  SettingsArt,
  EmptyArt,
];

describe('illustrations', () => {
  for (const art of ARTS) {
    it(`${art.name} is a decorative 320×200 drawing without text`, () => {
      const fixture = TestBed.createComponent(art);
      fixture.detectChanges();
      const host = fixture.nativeElement as HTMLElement;

      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.querySelectorAll('svg')).toHaveLength(1);
      expect(host.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 320 200');
      expect(host.querySelector('text')).toBeNull();
    });
  }
});
