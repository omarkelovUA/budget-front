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

export const CATEGORY_ICONS = [
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
  'salary',
  'investments',
  'cash',
  'wallet',
  'card',
] as const;

export function iconPath(name: string): string {
  return `assets/${name}.svg`;
}
