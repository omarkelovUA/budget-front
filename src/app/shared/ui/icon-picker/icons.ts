// Icons live in public/assets as <name>.svg (Lucide, ISC: public/assets/LICENSE-lucide.txt;
// card, wallet, food, family and transit are our own). Accounts and categories store the
// path, so a name must never be renamed or removed once used. The backend assigns family
// (its write-off category) and transit (transient accounts), which aren't offered here.
// Each name has its label under icons.<name> in the translation files.
export const ACCOUNT_ICONS = [
  'card',
  'wallet',
  'cash',
  'coins',
  'savings',
  'bank',
  'safe',
  'deposit',
  'cards',
  'mobile',
  'online',
  'crypto',
  'investments',
  'lend',
  'business',
  'valuables',
  'gift',
  'home',
  'car',
  'education',
  'travel',
  'emergency',
  'reserve',
  'kids',
  'charity',
  'euro',
  'dollar',
] as const;

// Each category type has its own list; gift and lend go either way, so they're in both.
export const EXPENSE_CATEGORY_ICONS = [
  'food',
  'restaurant',
  'coffee',
  'shopping',
  'clothes',
  'home',
  'electricity',
  'water',
  'internet',
  'mobile',
  'car',
  'fuel',
  'transport',
  'travel',
  'health',
  'pharmacy',
  'sport',
  'education',
  'kids',
  'pets',
  'gift',
  'games',
  'cinema',
  'beauty',
  'repairs',
  'insurance',
  'taxes',
  'charity',
  'lend',
] as const;

export const INCOME_CATEGORY_ICONS = [
  'salary',
  'bonus',
  'freelance',
  'business',
  'investments',
  'interest',
  'rental',
  'pension',
  'benefits',
  'scholarship',
  'sales',
  'refund',
  'winnings',
  'gift',
  'lend',
  'cash',
  'wallet',
  'card',
  'other-income',
] as const;

// The longer list's length: the category form's picker keeps that height for both types.
export const CATEGORY_ICON_SLOTS = Math.max(EXPENSE_CATEGORY_ICONS.length, INCOME_CATEGORY_ICONS.length);

export function categoryIcons(type: 'income' | 'expense'): readonly string[] {
  return type === 'income' ? INCOME_CATEGORY_ICONS : EXPENSE_CATEGORY_ICONS;
}

export function iconPath(name: string): string {
  return `assets/${name}.svg`;
}

// The reverse of iconPath.
export function iconName(path: string): string {
  return path.replace(/^assets\/(.*)\.svg$/, '$1');
}
