import { PaletteInputs, TERTIARY_SHIFT, toHex } from './palette';

// The browser tab's icon: the app bar's brand mark (a white coin-like ring around a soft
// glow) on a rounded tile of the primary gradient, in the user's colour. public/favicon.svg
// is this for the default hue; ThemeService swaps in the user's own.
export function faviconSvg({ h, c, l, tertiaryC }: PaletteInputs): string {
  const start = toHex({ l, c, h });
  const end = toHex({ l, c: tertiaryC, h: (h + TERTIARY_SHIFT) % 360 });
  const white = toHex({ l: 1, c: 0, h: 0 });
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0" stop-color="${start}"/><stop offset="1" stop-color="${end}"/>`,
    '</linearGradient></defs>',
    '<rect width="64" height="64" rx="16" fill="url(#g)"/>',
    `<circle cx="32" cy="32" r="17" fill="none" stroke="${white}" stroke-width="6"/>`,
    `<circle cx="32" cy="32" r="7" fill="${white}" fill-opacity="0.45"/>`,
    '</svg>',
  ].join('');
}
