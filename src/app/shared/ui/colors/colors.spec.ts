import { readFileSync } from 'node:fs';
import { contrast, inGamut, Oklch } from '../../../core/theme/palette';
import en from '../../../../i18n/en.json';
import { TAG_COLORS, tagColor } from './colors';

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const TOKEN = /--color-tag-([\w-]+): oklch\(([\d.]+)% ([\d.]+) ([\d.]+)\);/g;
const TOKENS = new Map(
  [...readFileSync('src/styles/theme.css', 'utf8').matchAll(TOKEN)].map(
    ([, slug, l, c, h]): [string, Oklch] => [slug, { l: +l / 100, c: +c, h: +h }],
  ),
);

describe('account and category colours', () => {
  it('offers ten distinct colours', () => {
    expect(new Set(TAG_COLORS).size).toBe(10);
  });

  it('has a theme token and a label for every colour', () => {
    expect([...TOKENS.keys()].sort()).toEqual([...TAG_COLORS].sort());
    const labels = en.tagColors as Record<string, string>;
    expect(TAG_COLORS.filter((slug) => !labels[slug])).toEqual([]);
  });

  it('keeps white icons readable and stays inside sRGB', () => {
    const failing = [...TOKENS].filter(
      ([, color]) => contrast(WHITE, color) < 4.5 || !inGamut(color),
    );

    expect(failing).toEqual([]);
  });

  it('paints a slug through its token, falling back to the primary', () => {
    expect(tagColor('teal')).toBe('var(--color-tag-teal, var(--color-primary))');
  });
});
