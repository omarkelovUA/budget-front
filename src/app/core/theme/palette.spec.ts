import { contrast, DEFAULT_HUE, inGamut, isHue, Oklch, paletteFor, PRESETS } from './palette';

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const HUES = Array.from({ length: 360 }, (_, h) => h);

describe('palette', () => {
  it('accepts only whole hues from 0 to 359', () => {
    for (const hue of [0, 150, 359]) expect(isHue(hue)).toBe(true);
    for (const value of [-1, 360, 1.5, '150', NaN, null]) expect(isHue(value)).toBe(false);
  });

  it('defaults to a vivid dollar green', () => {
    const palette = paletteFor(DEFAULT_HUE);

    expect(DEFAULT_HUE).toBe(150);
    expect(palette).toEqual(expect.objectContaining({ h: 150, l: 0.54 }));
    expect(palette.c).toBeGreaterThan(0.1);
    expect(palette.c).toBeLessThanOrEqual(0.18);
  });

  it('keeps every hue inside sRGB', () => {
    const outside = HUES.filter((h) => {
      const p = paletteFor(h);
      return (
        !inGamut({ l: p.l, c: p.c, h }) || !inGamut({ l: p.l, c: p.tertiaryC, h: (h + 60) % 360 })
      );
    });

    expect(outside).toEqual([]);
  });

  it('keeps white text readable on both gradient stops for every hue', () => {
    const unreadable = HUES.filter((h) => {
      const p = paletteFor(h);
      return (
        contrast(WHITE, { l: p.l, c: p.c, h }) < 4.5 ||
        contrast(WHITE, { l: p.l, c: p.tertiaryC, h: (h + 60) % 360 }) < 4.5
      );
    });

    expect(unreadable).toEqual([]);
  });

  it('keeps primary-coloured text readable on the page in both themes for every hue', () => {
    const unreadable = HUES.filter((h) => {
      const { c } = paletteFor(h);
      return (
        contrast({ l: 0.52, c, h }, { l: 0.99, c: 0, h: 0 }) < 4.5 ||
        contrast({ l: 0.75, c: c * 0.7, h }, { l: 0.15, c: 0, h: 0 }) < 4.5
      );
    });

    expect(unreadable).toEqual([]);
  });

  it('offers nine distinct presets, dollar green first', () => {
    expect(PRESETS).toHaveLength(9);
    expect(PRESETS[0]).toEqual({ key: 'dollar', hue: 150 });
    expect(new Set(PRESETS.map((p) => p.hue)).size).toBe(9);
  });
});
