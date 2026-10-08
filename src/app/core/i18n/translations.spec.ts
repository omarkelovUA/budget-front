import { KNOWN_PROBLEMS } from '../http/problem';
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
});
