import { KNOWN_PROBLEMS } from '../http/problem';
import { ACCOUNT_ICONS, EXPENSE_CATEGORY_ICONS, INCOME_CATEGORY_ICONS } from '../../shared/ui/icon-picker/icons';
import en from '../../../i18n/en.json';
import uk from '../../../i18n/uk.json';

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : keys(value, `${prefix}${key}.`),
  );
}

describe('translation files', () => {
  it('have the same keys in every language', () => {
    expect(keys(uk).sort()).toEqual(keys(en).sort());
  });

  it('have a message for every known problem type', () => {
    const errorKeys = keys(en.errors);
    expect([...KNOWN_PROBLEMS].filter((type) => !errorKeys.includes(type))).toEqual([]);
  });

  it('have a name for every icon the pickers offer', () => {
    const iconKeys = keys(en.icons);
    const offered = [...ACCOUNT_ICONS, ...EXPENSE_CATEGORY_ICONS, ...INCOME_CATEGORY_ICONS];
    expect(offered.filter((icon) => !iconKeys.includes(icon))).toEqual([]);
  });
});
