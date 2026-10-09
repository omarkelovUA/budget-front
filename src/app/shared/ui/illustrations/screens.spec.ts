import { readFileSync } from 'node:fs';

// Every page shows its header and illustration, every form panel and dialog its own
// smaller illustration, and every list its empty-state art (.docs/redesign.md).
const F = 'src/app/features';
const SCREENS: Record<string, string[]> = {
  [`${F}/auth/login-page/login-page.html`]: ['app-login-art'],
  [`${F}/auth/register-page/register-page.html`]: ['app-register-art'],
  [`${F}/dashboard/dashboard.html`]: ['app-page-header', 'app-dashboard-art'],
  [`${F}/accounts/account-list/account-list.html`]: ['app-page-header', 'app-accounts-art', 'app-empty-art'],
  [`${F}/accounts/account-form/account-form.html`]: ['app-account-form-art'],
  [`${F}/accounts/account-close/account-close.html`]: ['app-account-close-art'],
  [`${F}/categories/category-list/category-list.html`]: ['app-page-header', 'app-categories-art', 'app-empty-art'],
  [`${F}/categories/category-form/category-form.html`]: ['app-category-form-art'],
  [`${F}/transactions/transaction-list/transaction-list.html`]: [
    'app-page-header',
    'app-transactions-art',
    'app-empty-art',
  ],
  [`${F}/transactions/transaction-form/transaction-form.html`]: ['app-transaction-form-art'],
  [`${F}/budgets/budget-list/budget-list.html`]: ['app-page-header', 'app-budgets-art', 'app-empty-art'],
  [`${F}/budgets/budget-form/budget-form.html`]: ['app-budget-form-art'],
  [`${F}/family/family-page/family-page.html`]: ['app-page-header', 'app-family-art'],
  [`${F}/family-transfers/family-transfers/family-transfers.html`]: ['app-family-transfers-art'],
  [`${F}/settings/settings-dialog/settings-dialog.html`]: ['app-settings-art'],
};

describe('screens', () => {
  for (const [template, tags] of Object.entries(SCREENS)) {
    it(`${template.split('/').pop()} shows ${tags.join(', ')}`, () => {
      const html = readFileSync(template, 'utf8');

      expect(tags.filter((tag) => !html.includes(`<${tag}`))).toEqual([]);
    });
  }
});
