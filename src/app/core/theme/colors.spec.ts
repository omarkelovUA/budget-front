import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Every stylesheet outside src/styles/theme.css, and every illustration, uses the theme
// tokens, never raw colours (.docs/redesign.md), so a redesign or the user's primary
// colour reaches all of it.
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(|:\s*(?:white|black|red|green|blue|gr[ae]y|yellow)\b/i;
// SVG presentation attributes can't take var(), so illustrations colour through classes.
const SVG_PAINT = /\b(?:fill|stroke|stop-color)="(?!none")/;

function files(dir: string, extension: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path, extension) : path.endsWith(extension) ? [path] : [];
  });
}

function offenders(paths: string[], pattern: RegExp): string[] {
  return paths.flatMap((path) =>
    readFileSync(path, 'utf8')
      .split('\n')
      .filter((line) => pattern.test(line))
      .map((line) => `${path}: ${line.trim()}`),
  );
}

describe('colours', () => {
  it('come only from the theme tokens', () => {
    const stylesheets = files('src', '.css').filter((path) => path !== join('src', 'styles', 'theme.css'));

    expect(offenders(stylesheets, RAW_COLOR)).toEqual([]);
  });

  it('reach illustrations only through token classes', () => {
    const svgs = files('src', '.svg');

    expect(offenders(svgs, RAW_COLOR)).toEqual([]);
    expect(offenders(svgs, SVG_PAINT)).toEqual([]);
  });
});
