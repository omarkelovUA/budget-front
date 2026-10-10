import { existsSync } from 'node:fs';
import { ACCOUNT_ICONS, EXPENSE_CATEGORY_ICONS, INCOME_CATEGORY_ICONS, iconPath } from './icons';

// The backend assigns these two; the pickers offer the rest.
const BACKEND_ICONS = ['family', 'transit'];

describe('icons', () => {
  it('have a file for every icon the app or the backend stores', () => {
    const missing = [...ACCOUNT_ICONS, ...EXPENSE_CATEGORY_ICONS, ...INCOME_CATEGORY_ICONS, ...BACKEND_ICONS].filter(
      (name) => !existsSync(`public/${iconPath(name)}`),
    );

    expect(missing).toEqual([]);
  });
});
