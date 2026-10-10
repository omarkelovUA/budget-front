import { readFileSync } from 'node:fs';
import { faviconSvg } from './favicon';
import { DEFAULT_HUE, paletteFor, toHex } from './palette';

describe('faviconSvg', () => {
  it('is what public/favicon.svg holds for the default colour', () => {
    expect(readFileSync('public/favicon.svg', 'utf8').trim()).toBe(faviconSvg(paletteFor(DEFAULT_HUE)));
  });

  it("draws the brand mark on the primary gradient of the user's colour", () => {
    const rose = paletteFor(350);
    const svg = faviconSvg(rose);

    expect(svg).toContain(`stop-color="${toHex({ l: rose.l, c: rose.c, h: 350 })}"`);
    expect(svg).toContain(`stop-color="${toHex({ l: rose.l, c: rose.tertiaryC, h: 50 })}"`);
    expect(svg).toContain('stroke="#ffffff"');
    expect(svg).not.toBe(faviconSvg(paletteFor(DEFAULT_HUE)));
  });
});

describe('toHex', () => {
  it("converts OKLCH to sRGB hex, clipping what sRGB can't show", () => {
    expect(toHex({ l: 1, c: 0, h: 0 })).toBe('#ffffff');
    expect(toHex({ l: 0, c: 0, h: 0 })).toBe('#000000');
    expect(toHex({ l: 0.628, c: 0.2577, h: 29.23 })).toBe('#ff0000');
    expect(toHex({ l: 0.7, c: 0.4, h: 145 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});
