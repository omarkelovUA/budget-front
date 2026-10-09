// The UI palette comes from one number, the user's primary hue (.docs/redesign.md). This
// turns it into the inputs src/styles/theme.css derives every token from: the most vivid
// chroma that still fits sRGB (so no hue clips or looks muddy), and a lightness at which
// white text on the primary and on the tertiary gradient stop stays at WCAG AA.

export const DEFAULT_HUE = 150;

export const PRESETS: readonly { key: string; hue: number }[] = [
  { key: 'dollar', hue: 150 },
  { key: 'teal', hue: 185 },
  { key: 'sky', hue: 230 },
  { key: 'blue', hue: 257 },
  { key: 'indigo', hue: 280 },
  { key: 'violet', hue: 305 },
  { key: 'rose', hue: 350 },
  { key: 'red', hue: 25 },
  { key: 'amber', hue: 70 },
];

export type Oklch = { l: number; c: number; h: number };

// l is 0..1; tertiaryC is the chroma of the tertiary hue (h + 60).
export interface PaletteInputs {
  h: number;
  c: number;
  l: number;
  tertiaryC: number;
}

const MAX_CHROMA = 0.18;
const START_LIGHTNESS = 0.54;
const TERTIARY_SHIFT = 60;
const AA = 4.5;
const WHITE: Oklch = { l: 1, c: 0, h: 0 };

export function isHue(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 359;
}

export function paletteFor(hue: number): PaletteInputs {
  const tertiaryHue = (hue + TERTIARY_SHIFT) % 360;
  for (let l = START_LIGHTNESS; ; l = round(l - 0.01)) {
    const c = maxChroma(l, hue);
    const tertiaryC = maxChroma(l, tertiaryHue);
    if (
      contrast(WHITE, { l, c, h: hue }) >= AA &&
      contrast(WHITE, { l, c: tertiaryC, h: tertiaryHue }) >= AA
    ) {
      return { h: hue, c: floor(c), l, tertiaryC: floor(tertiaryC) };
    }
  }
}

// WCAG 2 contrast ratio.
export function contrast(a: Oklch, b: Oklch): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function inGamut(color: Oklch): boolean {
  return toLinearSrgb(color).every((channel) => channel >= -1e-4 && channel <= 1 + 1e-4);
}

function maxChroma(l: number, h: number): number {
  let [low, high] = [0, MAX_CHROMA];
  if (inGamut({ l, c: high, h })) return high;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    if (inGamut({ l, c: mid, h })) low = mid;
    else high = mid;
  }
  return low;
}

function luminance(color: Oklch): number {
  const [r, g, b] = toLinearSrgb(color).map((channel) => Math.min(1, Math.max(0, channel)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// OKLCH → OKLab → LMS → linear sRGB (Björn Ottosson's matrices).
function toLinearSrgb({ l, c, h }: Oklch): [number, number, number] {
  const radians = (h * Math.PI) / 180;
  const [a, b] = [c * Math.cos(radians), c * Math.sin(radians)];
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  return [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

// Chroma is rounded down, so it never leaves the gamut it was searched in.
function floor(value: number): number {
  return Math.floor(value * 1000) / 1000;
}
